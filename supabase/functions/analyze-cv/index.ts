import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileContent } = await req.json();
    console.log('Analyzing CV:', fileName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // CV Analysis Benchmarks
    const benchmarks = `
CV Scoring Benchmarks:

1. CONTENT (20 points):
   - Clear professional summary/objective
   - Quantifiable achievements with metrics
   - Relevant skills and expertise
   - Industry-specific keywords

2. STRUCTURE (20 points):
   - Logical flow and organization
   - Clear section headers
   - Consistent formatting
   - Easy to scan and read

3. FORMATTING (20 points):
   - Professional font and size
   - Appropriate use of white space
   - Consistent bullet points
   - No typos or grammatical errors

4. KEYWORDS (20 points):
   - Industry-relevant terminology
   - Technical skills mentioned
   - Action verbs usage
   - ATS-friendly keywords

5. EXPERIENCE (20 points):
   - Clear job titles and dates
   - Company names included
   - Measurable achievements
   - Career progression shown
`;

    // Call Lovable AI to analyze the CV
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert CV/resume analyzer. Analyze CVs against these benchmarks and provide scores:

${benchmarks}

Provide a detailed analysis with:
1. Overall score (0-100)
2. Individual category scores (each 0-20)
3. Constructive feedback highlighting strengths and areas for improvement

Return your response in this exact JSON format:
{
  "overall_score": <number 0-100>,
  "content_score": <number 0-20>,
  "structure_score": <number 0-20>,
  "formatting_score": <number 0-20>,
  "keywords_score": <number 0-20>,
  "experience_score": <number 0-20>,
  "feedback": "<detailed string feedback>"
}

Be constructive, specific, and professional in your feedback.`
          },
          {
            role: 'user',
            content: `Please analyze this CV:\n\n${fileContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response:', aiResponse);

    // Parse the JSON response from AI
    let analysis;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI analysis results');
    }

    // Validate scores are within range
    analysis.overall_score = Math.min(100, Math.max(0, analysis.overall_score));
    analysis.content_score = Math.min(20, Math.max(0, analysis.content_score));
    analysis.structure_score = Math.min(20, Math.max(0, analysis.structure_score));
    analysis.formatting_score = Math.min(20, Math.max(0, analysis.formatting_score));
    analysis.keywords_score = Math.min(20, Math.max(0, analysis.keywords_score));
    analysis.experience_score = Math.min(20, Math.max(0, analysis.experience_score));

    console.log('CV Analysis completed:', analysis);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-cv function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
