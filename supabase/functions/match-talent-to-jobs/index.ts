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
        id: job.id,
        title: job.title,
        company_name: job.company_name,
        description: job.description,
        compensation: job.compensation,
        link: job.link,
        apply_url: job.apply_url,
        role_tags: job.role_tags,
        created_at: job.created_at,
        opportunity_type: job.opportunity_type || 'job',
        matchScore: score.total,
        matchReason: score.reason
      });
    }

    // Score tasks
    for (const task of tasks || []) {
      const score = calculateMatchScore(talent, task);
      scoredOpportunities.push({
        type: 'task',
        id: task.id,
        title: task.title,
        company_name: task.company_name,
        description: task.description,
        compensation: task.compensation,
        link: task.link,
        role_tags: task.role_tags,
        created_at: task.created_at,
        opportunity_type: task.opportunity_type || 'task',
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

  const descriptionLower = (opportunity.description || '').toLowerCase();
  const requirementsLower = (opportunity.requirements || '').toLowerCase();
  const titleLower = (opportunity.title || '').toLowerCase();

  // 1. SKILLS MATCH (40 points max - HIGHEST PRIORITY)
  const talentSkills = (talent.skills || []).map((s: string) => s.toLowerCase());
  let skillMatches = 0;
  const matchedSkillNames: string[] = [];
  
  for (const skill of talentSkills) {
    if (descriptionLower.includes(skill) || requirementsLower.includes(skill) || titleLower.includes(skill)) {
      skillMatches++;
      matchedSkillNames.push(skill);
    }
  }
  
  if (skillMatches > 0) {
    const skillScore = Math.min(skillMatches * 10, 40);
    score += skillScore;
    reasons.push(`Matches your skills: ${matchedSkillNames.join(', ')}`);
  }

  // 2. Role tag match (30 points)
  const talentTags = talent.role_tags || [];
  const oppTags = opportunity.role_tags || [];
  const matchingTags = talentTags.filter((tag: string) => oppTags.includes(tag));
  const tagScore = (matchingTags.length / Math.max(oppTags.length, 1)) * 30;
  score += tagScore;
  if (matchingTags.length > 0) {
    reasons.push(`Matches ${matchingTags.length} role tag(s): ${matchingTags.join(', ')}`);
  }

  // 3. Profile score (15 points)
  if (talent.profile_score >= 8) {
    score += 15;
    reasons.push('High profile score');
  } else if (talent.profile_score >= 5) {
    score += 10;
  }

  // 4. Wallet activity relevance (10 points)
  const analysis = talent.profile_analysis || {};
  if (analysis.notable_interactions) {
    score += 5;
    reasons.push('Has relevant Web3 experience');
  }
  if (analysis.wallet_activity) {
    score += 5;
  }

  // 5. Bluechip verified (5 points)
  if (talent.bluechip_verified) {
    score += 5;
    reasons.push('Bluechip verified');
  }

  return {
    total: Math.round(score),
    reason: reasons.join('. ')
  };
}