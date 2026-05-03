import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHmac } from "node:crypto";

const SOCIALDATA_API_KEY = Deno.env.get("SOCIALDATA_API_KEY");
const API_KEY = Deno.env.get("TWITTER_DM_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_DM_CONSUMER_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_DM_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_DM_ACCESS_TOKEN_SECRET")?.trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HANDLE = "arubaito_app";

let cache: { data: any; ts: number } | null = null;
const TTL_MS = 12 * 60 * 60 * 1000; // 12h

function oauthHeader(method: string, url: string, queryParams: Record<string, string> = {}) {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: API_KEY!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN!,
    oauth_version: "1.0",
  };
  const allParams = { ...oauthParams, ...queryParams };
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(allParams).sort().map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
  )}`;
  const signingKey = `${encodeURIComponent(API_SECRET!)}&${encodeURIComponent(ACCESS_TOKEN_SECRET!)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");
  const signed = { ...oauthParams, oauth_signature: signature };
  return "OAuth " + Object.entries(signed).sort()
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v as string)}"`).join(", ");
}

async function fetchViaSocialData() {
  if (!SOCIALDATA_API_KEY) throw new Error("no socialdata key");
  const userRes = await fetch(`https://api.socialdata.tools/twitter/user/${HANDLE}`, {
    headers: { Authorization: `Bearer ${SOCIALDATA_API_KEY}`, Accept: "application/json" },
  });
  if (!userRes.ok) throw new Error(`socialdata user ${userRes.status}`);
  const user = await userRes.json();
  const userId = user.id_str || user.id;
  console.log("socialdata user", HANDLE, "id:", userId, "followers:", user.followers_count);
  const tweetsRes = await fetch(`https://api.socialdata.tools/twitter/user/${userId}/tweets`, {
    headers: { Authorization: `Bearer ${SOCIALDATA_API_KEY}`, Accept: "application/json" },
  });
  let latest: any = null;
  if (tweetsRes.ok) {
    const tweetsJson = await tweetsRes.json();
    const arr = tweetsJson.tweets || tweetsJson.statuses || tweetsJson.data || (Array.isArray(tweetsJson) ? tweetsJson : []);
    // skip retweets/replies
    latest = arr.find((t: any) => !t.retweeted_status && !t.in_reply_to_status_id_str && !t.in_reply_to_user_id_str) || arr[0] || null;
    console.log("socialdata tweets count:", arr.length, "latest id:", latest?.id_str || latest?.id);
  } else {
    console.error("socialdata tweets failed", tweetsRes.status, await tweetsRes.text());
  }
  return {
    handle: HANDLE,
    followers: user.followers_count ?? 0,
    tweet_count: user.statuses_count ?? 0,
    latest_tweet: latest
      ? { id: latest.id_str || latest.id, text: latest.full_text || latest.text || "", created_at: latest.tweet_created_at || latest.created_at }
      : null,
  };
}

async function fetchViaTwitterV2() {
  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) throw new Error("no twitter creds");
  const userUrl = `https://api.x.com/2/users/by/username/${HANDLE}`;
  const userQuery = { "user.fields": "public_metrics" };
  const userFullUrl = `${userUrl}?${new URLSearchParams(userQuery).toString()}`;
  const userRes = await fetch(userFullUrl, { headers: { Authorization: oauthHeader("GET", userUrl, userQuery) } });
  if (!userRes.ok) throw new Error(`twitter user ${userRes.status}: ${await userRes.text()}`);
  const userJson = await userRes.json();
  const user = userJson.data;
  const followers = user?.public_metrics?.followers_count ?? 0;
  const tweet_count = user?.public_metrics?.tweet_count ?? 0;

  const tweetsUrl = `https://api.x.com/2/users/${user.id}/tweets`;
  const tweetsQuery = { max_results: "5", "tweet.fields": "created_at", exclude: "retweets,replies" };
  const tweetsFullUrl = `${tweetsUrl}?${new URLSearchParams(tweetsQuery).toString()}`;
  const tweetsRes = await fetch(tweetsFullUrl, { headers: { Authorization: oauthHeader("GET", tweetsUrl, tweetsQuery) } });
  let latest_tweet = null;
  if (tweetsRes.ok) {
    const tj = await tweetsRes.json();
    const t = (tj.data || [])[0];
    if (t) latest_tweet = { id: t.id, text: t.text, created_at: t.created_at };
  } else {
    console.error("tweets fetch failed", tweetsRes.status, await tweetsRes.text());
  }
  return { handle: HANDLE, followers, tweet_count, latest_tweet };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const fresh = url.searchParams.get("fresh") === "1";
    if (!fresh && cache && Date.now() - cache.ts < TTL_MS && cache.data?.latest_tweet) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data;
    try {
      data = await fetchViaSocialData();
    } catch (e) {
      console.log("SocialData failed, falling back to Twitter v2:", (e as Error).message);
      data = await fetchViaTwitterV2();
    }
    cache = { data, ts: Date.now() };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("twitter stats error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
