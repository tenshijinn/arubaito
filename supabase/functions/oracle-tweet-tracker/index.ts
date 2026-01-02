import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 1 minute between replies
const RATE_LIMIT_SECONDS = 60;
// TTL: 7 days for deduplication
const TTL_DAYS = 7;

interface CheckRequest {
  action: "check";
  tweetId: string;
}

interface MarkRequest {
  action: "mark";
  tweetId: string;
  authorId?: string;
  authorHandle?: string;
  tweetText?: string;
  intent?: "job_query" | "task" | "general" | "irrelevant" | "rss_item";
  replyTweetId?: string;
}

interface RateCheckRequest {
  action: "rate-check";
}

interface StatsRequest {
  action: "stats";
}

type RequestBody = CheckRequest | MarkRequest | RateCheckRequest | StatsRequest;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    console.log("Oracle tracker request:", body.action);

    switch (body.action) {
      case "check": {
        const { tweetId } = body as CheckRequest;
        
        if (!tweetId) {
          return new Response(
            JSON.stringify({ error: "tweetId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if tweet was processed within the last 7 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - TTL_DAYS);

        const { data, error } = await supabase
          .from("oracle_processed_tweets")
          .select("processed_at, replied_at, reply_tweet_id")
          .eq("tweet_id", tweetId)
          .gte("processed_at", cutoff.toISOString())
          .maybeSingle();

        if (error) {
          console.error("Check error:", error);
          throw error;
        }

        if (data) {
          return new Response(
            JSON.stringify({
              processed: true,
              processedAt: data.processed_at,
              replied: !!data.replied_at,
              replyTweetId: data.reply_tweet_id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ processed: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "mark": {
        const { tweetId, authorId, authorHandle, tweetText, intent, replyTweetId } = body as MarkRequest;

        if (!tweetId) {
          return new Response(
            JSON.stringify({ error: "tweetId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const insertData: Record<string, unknown> = {
          tweet_id: tweetId,
          author_id: authorId,
          author_handle: authorHandle,
          tweet_text: tweetText,
          intent: intent,
          reply_tweet_id: replyTweetId,
          processed_at: new Date().toISOString(),
          replied_at: replyTweetId ? new Date().toISOString() : null,
        };

        const { error } = await supabase
          .from("oracle_processed_tweets")
          .upsert(insertData, { onConflict: "tweet_id" });

        if (error) {
          console.error("Mark error:", error);
          throw error;
        }

        console.log(`Marked tweet ${tweetId} as processed (intent: ${intent}, replied: ${!!replyTweetId})`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "rate-check": {
        // Get the most recent reply timestamp
        const { data, error } = await supabase
          .from("oracle_processed_tweets")
          .select("replied_at")
          .not("replied_at", "is", null)
          .order("replied_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Rate check error:", error);
          throw error;
        }

        if (!data || !data.replied_at) {
          return new Response(
            JSON.stringify({
              canReply: true,
              lastReplyAt: null,
              waitSeconds: 0,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const lastReplyTime = new Date(data.replied_at).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastReplyTime) / 1000);
        const waitSeconds = Math.max(0, RATE_LIMIT_SECONDS - elapsedSeconds);

        return new Response(
          JSON.stringify({
            canReply: waitSeconds === 0,
            lastReplyAt: data.replied_at,
            waitSeconds,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 24h stats
        const { data: last24h, error: err24h } = await supabase
          .from("oracle_processed_tweets")
          .select("id, replied_at, intent")
          .gte("processed_at", oneDayAgo.toISOString());

        if (err24h) throw err24h;

        // 7d stats
        const { data: last7d, error: err7d } = await supabase
          .from("oracle_processed_tweets")
          .select("id, replied_at, intent")
          .gte("processed_at", sevenDaysAgo.toISOString());

        if (err7d) throw err7d;

        const computeStats = (data: { id: string; replied_at: string | null; intent: string | null }[]) => ({
          processed: data.length,
          replied: data.filter((d) => d.replied_at).length,
          jobQueries: data.filter((d) => d.intent === "job_query").length,
          taskQueries: data.filter((d) => d.intent === "task").length,
          rssItems: data.filter((d) => d.intent === "rss_item").length,
        });

        return new Response(
          JSON.stringify({
            last24h: computeStats(last24h || []),
            last7d: computeStats(last7d || []),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action. Use: check, mark, rate-check, or stats" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Oracle tracker error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
