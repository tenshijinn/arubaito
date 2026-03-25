import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POINTS_CONFIG = {
  registration: 25,
  payment: 100,
};

const ATTRIBUTION_WINDOW_HOURS = 24;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      conversionType, 
      convertedWallet, 
      paymentAmount,
      sessionId,
      referralCode: directReferralCode 
    } = await req.json();

    if (!conversionType || !convertedWallet) {
      throw new Error('conversionType and convertedWallet are required');
    }

    if (!['registration', 'payment'].includes(conversionType)) {
      throw new Error('Invalid conversion type. Must be "registration" or "payment"');
    }

    console.log('Processing conversion:', { conversionType, convertedWallet, sessionId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the referral code - either from direct code or session
    let referralCode = directReferralCode;
    let clickId: string | null = null;

    if (!referralCode && sessionId) {
      // Look up the click by session ID within attribution window
      const attributionCutoff = new Date(Date.now() - ATTRIBUTION_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
      
      const { data: click } = await supabase
        .from('referral_clicks')
        .select('id, referral_code')
        .eq('session_id', sessionId)
        .gte('clicked_at', attributionCutoff)
        .single();

      if (click) {
        referralCode = click.referral_code;
        clickId = click.id;
      }
    }

    if (!referralCode) {
      console.log('No referral attribution found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'no_referral_attribution' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get referrer wallet
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('wallet_address, is_active, x_user_id')
      .eq('referral_code', referralCode)
      .single();

    if (codeError || !codeData) {
      console.log('Invalid referral code:', referralCode);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid referral code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-referral
    if (codeData.wallet_address === convertedWallet) {
      console.log('Self-referral prevented');
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'self_referral' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate conversion
    const { data: existingConversion } = await supabase
      .from('referral_conversions')
      .select('id')
      .eq('referral_code', referralCode)
      .eq('converted_wallet', convertedWallet)
      .eq('conversion_type', conversionType)
      .single();

    if (existingConversion) {
      console.log('Duplicate conversion prevented');
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'duplicate_conversion' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pointsToAward = POINTS_CONFIG[conversionType as keyof typeof POINTS_CONFIG];

    // Record conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('referral_conversions')
      .insert({
        referral_code: referralCode,
        conversion_type: conversionType,
        converted_wallet: convertedWallet,
        payment_amount: paymentAmount || null,
        points_awarded: pointsToAward,
        click_id: clickId,
      })
      .select()
      .single();

    if (conversionError) {
      console.error('Error recording conversion:', conversionError);
      throw new Error('Failed to record conversion');
    }

    // Award points to referrer
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      p_wallet_address: codeData.wallet_address,
      p_points: pointsToAward,
      p_x_user_id: codeData.x_user_id || null,
    });

    if (pointsError) {
      console.error('Error awarding points:', pointsError);
    }

    // Record points transaction
    const transactionType = conversionType === 'registration' 
      ? 'referral_registration' 
      : 'referral_payment';

    await supabase.from('points_transactions').insert({
      wallet_address: codeData.wallet_address,
      points: pointsToAward,
      transaction_type: transactionType,
      sol_amount: paymentAmount || null,
    });

    console.log(`Conversion recorded: ${conversionType}, ${pointsToAward} points to ${codeData.wallet_address}`);

    return new Response(
      JSON.stringify({
        success: true,
        conversionId: conversion.id,
        pointsAwarded: pointsToAward,
        referrerWallet: codeData.wallet_address,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in track-referral-conversion:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to track conversion' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
