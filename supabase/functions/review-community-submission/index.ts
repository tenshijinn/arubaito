import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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