import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  submissionId: string;
  action: 'approve' | 'reject';
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      throw new Error('User is not an admin');
    }

    const { submissionId, action, notes }: ApprovalRequest = await req.json();

    console.log(`Processing ${action} for submission:`, submissionId);

    // Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from('twitter_whitelist_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== 'pending') {
      throw new Error(`Submission already ${submission.status}`);
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('twitter_whitelist_submissions')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      throw updateError;
    }

    // If approved, add to whitelist and send DM
    if (action === 'approve') {
      console.log('Adding to whitelist:', submission.twitter_handle);

      // Add to whitelist
      const { error: whitelistError } = await supabase
        .from('twitter_whitelist')
        .insert({
          twitter_handle: submission.twitter_handle,
          verification_type: 'admin_approved',
          verified_by: user.id,
          notes: notes || 'Approved via admin dashboard',
        });

      if (whitelistError) {
        console.error('Error adding to whitelist:', whitelistError);
        throw whitelistError;
      }

      // Send DM if x_user_id is available
      if (submission.x_user_id) {
        try {
          console.log('Sending welcome DM...');
          
          const { error: dmError } = await supabase.functions.invoke('send-twitter-dm', {
            body: {
              x_user_id: submission.x_user_id,
              twitter_handle: submission.twitter_handle,
            },
          });

          if (dmError) {
            console.error('Error sending DM:', dmError);
            // Don't throw - approval should succeed even if DM fails
          } else {
            // Mark DM as sent
            await supabase
              .from('twitter_whitelist_submissions')
              .update({
                dm_sent: true,
                dm_sent_at: new Date().toISOString(),
              })
              .eq('id', submissionId);

            await supabase
              .from('twitter_whitelist')
              .update({
                welcome_dm_sent: true,
                welcome_dm_sent_at: new Date().toISOString(),
              })
              .eq('twitter_handle', submission.twitter_handle);

            console.log('DM sent and marked as sent');
          }
        } catch (dmError) {
          console.error('DM sending failed:', dmError);
          // Continue - approval succeeded even if DM failed
        }
      } else {
        console.log('No x_user_id available, skipping DM');
      }
    }

    console.log(`Submission ${action}ed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Submission ${action}ed successfully`,
        dm_sent: action === 'approve' && submission.x_user_id ? true : false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing approval:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
