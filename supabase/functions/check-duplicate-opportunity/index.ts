import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i++) track[0][i] = i;
  for (let j = 0; j <= str2.length; j++) track[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }
  return track[str2.length][str1.length];
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    // Lowercase and remove trailing slash
    return urlObj.toString().toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, link, type } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const normalizedLink = normalizeUrl(link);
    const normalizedTitle = title.toLowerCase().trim();

    // Check in existing jobs/tasks
    const tableName = type === 'job' ? 'jobs' : 'tasks';
    const { data: existingOpportunities } = await supabase
      .from(tableName)
      .select('id, title, link');

    // Check in pending community submissions
    const { data: pendingSubmissions } = await supabase
      .from('community_submissions')
      .select('id, title, link')
      .eq('submission_type', type)
      .eq('status', 'pending');

    const allOpportunities = [
      ...(existingOpportunities || []),
      ...(pendingSubmissions || []),
    ];

    // Check for URL matches
    for (const opp of allOpportunities) {
      const oppNormalizedLink = normalizeUrl(opp.link || '');
      if (oppNormalizedLink === normalizedLink) {
        return new Response(
          JSON.stringify({
            isDuplicate: true,
            confidence: 1.0,
            matchedId: opp.id,
            matchedTitle: opp.title,
            reason: 'Exact URL match',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for title similarity
    for (const opp of allOpportunities) {
      const oppNormalizedTitle = opp.title.toLowerCase().trim();
      const distance = levenshteinDistance(normalizedTitle, oppNormalizedTitle);
      const maxLength = Math.max(normalizedTitle.length, oppNormalizedTitle.length);
      const similarity = 1 - (distance / maxLength);

      if (similarity >= 0.85) { // 85% similarity threshold
        return new Response(
          JSON.stringify({
            isDuplicate: true,
            confidence: similarity,
            matchedId: opp.id,
            matchedTitle: opp.title,
            reason: `Title similarity: ${Math.round(similarity * 100)}%`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        isDuplicate: false,
        confidence: 0,
        matchedId: null,
        matchedTitle: null,
        reason: 'No duplicates found',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking duplicates:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});