import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, xUserId } = await req.json();

    if (!walletAddress && !xUserId) {
      throw new Error('walletAddress or xUserId is required');
    }

    console.log('Fetching referral stats for:', { walletAddress, xUserId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's referral code
    let query = supabase.from('referral_codes').select('*');
    
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    } else if (xUserId) {
      query = query.eq('x_user_id', xUserId);
    }

    const { data: codeData, error: codeError } = await query.single();

    if (codeError || !codeData) {
      // User doesn't have a referral code yet
      return new Response(
        JSON.stringify({
          hasReferralCode: false,
          stats: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referralCode = codeData.referral_code;

    // Get click stats
    const { count: totalClicks } = await supabase
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('referral_code', referralCode);

    const { count: paidClicks } = await supabase
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('referral_code', referralCode)
      .eq('points_awarded', true);

    // Get unique visitors (unique IP hashes)
    const { data: uniqueIPs } = await supabase
      .from('referral_clicks')
      .select('ip_hash')
      .eq('referral_code', referralCode);
    
    const uniqueVisitors = new Set(uniqueIPs?.map(c => c.ip_hash)).size;

    // Get conversion stats
    const { data: conversions } = await supabase
      .from('referral_conversions')
      .select('conversion_type, points_awarded, payment_amount, created_at')
      .eq('referral_code', referralCode)
      .order('created_at', { ascending: false });

    const registrations = conversions?.filter(c => c.conversion_type === 'registration') || [];
    const payments = conversions?.filter(c => c.conversion_type === 'payment') || [];

    const totalPointsFromClicks = paidClicks || 0;
    const totalPointsFromRegistrations = registrations.reduce((sum, c) => sum + c.points_awarded, 0);
    const totalPointsFromPayments = payments.reduce((sum, c) => sum + c.points_awarded, 0);
    const totalPoints = totalPointsFromClicks + totalPointsFromRegistrations + totalPointsFromPayments;

    // Get recent activity (last 10)
    const { data: recentClicks } = await supabase
      .from('referral_clicks')
      .select('id, clicked_at, source_url, target_path, points_awarded')
      .eq('referral_code', referralCode)
      .order('clicked_at', { ascending: false })
      .limit(5);

    const recentActivity = [
      ...(recentClicks?.map(c => ({
        type: 'click',
        timestamp: c.clicked_at,
        points: c.points_awarded ? 1 : 0,
        details: c.target_path,
      })) || []),
      ...(conversions?.slice(0, 5).map(c => ({
        type: c.conversion_type,
        timestamp: c.created_at,
        points: c.points_awarded,
        details: c.payment_amount ? `$${c.payment_amount}` : null,
      })) || []),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Get daily stats for chart (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: dailyClicks } = await supabase
      .from('referral_clicks')
      .select('click_date')
      .eq('referral_code', referralCode)
      .gte('click_date', sevenDaysAgo.toISOString().split('T')[0]);

    const clicksByDay: Record<string, number> = {};
    dailyClicks?.forEach(c => {
      clicksByDay[c.click_date] = (clicksByDay[c.click_date] || 0) + 1;
    });

    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        clicks: clicksByDay[dateStr] || 0,
      });
    }

    return new Response(
      JSON.stringify({
        hasReferralCode: true,
        referralCode,
        isActive: codeData.is_active,
        createdAt: codeData.created_at,
        stats: {
          totalClicks: totalClicks || 0,
          uniqueVisitors,
          paidClicks: paidClicks || 0,
          registrations: registrations.length,
          payments: payments.length,
          totalPoints,
          breakdown: {
            clicks: totalPointsFromClicks,
            registrations: totalPointsFromRegistrations,
            payments: totalPointsFromPayments,
          },
          recentActivity,
          dailyStats,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-referral-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get referral stats' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
