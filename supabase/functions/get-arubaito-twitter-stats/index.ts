import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SOCIALDATA_API_KEY = Deno.env.get("SOCIALDATA_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HANDLE = "arubaito_app";

let cache: { data: any; ts: number } | null = null;
const TTL_MS = 12 * 60 * 60 * 1000; // 12h

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRes = await fetch(`https://api.socialdata.tools/twitter/user/${HANDLE}`, {
      headers: { Authorization: `Bearer ${SOCIALDATA_API_KEY}`, Accept: "application/json" },
    });
    if (!userRes.ok) throw new Error(`user fetch ${userRes.status}`);
    const user = await userRes.json();

    const tweetsRes = await fetch(
      `https://api.socialdata.tools/twitter/user/${user.id}/tweets`,
      { headers: { Authorization: `Bearer ${SOCIALDATA_API_KEY}`, Accept: "application/json" } }
    );
    const tweetsJson = tweetsRes.ok ? await tweetsRes.json() : { tweets: [] };
    const latest = (tweetsJson.tweets || [])[0];

    const data = {
      handle: HANDLE,
      followers: user.followers_count ?? 0,
      tweet_count: user.statuses_count ?? 0,
      latest_tweet: latest
        ? {
            id: latest.id_str || latest.id,
            text: latest.full_text || latest.text || "",
            created_at: latest.tweet_created_at || latest.created_at,
          }
        : null,
    };
    cache = { data, ts: Date.now() };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
