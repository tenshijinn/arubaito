import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 10 requests per user per day for X mentions
const DAILY_RATE_LIMIT = 10;

interface JobSource {
  id: string;
  name: string;
  type: string;
  config: {
    url: string;
    target_table: string;
  };
  is_active: boolean;
  last_synced_at: string | null;
}

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  author?: string;
}

interface IngestRequest {
  action: "ingest_all" | "ingest_jobs" | "ingest_mentions" | "status";
  sourceId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: IngestRequest = await req.json();
    console.log("RSS Ingestion request:", body.action);

    switch (body.action) {
      case "status": {
        const { data: sources, error } = await supabase
          .from("job_sources")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;

        return new Response(
          JSON.stringify({ sources: sources || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "ingest_all": {
        const { data: sources, error } = await supabase
          .from("job_sources")
          .select("*")
          .eq("type", "rss")
          .eq("is_active", true);

        if (error) throw error;

        const results = [];
        for (const source of sources || []) {
          const result = await processRSSSource(source, supabase, lovableApiKey);
          results.push({ source: source.name, ...result });
        }

        return new Response(
          JSON.stringify({ success: true, results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "ingest_jobs": {
        const { data: sources, error } = await supabase
          .from("job_sources")
          .select("*")
          .eq("type", "rss")
          .eq("is_active", true)
          .in("name", ["Crypto Jobs Feed", "Crypto Tasks Feed"]);

        if (error) throw error;

        const results = [];
        for (const source of sources || []) {
          const result = await processRSSSource(source, supabase, lovableApiKey);
          results.push({ source: source.name, ...result });
        }

        return new Response(
          JSON.stringify({ success: true, results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "ingest_mentions": {
        const { data: source, error } = await supabase
          .from("job_sources")
          .select("*")
          .eq("name", "AskRei Mentions Feed")
          .single();

        if (error) throw error;

        const result = await processMentionsFeed(source, supabase, lovableApiKey);

        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action. Use: ingest_all, ingest_jobs, ingest_mentions, or status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("RSS Ingestion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchRSS(url: string): Promise<RSSItem[]> {
  console.log("Fetching RSS from:", url);
  const response = await fetch(url);
  const xml = await response.text();
  
  const items: RSSItem[] = [];
  
  // Simple XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const title = extractTag(itemXml, "title");
    const description = extractTag(itemXml, "description");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const guid = extractTag(itemXml, "guid") || link;
    const author = extractTag(itemXml, "dc:creator") || extractTag(itemXml, "author");
    
    if (title && link) {
      items.push({ title, description, link, pubDate, guid, author });
    }
  }
  
  console.log(`Parsed ${items.length} items from RSS feed`);
  return items;
}

function extractTag(xml: string, tagName: string): string {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tagName}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  
  // Handle regular content
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function generateExternalId(item: RSSItem): string {
  // Create a hash from the guid or link
  const input = item.guid || item.link;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `rss_${Math.abs(hash).toString(16)}`;
}

async function processRSSSource(source: JobSource, supabase: any, lovableApiKey: string | undefined) {
  const config = source.config;
  const targetTable = config.target_table;
  
  if (targetTable === "mentions") {
    // This should be handled by processMentionsFeed
    return { skipped: true, reason: "Mentions feed uses separate processor" };
  }
  
  try {
    const items = await fetchRSS(config.url);
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const item of items) {
      const externalId = generateExternalId(item);
      
      // Check for duplicates
      const { data: existing } = await supabase
        .from(targetTable)
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      try {
        // Use Lovable AI to extract structured data from the RSS item
        let structuredData: any = {
          title: item.title.substring(0, 200),
          description: item.description?.substring(0, 1000) || item.title,
          link: item.link,
        };
        
        if (lovableApiKey) {
          const extracted = await extractWithAI(item, lovableApiKey);
          structuredData = { ...structuredData, ...extracted };
        }
        
        // Calculate expiry (14 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 14);
        
        // Insert into appropriate table
        if (targetTable === "jobs") {
          const { error } = await supabase.from("jobs").insert({
            external_id: externalId,
            title: structuredData.title,
            description: structuredData.description,
            company_name: structuredData.company_name || "Unknown",
            compensation: structuredData.compensation,
            link: item.link,
            apply_url: item.link,
            role_tags: structuredData.role_tags || [],
            employer_wallet: "system_rss_import",
            payment_tx_signature: "rss_import_" + externalId,
            source: "rss_feed",
            status: "active",
            expires_at: expiresAt.toISOString(),
            opportunity_type: structuredData.opportunity_type || "job",
          });
          
          if (error) {
            console.error("Insert job error:", error);
            errors++;
          } else {
            inserted++;
          }
        } else if (targetTable === "tasks") {
          const { error } = await supabase.from("tasks").insert({
            external_id: externalId,
            title: structuredData.title,
            description: structuredData.description,
            company_name: structuredData.company_name || "Unknown",
            compensation: structuredData.compensation,
            link: item.link,
            role_tags: structuredData.role_tags || [],
            employer_wallet: "system_rss_import",
            payment_tx_signature: "rss_import_" + externalId,
            source: "rss_feed",
            status: "active",
            end_date: expiresAt.toISOString(),
            opportunity_type: structuredData.opportunity_type || "task",
          });
          
          if (error) {
            console.error("Insert task error:", error);
            errors++;
          } else {
            inserted++;
          }
        }
      } catch (itemError) {
        console.error("Process item error:", itemError);
        errors++;
      }
    }
    
    // Update last_synced_at
    await supabase
      .from("job_sources")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", source.id);
    
    console.log(`Source ${source.name}: inserted=${inserted}, skipped=${skipped}, errors=${errors}`);
    return { inserted, skipped, errors, total: items.length };
    
  } catch (error) {
    console.error(`Error processing source ${source.name}:`, error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function processMentionsFeed(source: JobSource, supabase: any, lovableApiKey: string | undefined) {
  const config = source.config;
  
  try {
    const items = await fetchRSS(config.url);
    let processed = 0;
    let skipped = 0;
    let replied = 0;
    let rateLimited = 0;
    let errors = 0;
    
    // Get Twitter API credentials
    const twitterConsumerKey = Deno.env.get("TWITTER_DM_CONSUMER_KEY");
    const twitterConsumerSecret = Deno.env.get("TWITTER_DM_CONSUMER_SECRET");
    const twitterAccessToken = Deno.env.get("TWITTER_DM_ACCESS_TOKEN");
    const twitterAccessTokenSecret = Deno.env.get("TWITTER_DM_ACCESS_TOKEN_SECRET");
    
    const hasTwitterCreds = twitterConsumerKey && twitterConsumerSecret && 
                            twitterAccessToken && twitterAccessTokenSecret;
    
    for (const item of items) {
      // Extract tweet ID from the link (twitter.com/user/status/TWEET_ID)
      const tweetIdMatch = item.link.match(/status\/(\d+)/);
      const tweetId = tweetIdMatch ? tweetIdMatch[1] : generateExternalId(item);
      
      // Extract author handle from the link or author field
      let authorHandle = item.author || "";
      const handleMatch = item.link.match(/twitter\.com\/([^\/]+)\/status/) || 
                          item.link.match(/x\.com\/([^\/]+)\/status/);
      if (handleMatch) {
        authorHandle = handleMatch[1];
      }
      
      // Check if already processed
      const { data: existing } = await supabase
        .from("oracle_processed_tweets")
        .select("id")
        .eq("tweet_id", tweetId)
        .maybeSingle();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Check rate limit for this user
      const today = new Date().toISOString().split("T")[0];
      const { data: userToday } = await supabase
        .from("oracle_processed_tweets")
        .select("id")
        .eq("author_handle", authorHandle)
        .eq("request_date", today);
      
      const dailyCount = (userToday || []).length;
      if (dailyCount >= DAILY_RATE_LIMIT) {
        console.log(`Rate limited: ${authorHandle} has ${dailyCount} requests today`);
        rateLimited++;
        
        // Still record the tweet as processed (without reply)
        await supabase.from("oracle_processed_tweets").insert({
          tweet_id: tweetId,
          author_handle: authorHandle,
          tweet_text: item.title,
          intent: "rate_limited",
          processed_at: new Date().toISOString(),
          request_date: today,
          daily_count: dailyCount + 1,
        });
        
        continue;
      }
      
      try {
        // Classify intent using Lovable AI
        let intent = "general";
        let response = "";
        
        if (lovableApiKey) {
          const classification = await classifyMentionIntent(item.title, lovableApiKey);
          intent = classification.intent;
          
          // Skip irrelevant mentions
          if (intent === "irrelevant") {
            await supabase.from("oracle_processed_tweets").insert({
              tweet_id: tweetId,
              author_handle: authorHandle,
              tweet_text: item.title,
              intent: "irrelevant",
              processed_at: new Date().toISOString(),
              request_date: today,
              daily_count: dailyCount + 1,
            });
            processed++;
            continue;
          }
          
          // Generate response for relevant mentions
          response = await generateMentionResponse(item.title, intent, authorHandle, lovableApiKey);
        }
        
        // Post reply to Twitter if we have credentials and a response
        let replyTweetId = null;
        if (hasTwitterCreds && response && intent !== "irrelevant") {
          try {
            replyTweetId = await postTwitterReply(
              tweetId,
              response,
              twitterConsumerKey!,
              twitterConsumerSecret!,
              twitterAccessToken!,
              twitterAccessTokenSecret!
            );
            if (replyTweetId) {
              replied++;
            }
          } catch (twitterError) {
            console.error("Twitter reply error:", twitterError);
          }
        }
        
        // Record the processed tweet
        await supabase.from("oracle_processed_tweets").insert({
          tweet_id: tweetId,
          author_handle: authorHandle,
          tweet_text: item.title,
          intent: intent,
          reply_tweet_id: replyTweetId,
          processed_at: new Date().toISOString(),
          replied_at: replyTweetId ? new Date().toISOString() : null,
          request_date: today,
          daily_count: dailyCount + 1,
        });
        
        processed++;
        
      } catch (itemError) {
        console.error("Process mention error:", itemError);
        errors++;
      }
    }
    
    // Update last_synced_at
    await supabase
      .from("job_sources")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", source.id);
    
    console.log(`Mentions processed: ${processed}, skipped: ${skipped}, replied: ${replied}, rate_limited: ${rateLimited}, errors: ${errors}`);
    return { processed, skipped, replied, rateLimited, errors, total: items.length };
    
  } catch (error) {
    console.error("Error processing mentions feed:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function extractWithAI(item: RSSItem, apiKey: string): Promise<any> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You extract structured job/task data from RSS items. Return JSON only.
Extract: company_name, compensation (if mentioned), role_tags (array of: dev, design, community, ops, product, research), opportunity_type.

OPPORTUNITY TYPE CLASSIFICATION (choose ONE):
- job: Full-time or part-time employment, mentions salary, benefits, "hiring", "position"
- contract: Fixed-term freelance, hourly rate, consulting
- task: One-time deliverable with flat payment
- bounty: Competitive/open task anyone can attempt, reward for completion
- gig: Short-term work, event-based, project-based
- quest: Gamified tasks, campaigns, leaderboard rewards

If not found, omit the field. Keep responses minimal.`,
          },
          {
            role: "user",
            content: `Title: ${item.title}\nDescription: ${item.description || "N/A"}\nLink: ${item.link}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_job_data",
              description: "Extract structured job data from RSS item",
              parameters: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  compensation: { type: "string" },
                  role_tags: { type: "array", items: { type: "string" } },
                  opportunity_type: { 
                    type: "string", 
                    enum: ["job", "contract", "task", "bounty", "gig", "quest"],
                    description: "Type of opportunity based on content analysis"
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_job_data" } },
      }),
    });

    if (!response.ok) {
      console.error("AI extraction failed:", response.status);
      return {};
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      return JSON.parse(toolCall.function.arguments);
    }
    return {};
  } catch (error) {
    console.error("AI extraction error:", error);
    return {};
  }
}

async function classifyMentionIntent(tweetText: string, apiKey: string): Promise<{ intent: string }> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You classify tweets mentioning @AskRei_ (an AI assistant for Web3 job matching).
Classify as:
- job_query: User asking about jobs/roles/positions
- task_query: User asking about tasks/bounties/gigs
- general: General question about Arubaito or Rei
- irrelevant: Spam, casual mention, not actually asking for help

Return only the classification.`,
          },
          { role: "user", content: tweetText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_intent",
              description: "Classify the tweet intent",
              parameters: {
                type: "object",
                properties: {
                  intent: { 
                    type: "string", 
                    enum: ["job_query", "task_query", "general", "irrelevant"] 
                  },
                },
                required: ["intent"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_intent" } },
      }),
    });

    if (!response.ok) {
      return { intent: "general" };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      return JSON.parse(toolCall.function.arguments);
    }
    return { intent: "general" };
  } catch (error) {
    console.error("Intent classification error:", error);
    return { intent: "general" };
  }
}

async function generateMentionResponse(tweetText: string, intent: string, authorHandle: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Rei, a warm AI assistant for Arubaito (a Web3 job portal). 
You're responding to a Twitter mention. Keep response under 250 characters.
Be helpful, friendly, and direct. Include relevant links when appropriate.

Intent: ${intent}
- job_query: Point to jobs at arubaito.app/rei
- task_query: Point to tasks/bounties at arubaito.app/rei
- general: Answer briefly, invite them to arubaito.app/rei for more

Sign off with ~Rei`,
          },
          { role: "user", content: `@${authorHandle} says: ${tweetText}` },
        ],
      }),
    });

    if (!response.ok) {
      return `Hey @${authorHandle}! Check out the latest Web3 opportunities at arubaito.app/rei ~Rei`;
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Ensure it fits in a tweet
    if (content.length > 280) {
      content = content.substring(0, 277) + "...";
    }
    
    return content;
  } catch (error) {
    console.error("Response generation error:", error);
    return `Hey @${authorHandle}! Check out the latest Web3 opportunities at arubaito.app/rei ~Rei`;
  }
}

async function postTwitterReply(
  inReplyToTweetId: string,
  text: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<string | null> {
  // OAuth 1.0a signing for Twitter API v2
  const url = "https://api.twitter.com/2/tweets";
  const method = "POST";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // OAuth parameters
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // Create signature base string
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join("&");

  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

  // Generate HMAC-SHA1 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureBaseString));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  oauthParams.oauth_signature = signatureBase64;

  // Create Authorization header
  const authHeader = "OAuth " + Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(", ");

  // Make the request
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      reply: {
        in_reply_to_tweet_id: inReplyToTweetId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twitter API error:", response.status, errorText);
    throw new Error(`Twitter API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("Tweet posted successfully:", data.data?.id);
  return data.data?.id || null;
}
