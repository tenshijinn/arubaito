import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  requirements: string;
  roleTags?: string[];
  walletRequirements?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requirements, roleTags, walletRequirements }: SearchRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all verified talent
    const { data: talents, error: talentError } = await supabase
      .from('rei_registry')
      .select('*')
      .eq('verified', true);

    if (talentError) {
      throw new Error('Failed to fetch talent profiles');
    }

    // Score and rank talent
    const scoredTalent = (talents || []).map(talent => {
      const score = calculateTalentScore(talent, requirements, roleTags || [], walletRequirements);
      return {
        x_user_id: talent.x_user_id,
        handle: talent.handle,
        display_name: talent.display_name,
        profile_image_url: talent.profile_image_url,
        role_tags: talent.role_tags,
        profile_score: talent.profile_score,
        bluechip_score: talent.bluechip_score,
        bluechip_verified: talent.bluechip_verified,
        analysis_summary: talent.analysis_summary,
        portfolio_url: talent.portfolio_url,
        matchScore: score.total,
        matchReason: score.reason,
        // Don't include sensitive details like wallet_address or full profile_analysis
      };
    });

    // Sort by score and return top 10
    const rankedTalent = scoredTalent
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return new Response(
      JSON.stringify({ talent: rankedTalent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error matching jobs to talent:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateTalentScore(talent: any, requirements: string, roleTags: string[], walletReqs: any) {
  let score = 0;
  const reasons = [];

  // Role tag match (30 points)
  const talentTags = talent.role_tags || [];
  const matchingTags = talentTags.filter((tag: string) => roleTags.includes(tag));
  const tagScore = roleTags.length > 0 ? (matchingTags.length / roleTags.length) * 30 : 0;
  score += tagScore;
  if (matchingTags.length > 0) {
    reasons.push(`Matches ${matchingTags.length} required role(s): ${matchingTags.join(', ')}`);
  }

  // Profile score (15 points)
  const profileScore = (talent.profile_score || 0) * 1.5;
  score += profileScore;
  if (talent.profile_score >= 8) {
    reasons.push('Exceptional profile score (8+/10)');
  }

  // Wallet activity relevance (25 points)
  const analysis = talent.profile_analysis || {};
  if (analysis.notable_interactions) {
    score += 15;
    reasons.push('Notable Web3 interactions');
  }
  if (analysis.wallet_activity) {
    score += 10;
    reasons.push('Active wallet with verified on-chain activity');
  }

  // Bluechip verified (20 points)
  if (talent.bluechip_verified) {
    score += 20;
    reasons.push(`Bluechip verified (score: ${talent.bluechip_score || 0})`);
  }

  // Skills/experience matching from requirements (10 points)
  const requirementsLower = requirements.toLowerCase();
  const summaryLower = (talent.analysis_summary || '').toLowerCase();
  
  let keywordMatches = 0;
  const keywords = extractKeywords(requirementsLower);
  
  for (const keyword of keywords) {
    if (summaryLower.includes(keyword)) {
      keywordMatches++;
    }
  }
  
  const skillScore = Math.min(keywordMatches * 2, 10);
  score += skillScore;
  if (keywordMatches > 0) {
    reasons.push(`Matches ${keywordMatches} requirement keyword(s)`);
  }

  return {
    total: Math.round(score),
    reason: reasons.join('. ')
  };
}

function extractKeywords(text: string): string[] {
  const commonKeywords = [
    'react', 'typescript', 'javascript', 'solidity', 'rust',
    'defi', 'nft', 'dao', 'dex', 'staking', 'yield',
    'smart contract', 'web3', 'blockchain', 'ethereum', 'solana',
    'frontend', 'backend', 'fullstack', 'developer', 'engineer',
    'design', 'ui', 'ux', 'product', 'marketing', 'community'
  ];
  
  return commonKeywords.filter(keyword => text.includes(keyword));
}