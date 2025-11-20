import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POINTS_PER_JOB = 100;
const POINTS_PER_TASK = 50;

const submissionSchema = z.object({
  submission_type: z.enum(['job', 'task']),
  submitter_wallet: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  submitter_x_user_id: z.string().max(100).optional(),
  title: z.string().min(5).max(200).trim(),
  description: z.string().min(20).max(5000).trim(),
  link: z.string().url().max(500),
  compensation: z.string().max(200).optional(),
  role_tags: z.array(z.string().max(50)).max(10).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validated = submissionSchema.parse(body);
    const {
      submission_type,
      submitter_wallet,
      submitter_x_user_id,
      title,
      description,
      link,
      compensation,
      role_tags,
    } = validated;

    console.log('Community submission received:', { submission_type, submitter_wallet, title });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for duplicates
    const duplicateCheckResponse = await fetch(
      `${supabaseUrl}/functions/v1/check-duplicate-opportunity`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ title, link, type: submission_type }),
      }
    );

    const duplicateCheck = await duplicateCheckResponse.json();

    if (duplicateCheck.isDuplicate) {
      console.log('Duplicate detected:', duplicateCheck);
      return new Response(
        JSON.stringify({
          success: false,
          isDuplicate: true,
          message: `This ${submission_type} has already been submitted: "${duplicateCheck.matchedTitle}"`,
          matchedId: duplicateCheck.matchedId,
          confidence: duplicateCheck.confidence,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch OG image
    let og_image = null;
    try {
      const ogResponse = await fetch(
        `${supabaseUrl}/functions/v1/extract-og-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ url: link }),
        }
      );
      const ogData = await ogResponse.json();
      og_image = ogData.og_image;
    } catch (error) {
      console.error('Error fetching OG image:', error);
    }

    // Insert submission
    const { data: submission, error: submissionError } = await supabase
      .from('community_submissions')
      .insert({
        submission_type,
        submitter_wallet,
        submitter_x_user_id,
        title,
        description,
        link,
        og_image,
        compensation,
        role_tags: role_tags || [],
        status: 'pending',
        points_awarded: 0,
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    // Award pending points
    const pendingPoints = submission_type === 'job' ? POINTS_PER_JOB : POINTS_PER_TASK;
    
    // Upsert user_points record
    const { error: pointsError } = await supabase
      .from('user_points')
      .upsert({
        wallet_address: submitter_wallet,
        x_user_id: submitter_x_user_id,
        points_pending: pendingPoints,
      }, {
        onConflict: 'wallet_address',
        ignoreDuplicates: false,
      });

    if (pointsError) {
      console.error('Error updating points:', pointsError);
    } else {
      // If record already exists, increment pending points
      const { data: existingPoints } = await supabase
        .from('user_points')
        .select('points_pending')
        .eq('wallet_address', submitter_wallet)
        .single();

      if (existingPoints) {
        await supabase
          .from('user_points')
          .update({
            points_pending: existingPoints.points_pending + pendingPoints,
          })
          .eq('wallet_address', submitter_wallet);
      }
    }

    console.log('Submission created successfully:', submission.id);

    return new Response(
      JSON.stringify({
        success: true,
        isDuplicate: false,
        submission,
        pendingPoints,
        message: `Your ${submission_type} has been submitted for review. You'll earn ${pendingPoints} points once approved!`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error submitting opportunity:', error);
    
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});