import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract skill categories using AI
async function extractSkillCategories(
  title: string, 
  description: string, 
  apiKey: string
): Promise<{name: string, keywords: string[]}[]> {
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
            content: `You extract skill categories from job/task postings.

RULES:
1. Extract 1-5 relevant skill categories from this posting
2. Categories should be specific enough to be meaningful but broad enough to match multiple profiles
3. For each category, provide 3-7 related keywords

Return JSON ONLY: { "categories": [{ "name": "Category Name", "keywords": ["keyword1", "keyword2", ...] }] }`,
          },
          {
            role: "user",
            content: `Title: ${title}\nDescription: ${description}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_categories",
              description: "Extract skill categories from posting",
              parameters: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        keywords: { type: "array", items: { type: "string" } }
                      },
                      required: ["name", "keywords"]
                    }
                  }
                },
                required: ["categories"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_categories" } }
      }),
    });

    if (!response.ok) {
      console.error("AI category extraction failed:", response.status);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return result.categories || [];
    }
    return [];
  } catch (error) {
    console.error("Category extraction error:", error);
    return [];
  }
}

// Upsert categories and return their IDs
async function upsertCategories(
  categories: {name: string, keywords: string[]}[],
  supabase: any,
  opportunityType: 'job' | 'task'
): Promise<string[]> {
  const categoryIds: string[] = [];
  
  for (const cat of categories) {
    try {
      // Check if category exists (case-insensitive)
      const { data: existing } = await supabase
        .from('skill_categories')
        .select('id, keywords')
        .ilike('name', cat.name)
        .single();
      
      if (existing) {
        // Merge new keywords with existing (deduplicated)
        const mergedKeywords = [...new Set([...(existing.keywords || []), ...cat.keywords])];
        
        await supabase
          .from('skill_categories')
          .update({ 
            keywords: mergedKeywords,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        categoryIds.push(existing.id);
      } else {
        // Create new category
        const { data: newCat, error: insertError } = await supabase
          .from('skill_categories')
          .insert({
            name: cat.name,
            keywords: cat.keywords,
            [opportunityType === 'job' ? 'job_count' : 'task_count']: 1
          })
          .select('id')
          .single();
        
        if (!insertError && newCat) {
          categoryIds.push(newCat.id);
        }
      }
    } catch (error) {
      console.error(`Error upserting category ${cat.name}:`, error);
    }
  }
  
  return categoryIds;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Admin access required');
    }

    const { submission_id, action, rejection_reason, duplicate_of } = await req.json();

    console.log('Reviewing submission:', { submission_id, action, user_id: user.id });

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('community_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (fetchError || !submission) {
      throw new Error('Submission not found');
    }

    if (action === 'approve') {
      // Extract skill categories if AI is available
      let categoryIds: string[] = [];
      if (lovableApiKey) {
        const categories = await extractSkillCategories(
          submission.title,
          submission.description,
          lovableApiKey
        );
        
        if (categories.length > 0) {
          categoryIds = await upsertCategories(
            categories,
            supabase,
            submission.submission_type === 'job' ? 'job' : 'task'
          );
        }
      }

      // Insert into appropriate table
      const tableName = submission.submission_type === 'job' ? 'jobs' : 'tasks';
      const insertData: any = {
        title: submission.title,
        description: submission.description,
        compensation: submission.compensation,
        role_tags: submission.role_tags,
        og_image: submission.og_image,
        source: 'community',
        external_id: `community_${submission.id}`,
        employer_wallet: submission.submitter_wallet,
        payment_tx_signature: 'community_submission',
        skill_category_ids: categoryIds,
      };

      if (submission.submission_type === 'job') {
        insertData.link = submission.link;
      } else {
        insertData.link = submission.link;
      }

      const { error: insertError } = await supabase
        .from(tableName)
        .insert(insertData);

      if (insertError) {
        throw insertError;
      }

      // Convert pending points to actual points
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('*')
        .eq('wallet_address', submission.submitter_wallet)
        .single();

      if (userPoints) {
        const pointsToAward = submission.submission_type === 'job' ? 100 : 50;
        
        await supabase
          .from('user_points')
          .update({
            total_points: userPoints.total_points + pointsToAward,
            points_pending: Math.max(0, userPoints.points_pending - pointsToAward),
          })
          .eq('wallet_address', submission.submitter_wallet);

        // Record transaction
        await supabase
          .from('points_transactions')
          .insert({
            wallet_address: submission.submitter_wallet,
            transaction_type: 'earned',
            points: pointsToAward,
            submission_id: submission.id,
          });
      }

      // Update submission status
      await supabase
        .from('community_submissions')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          points_awarded: submission.submission_type === 'job' ? 100 : 50,
        })
        .eq('id', submission_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Submission approved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject') {
      // Remove pending points
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('points_pending')
        .eq('wallet_address', submission.submitter_wallet)
        .single();

      if (userPoints) {
        const pointsToRemove = submission.submission_type === 'job' ? 100 : 50;
        await supabase
          .from('user_points')
          .update({
            points_pending: Math.max(0, userPoints.points_pending - pointsToRemove),
          })
          .eq('wallet_address', submission.submitter_wallet);
      }

      await supabase
        .from('community_submissions')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason,
        })
        .eq('id', submission_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Submission rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'duplicate') {
      // Remove pending points
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('points_pending')
        .eq('wallet_address', submission.submitter_wallet)
        .single();

      if (userPoints) {
        const pointsToRemove = submission.submission_type === 'job' ? 100 : 50;
        await supabase
          .from('user_points')
          .update({
            points_pending: Math.max(0, userPoints.points_pending - pointsToRemove),
          })
          .eq('wallet_address', submission.submitter_wallet);
      }

      await supabase
        .from('community_submissions')
        .update({
          status: 'duplicate',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          duplicate_of,
        })
        .eq('id', submission_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Marked as duplicate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error reviewing submission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
