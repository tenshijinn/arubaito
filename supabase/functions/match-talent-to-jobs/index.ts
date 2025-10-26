import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchRequest {
  walletAddress?: string;
  xUserId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, xUserId }: MatchRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch talent profile
    let query = supabase.from('rei_registry').select('*');
    
    if (xUserId) {
      query = query.eq('x_user_id', xUserId);
    } else if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    } else {
      return new Response(
        JSON.stringify({ error: 'Must provide walletAddress or xUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: talent, error: talentError } = await query.single();

    if (talentError || !talent) {
      return new Response(
        JSON.stringify({ error: 'Talent profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active jobs and tasks
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active');

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active');

    if (jobsError || tasksError) {
      throw new Error('Failed to fetch opportunities');
    }

    // Score and rank opportunities
    const scoredOpportunities = [];

    // Score jobs
    for (const job of jobs || []) {
      const score = calculateMatchScore(talent, job);
      scoredOpportunities.push({
        type: 'job',
        ...job,
        matchScore: score.total,
        matchReason: score.reason
      });
    }

    // Score tasks
    for (const task of tasks || []) {
      const score = calculateMatchScore(talent, task);
      scoredOpportunities.push({
        type: 'task',
        ...task,
        matchScore: score.total,
        matchReason: score.reason
      });
    }

    // Sort by score and return top 10
    const rankedOpportunities = scoredOpportunities
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return new Response(
      JSON.stringify({ opportunities: rankedOpportunities, talent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error matching talent to jobs:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateMatchScore(talent: any, opportunity: any) {
  let score = 0;
  const reasons = [];

  // Role tag match (30 points)
  const talentTags = talent.role_tags || [];
  const oppTags = opportunity.role_tags || [];
  const matchingTags = talentTags.filter((tag: string) => oppTags.includes(tag));
  const tagScore = (matchingTags.length / Math.max(oppTags.length, 1)) * 30;
  score += tagScore;
  if (matchingTags.length > 0) {
    reasons.push(`Matches ${matchingTags.length} role tag(s): ${matchingTags.join(', ')}`);
  }

  // Profile score (20 points)
  const profileScore = (talent.profile_score || 0) * 2;
  score += profileScore;
  if (talent.profile_score >= 8) {
    reasons.push('High profile score indicates strong candidate');
  }

  // Wallet activity relevance (25 points) - simplified
  const analysis = talent.profile_analysis || {};
  if (analysis.notable_interactions) {
    score += 15;
    reasons.push('Has relevant Web3 experience');
  }
  if (analysis.wallet_activity) {
    score += 10;
    reasons.push('Active wallet with verified transactions');
  }

  // Bluechip score (10 points)
  if (talent.bluechip_verified) {
    score += 10;
    reasons.push('Bluechip verified with notable NFT holdings');
  }

  // Skills match from description (15 points) - keyword matching
  const descriptionLower = (opportunity.description || '').toLowerCase();
  const requirementsLower = (opportunity.requirements || '').toLowerCase();
  const analysisSummary = (talent.analysis_summary || '').toLowerCase();
  
  let keywordMatches = 0;
  const keywords = ['defi', 'nft', 'dao', 'smart contract', 'web3', 'blockchain', 'solana', 'ethereum'];
  
  for (const keyword of keywords) {
    if ((descriptionLower.includes(keyword) || requirementsLower.includes(keyword)) && 
        analysisSummary.includes(keyword)) {
      keywordMatches++;
    }
  }
  
  const skillScore = Math.min(keywordMatches * 3, 15);
  score += skillScore;
  if (keywordMatches > 0) {
    reasons.push(`Matches ${keywordMatches} key skill(s)`);
  }

  return {
    total: Math.round(score),
    reason: reasons.join('. ')
  };
}