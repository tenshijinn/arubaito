import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHmac } from "node:crypto";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SOCIALDATA_API_KEY = Deno.env.get("SOCIALDATA_API_KEY");
const API_KEY = Deno.env.get("TWITTER_DM_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_DM_CONSUMER_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_DM_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_DM_ACCESS_TOKEN_SECRET")?.trim();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HANDLE = "arubaito_app";
const CACHE_KEY = "careers_arubaito_twitter";
const TTL_MS = 24 * 60 * 60 * 1000;

type TweetData = { id: string; text: string; created_at: string } | null;
type TwitterCacheRecord = {
  handle: string;
  followers: number;
  tweet_count: number;
  latest_tweet: TweetData;
  source?: string | null;
  fetched_at?: string;
  expires_at?: string;
};

let memoryCache: { data: TwitterCacheRecord; ts: number } | null = null;

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
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v as string)}"`).join(", " );
}

function normalizeTweet(tweet: any): TweetData {
  if (!tweet) return null;
  return {
    id: String(tweet.id_str || tweet.id || ""),
    text: tweet.full_text || tweet.text || "",
    created_at: tweet.tweet_created_at || tweet.created_at || new Date().toISOString(),
  };
}

function isEligibleTweet(tweet: any) {
  if (!tweet) return false;
  if (tweet.retweeted_status || tweet.in_reply_to_status_id_str || tweet.in_reply_to_user_id_str) return false;
  if (tweet.referenced_tweets?.some((ref: any) => ref.type === "retweeted" || ref.type === "replied_to")) return false;
  const pinned = tweet.pinned === true || tweet.is_pinned === true || tweet.pinned_tweet_id === (tweet.id_str || tweet.id);
  if (pinned) return false;
  return true;
}

async function fetchViaSocialData(): Promise<TwitterCacheRecord> {
  if (!SOCIALDATA_API_KEY) throw new Error("no socialdata key");
  const userRes = await fetch(`https://api.socialdata.tools/twitter/user/${HANDLE}`, {
    headers: { Authorization: `Bearer ${SOCIALDATA_API_KEY}`, Accept: "application/json" },
  });
  if (!userRes.ok) throw new Error(`socialdata user ${userRes.status}`);
  const user = await userRes.json();
  const userId = user.id_str || user.id;
  const pinnedId = user.pinned_tweet_id_str || user.pinned_tweet_id || null;

  const tweetsRes = await fetch(`https://api.socialdata.tools/twitter/user/${userId}/tweets`, {
    headers: { Authorization: `Bearer ${SOCIALDATA_API_KEY}`, Accept: "application/json" },
  });

  let latest: any = null;
  if (tweetsRes.ok) {
    const tweetsJson = await tweetsRes.json();
    const arr = tweetsJson.tweets || tweetsJson.statuses || tweetsJson.data || (Array.isArray(tweetsJson) ? tweetsJson : []);
    latest = arr.find((t: any) => isEligibleTweet(t) && String(t.id_str || t.id || "") !== String(pinnedId || ""))
      || arr.find((t: any) => String(t.id_str || t.id || "") !== String(pinnedId || ""))
      || null;
  } else {
    console.error("socialdata tweets failed", tweetsRes.status, await tweetsRes.text());
  }

  return {
    handle: HANDLE,
    followers: user.followers_count ?? 0,
    tweet_count: user.statuses_count ?? 0,
    latest_tweet: normalizeTweet(latest),
    source: "socialdata",
  };
}

async function fetchViaTwitterV2(): Promise<TwitterCacheRecord> {
  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) throw new Error("no twitter creds");
  const userUrl = `https://api.x.com/2/users/by/username/${HANDLE}`;
  const userQuery = { "user.fields": "public_metrics,pinned_tweet_id" };
  const userFullUrl = `${userUrl}?${new URLSearchParams(userQuery).toString()}`;
  const userRes = await fetch(userFullUrl, { headers: { Authorization: oauthHeader("GET", userUrl, userQuery) } });
  if (!userRes.ok) throw new Error(`twitter user ${userRes.status}: ${await userRes.text()}`);
  const userJson = await userRes.json();
  const user = userJson.data;
  const followers = user?.public_metrics?.followers_count ?? 0;
  const tweet_count = user?.public_metrics?.tweet_count ?? 0;

  const tweetsUrl = `https://api.x.com/2/users/${user.id}/tweets`;
  const tweetsQuery = { max_results: "10", "tweet.fields": "created_at,referenced_tweets", exclude: "retweets,replies" };
  const tweetsFullUrl = `${tweetsUrl}?${new URLSearchParams(tweetsQuery).toString()}`;
  const tweetsRes = await fetch(tweetsFullUrl, { headers: { Authorization: oauthHeader("GET", tweetsUrl, tweetsQuery) } });
  let latest_tweet: TweetData = null;
  if (tweetsRes.ok) {
    const tj = await tweetsRes.json();
    const arr = tj.data || [];
    const pinnedId = user?.pinned_tweet_id;
    const t = arr.find((tweet: any) => String(tweet.id) !== String(pinnedId || "") && isEligibleTweet(tweet))
      || arr.find((tweet: any) => String(tweet.id) !== String(pinnedId || ""))
      || null;
    latest_tweet = normalizeTweet(t);
  } else {
    console.error("tweets fetch failed", tweetsRes.status, await tweetsRes.text());
  }
  return { handle: HANDLE, followers, tweet_count, latest_tweet, source: "twitter_v2" };
}

async function readPersistedCache(supabase: ReturnType<typeof createClient>): Promise<TwitterCacheRecord | null> {
  const { data, error } = await supabase
    .from("twitter_cache")
    .select("handle, followers, tweet_count, latest_tweet, source, fetched_at, expires_at")
    .eq("cache_key", CACHE_KEY)
    .maybeSingle();

  if (error) {
    console.error("twitter cache read error", error);
    return null;
  }
  return data as TwitterCacheRecord | null;
}

async function writePersistedCache(supabase: ReturnType<typeof createClient>, data: TwitterCacheRecord) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS).toISOString();
  const payload = {
    cache_key: CACHE_KEY,
    handle: data.handle,
    followers: data.followers,
    tweet_count: data.tweet_count,
    latest_tweet: data.latest_tweet,
    source: data.source || null,
    fetched_at: now.toISOString(),
    expires_at: expiresAt,
  };

  const { error } = await supabase.from("twitter_cache").upsert(payload, { onConflict: "cache_key" });
  if (error) {
    console.error("twitter cache write error", error);
  }
  return { ...data, fetched_at: payload.fetched_at, expires_at: payload.expires_at };
}

function isFresh(record?: TwitterCacheRecord | null) {
  if (!record?.expires_at) return false;
  return new Date(record.expires_at).getTime() > Date.now();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const fresh = url.searchParams.get("fresh") === "1";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!fresh && memoryCache && Date.now() - memoryCache.ts < TTL_MS && memoryCache.data?.latest_tweet) {
      return new Response(JSON.stringify(memoryCache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const persisted = await readPersistedCache(supabase);
    if (!fresh && isFresh(persisted) && persisted?.latest_tweet) {
      memoryCache = { data: persisted, ts: Date.now() };
      return new Response(JSON.stringify(persisted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data: TwitterCacheRecord;
    try {
      data = await fetchViaSocialData();
    } catch (e) {
      console.log("SocialData failed, falling back to Twitter v2:", (e as Error).message);
      data = await fetchViaTwitterV2();
    }

    const persistedData = await writePersistedCache(supabase, data);
    memoryCache = { data: persistedData, ts: Date.now() };

    return new Response(JSON.stringify(persistedData), {
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
