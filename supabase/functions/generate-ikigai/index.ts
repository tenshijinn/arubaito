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

    const systemPrompt = `You are a concise identity statement generator for Web3-native professionals.

Your job: create a tight positioning statement + psychographic ICP matches + Web3 work arenas.

STATEMENT RULES:
- Format: "I'm {Name}! I am a {role} that helps {specific ICP} {outcome}."
- ONE sentence after the name greeting. Max 20 words.
- No filler, no compound clauses, no corporate jargon.
- ICP must be specific (e.g. "early-stage protocol founders", "burned-out executives")
- Outcome must be tangible and concrete.

ICP RULES (3 items):
- Psychographic archetypes, NOT demographics
- People who would naturally be helped by this person
- Web3/future-of-work native
- Max 8 words each

ARENA RULES (3 items):
- Web3 environments where this person's ikigai comes alive
- NOT job titles, NOT Web2 companies
- Examples: "Early-stage protocol teams", "DAO coordination pods", "Network-state education hubs"
- Max 8 words each

Derive ICPs and arenas from the raw inputs, not from the statement.`;

    const userPrompt = `Generate for this person:

Name: ${name}
Passion: ${whatYouLove}
Skill: ${whatGoodAt}
World need: ${whatWorldNeeds}
Offering: ${whatPaidFor}`;

    console.log("Calling Lovable AI Gateway for ikigai generation with tool calling");

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
        max_tokens: 400,
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_ikigai_output",
              description: "Return the ikigai statement, 3 ICP matches, and 3 Web3 arenas.",
              parameters: {
                type: "object",
                properties: {
                  statement: {
                    type: "string",
                    description: "The full identity statement starting with I'm {Name}!"
                  },
                  icps: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 psychographic ICP archetypes, max 8 words each"
                  },
                  arenas: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 Web3 work environments, max 8 words each"
                  }
                },
                required: ["statement", "icps", "arenas"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_ikigai_output" } },
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
    
    // Try to extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        console.log("Generated ikigai (tool call):", parsed);
        return new Response(
          JSON.stringify({
            statement: parsed.statement,
            icps: parsed.icps || [],
            arenas: parsed.arenas || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Fallback: try content field
    const statement = data.choices?.[0]?.message?.content?.trim();
    if (statement) {
      console.log("Generated ikigai (content fallback):", statement);
      return new Response(
        JSON.stringify({ statement, icps: [], arenas: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Final fallback
    const fallbackStatement = `I'm ${name}! I am a ${whatPaidFor} that helps ${whatWorldNeeds}.`;
    return new Response(
      JSON.stringify({ statement: fallbackStatement, fallback: true, icps: [], arenas: [] }),
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
