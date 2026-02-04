import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IkigaiInput {
  name: string;
  whatYouLove: string;
  whatWorldNeeds: string;
  whatPaidFor: string;
  whatGoodAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, whatYouLove, whatWorldNeeds, whatPaidFor, whatGoodAt }: IkigaiInput = await req.json();

    // Validate required fields
    if (!name || !whatWorldNeeds || !whatPaidFor) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a concise identity statement generator. Your job is to compress someone's purpose into a single, confident identity statement.

Tone: calm, purposeful, human, non-corporate.

STRICT TEMPLATE (follow exactly):
I'm {Name}! I am a {role/offering} that helps {mission/impact}.

Rules:
- Maximum 2 sentences
- Compress intelligently, don't repeat verbatim
- Focus on value delivered to others
- Keep the role/offering concise (3-6 words max)
- Keep the mission/impact specific but brief (8-15 words max)
- NO quotes, NO bullet points, just the statement`;

    const userPrompt = `Generate an identity statement for this person:

Name: ${name}
What they can be paid for: ${whatPaidFor}
What the world needs that they address: ${whatWorldNeeds}
What they love doing: ${whatYouLove}
What they are good at: ${whatGoodAt}

Generate ONLY the identity statement, nothing else.`;

    console.log("Calling Lovable AI Gateway for ikigai generation");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const statement = data.choices?.[0]?.message?.content?.trim();

    if (!statement) {
      // Fallback to template-based statement
      const fallbackStatement = `I'm ${name}! I am a ${whatPaidFor} that helps ${whatWorldNeeds}.`;
      return new Response(
        JSON.stringify({ statement: fallbackStatement, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generated ikigai statement:", statement);

    return new Response(
      JSON.stringify({ statement }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ikigai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
