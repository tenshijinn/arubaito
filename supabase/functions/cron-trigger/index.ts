import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerRequest {
  action: "ingest_all" | "ingest_jobs" | "ingest_mentions" | "health";
  secret?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body: TriggerRequest = await req.json();
    console.log("Cron trigger received:", body.action);

    // Health check endpoint for monitoring
    if (body.action === "health") {
      return new Response(
        JSON.stringify({ 
          status: "ok", 
          timestamp: new Date().toISOString(),
          service: "rei-cron-trigger"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the ingest-rss-feeds function internally
    const response = await fetch(`${supabaseUrl}/functions/v1/ingest-rss-feeds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: body.action }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ingestion function error:", response.status, errorText);
      throw new Error(`Ingestion failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("Ingestion result:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: body.action,
        timestamp: new Date().toISOString(),
        result 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Cron trigger error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
