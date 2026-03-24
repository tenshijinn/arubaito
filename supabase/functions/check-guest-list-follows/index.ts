import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // DORMANT: SocialData API paused to save costs. Re-enable when funded.
    return new Response(JSON.stringify({
      found: false,
      followed_by: null,
      dormant: true,
      message: 'Follow verification is temporarily unavailable. Please use the CV Profile path to apply.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const { twitter_handle } = await req.json();
    if (!twitter_handle) {
      return new Response(JSON.stringify({ error: 'twitter_handle required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleaned = twitter_handle.replace(/^@/, '').trim().toLowerCase();
    console.log(`Checking follows for @${cleaned}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const socialDataKey = Deno.env.get('SOCIALDATA_API_KEY');
    if (!socialDataKey) {
      throw new Error('SOCIALDATA_API_KEY not configured');
    }

    // Rate limit: 1 check per 30 days per handle
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentCheck } = await supabase
      .from('guest_list_checks')
      .select('*')
      .eq('twitter_handle', cleaned)
      .gte('checked_at', thirtyDaysAgo)
      .order('checked_at', { ascending: false })
      .limit(1);

    if (recentCheck && recentCheck.length > 0) {
      const cached = recentCheck[0];
      console.log(`Rate limited: returning cached result for @${cleaned}`);
      return new Response(JSON.stringify({
        found: cached.result_found,
        followed_by: cached.followed_by,
        rate_limited: true,
        next_check_at: new Date(new Date(cached.checked_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve target user ID via SocialData
    const userRes = await fetch(`https://api.socialdata.tools/twitter/user/${cleaned}`, {
      headers: { 'Authorization': `Bearer ${socialDataKey}` },
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error('SocialData user lookup failed:', userRes.status, errText);
      if (userRes.status === 404) {
        // Log the check as not found
        await supabase.from('guest_list_checks').insert({
          twitter_handle: cleaned,
          result_found: false,
        });
        return new Response(JSON.stringify({ found: false, followed_by: null, error: 'User not found on Twitter' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`SocialData user lookup failed: ${userRes.status}`);
    }

    const userData = await userRes.json();
    const targetUserId = userData.id_str || String(userData.id);
    console.log(`Resolved @${cleaned} to ID ${targetUserId}`);

    // Fetch guest list
    const { data: whitelistData } = await supabase
      .from('twitter_whitelist')
      .select('id, twitter_handle, twitter_user_id');

    if (!whitelistData || whitelistData.length === 0) {
      await supabase.from('guest_list_checks').insert({
        twitter_handle: cleaned,
        result_found: false,
      });
      return new Response(JSON.stringify({ found: false, followed_by: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve any guest-list entries missing a cached twitter_user_id
    for (const entry of whitelistData) {
      if (!entry.twitter_user_id) {
        try {
          const guestRes = await fetch(`https://api.socialdata.tools/twitter/user/${entry.twitter_handle.toLowerCase()}`, {
            headers: { 'Authorization': `Bearer ${socialDataKey}` },
          });
          if (guestRes.ok) {
            const guestData = await guestRes.json();
            const guestId = guestData.id_str || String(guestData.id);
            entry.twitter_user_id = guestId;
            // Cache it in DB
            await supabase
              .from('twitter_whitelist')
              .update({ twitter_user_id: guestId })
              .eq('id', entry.id);
            console.log(`Cached ID for @${entry.twitter_handle}: ${guestId}`);
          } else {
            console.warn(`Could not resolve guest @${entry.twitter_handle}: ${guestRes.status}`);
          }
        } catch (e) {
          console.warn(`Error resolving guest @${entry.twitter_handle}:`, e);
        }
      }
    }

    // Check if any guest-listed account follows the target user
    let matchedHandle: string | null = null;

    for (const entry of whitelistData) {
      if (!entry.twitter_user_id) continue;

      try {
        const checkUrl = `https://api.socialdata.tools/twitter/user/${entry.twitter_user_id}/following/${targetUserId}`;
        const checkRes = await fetch(checkUrl, {
          headers: { 'Authorization': `Bearer ${socialDataKey}` },
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          // API returns { is_following: true/false }
          if (checkData.is_following) {
            matchedHandle = entry.twitter_handle;
            console.log(`Match found: @${entry.twitter_handle} follows @${cleaned}`);
            break;
          }
        } else {
          console.warn(`Follow check failed for @${entry.twitter_handle}: ${checkRes.status}`);
        }
      } catch (e) {
        console.warn(`Error checking follow for @${entry.twitter_handle}:`, e);
      }
    }

    // Log the check
    await supabase.from('guest_list_checks').insert({
      twitter_handle: cleaned,
      result_found: !!matchedHandle,
      followed_by: matchedHandle,
    });

    console.log(`Result for @${cleaned}: followed_by=${matchedHandle}`);

    return new Response(JSON.stringify({
      found: !!matchedHandle,
      followed_by: matchedHandle,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
