import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhitelistSubmission {
  twitter_handle: string;
  x_user_id?: string;
  display_name?: string;
  profile_image_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const submission: WhitelistSubmission = await req.json();

    console.log('Received whitelist submission:', submission.twitter_handle);

    // Check if already submitted
    const { data: existing } = await supabase
      .from('twitter_whitelist_submissions')
      .select('status')
      .eq('twitter_handle', submission.twitter_handle)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Already submitted with status: ${existing.status}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert submission
    const { data, error } = await supabase
      .from('twitter_whitelist_submissions')
      .insert({
        twitter_handle: submission.twitter_handle,
        x_user_id: submission.x_user_id,
        display_name: submission.display_name,
        profile_image_url: submission.profile_image_url,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Whitelist submission created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Submission received! We will review your request.',
        data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing submission:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});