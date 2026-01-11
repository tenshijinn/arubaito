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

    // Get category names for display
    const allCategoryIds = [
      ...(talent.skill_category_ids || []),
      ...(jobs || []).flatMap((j: any) => j.skill_category_ids || []),
      ...(tasks || []).flatMap((t: any) => t.skill_category_ids || [])
    ];
    
    let categoryMap: Record<string, string> = {};
    if (allCategoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('skill_categories')
        .select('id, name')
        .in('id', [...new Set(allCategoryIds)]);
      
      categoryMap = Object.fromEntries(
        (categories || []).map((c: any) => [c.id, c.name])
      );
    }

    // Score and rank opportunities
    const scoredOpportunities = [];

    // Score jobs
    for (const job of jobs || []) {
      const score = calculateMatchScore(talent, job, categoryMap);
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
      const score = calculateMatchScore(talent, task, categoryMap);
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

function calculateMatchScore(talent: any, opportunity: any, categoryMap: Record<string, string>) {
  let score = 0;
  const reasons = [];

  // 1. CATEGORY MATCH (50 points max - HIGHEST PRIORITY)
  const talentCategoryIds = talent.skill_category_ids || [];
  const oppCategoryIds = opportunity.skill_category_ids || [];
  
  const matchingCategoryIds = talentCategoryIds.filter(
    (id: string) => oppCategoryIds.includes(id)
  );
  
  if (matchingCategoryIds.length > 0 && oppCategoryIds.length > 0) {
    const categoryScore = Math.min(
      (matchingCategoryIds.length / oppCategoryIds.length) * 50,
      50
    );
    score += categoryScore;
    
    const matchedNames = matchingCategoryIds
      .map((id: string) => categoryMap[id])
      .filter(Boolean)
      .slice(0, 3);
    
    if (matchedNames.length > 0) {
      reasons.push(`Matches your categories: ${matchedNames.join(', ')}`);
    }
  }

  // 2. Role tag match (20 points max)
  const talentTags = talent.role_tags || [];
  const oppTags = opportunity.role_tags || [];
  const matchingTags = talentTags.filter((tag: string) => oppTags.includes(tag));
  
  if (matchingTags.length > 0 && oppTags.length > 0) {
    const tagScore = (matchingTags.length / oppTags.length) * 20;
    score += tagScore;
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
  const walletVerification = analysis.wallet_verification || {};
  
  if (walletVerification.verified) {
    score += 5;
    reasons.push('Verified on-chain activity');
    
    const interactions = walletVerification.notable_interactions || [];
    if (interactions.length > 0) {
      score += 5;
    }
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
