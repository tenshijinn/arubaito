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
    const { twitter_handle } = await req.json();
    if (!twitter_handle) {
      return new Response(JSON.stringify({ error: 'twitter_handle required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleaned = twitter_handle.replace(/^@/, '').trim();
    console.log(`Checking followers for @${cleaned}`);

    // Get a Bearer token using consumer credentials (App-only auth)
    const consumerKey = Deno.env.get('TWITTER_DM_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('TWITTER_DM_CONSUMER_SECRET');
    if (!consumerKey || !consumerSecret) {
      throw new Error('Twitter API credentials not configured');
    }

    const credentials = btoa(`${encodeURIComponent(consumerKey)}:${encodeURIComponent(consumerSecret)}`);
    const tokenRes = await fetch('https://api.x.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Bearer token error:', err);
      throw new Error('Failed to get Twitter bearer token');
    }

    const { access_token: bearerToken } = await tokenRes.json();

    // Look up the user by username
    const userRes = await fetch(`https://api.x.com/2/users/by/username/${cleaned}`, {
      headers: { 'Authorization': `Bearer ${bearerToken}` },
    });

    if (!userRes.ok) {
      if (userRes.status === 404 || userRes.status === 400) {
        return new Response(JSON.stringify({ found: false, followed_by: null, error: 'User not found on Twitter' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Twitter user lookup failed: ${userRes.status}`);
    }

    const userData = await userRes.json();
    if (!userData.data) {
      return new Response(JSON.stringify({ found: false, followed_by: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.data.id;

    // Get the whitelist from our database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: whitelistData } = await supabase
      .from('twitter_whitelist')
      .select('twitter_handle');

    if (!whitelistData || whitelistData.length === 0) {
      return new Response(JSON.stringify({ found: false, followed_by: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const whitelistHandles = new Set(whitelistData.map(w => w.twitter_handle.toLowerCase()));

    // Paginate through the user's followers to find a match
    let paginationToken: string | undefined;
    let matchedHandle: string | null = null;

    // Check up to 5 pages (5000 followers max) to keep API usage reasonable
    for (let page = 0; page < 5; page++) {
      const url = new URL(`https://api.x.com/2/users/${userId}/followers`);
      url.searchParams.set('max_results', '1000');
      if (paginationToken) {
        url.searchParams.set('pagination_token', paginationToken);
      }

      const followersRes = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${bearerToken}` },
      });

      if (!followersRes.ok) {
        // Rate limited or other error - return what we have
        console.error(`Followers fetch failed: ${followersRes.status}`);
        break;
      }

      const followersData = await followersRes.json();
      const followers = followersData.data || [];

      for (const follower of followers) {
        if (whitelistHandles.has(follower.username.toLowerCase())) {
          matchedHandle = follower.username;
          break;
        }
      }

      if (matchedHandle) break;

      paginationToken = followersData.meta?.next_token;
      if (!paginationToken) break;
    }

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
