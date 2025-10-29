import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POINTS_PER_PAYMENT = 10;

interface AwardPointsRequest {
  walletAddress: string;
  reference: string;
  amount: number;
  tokenMint: string;
  tokenAmount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, reference, amount, tokenMint, tokenAmount }: AwardPointsRequest = await req.json();

    console.log('Awarding points:', { walletAddress, reference, amount });

    if (!walletAddress || !reference) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if points already awarded for this reference (idempotency)
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('solana_pay_reference', reference)
      .single();

    if (existingTransaction) {
      console.log('Points already awarded for this reference');
      return new Response(
        JSON.stringify({ success: true, message: 'Points already awarded', points: POINTS_PER_PAYMENT }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert points transaction
    const { error: transactionError } = await supabase
      .from('points_transactions')
      .insert({
        wallet_address: walletAddress,
        transaction_type: 'payment',
        points: POINTS_PER_PAYMENT,
        solana_pay_reference: reference,
        payment_token_mint: tokenMint,
        payment_token_amount: tokenAmount
      });

    if (transactionError) {
      console.error('Error inserting points transaction:', transactionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to record points transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user points
    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingPoints) {
      // Update existing points
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: existingPoints.total_points + POINTS_PER_PAYMENT
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('Error updating points:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update points' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new points record
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          wallet_address: walletAddress,
          total_points: POINTS_PER_PAYMENT
        });

      if (insertError) {
        console.error('Error creating points record:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create points record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Points awarded successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        points: POINTS_PER_PAYMENT,
        newTotal: (existingPoints?.total_points || 0) + POINTS_PER_PAYMENT
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error awarding points:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
