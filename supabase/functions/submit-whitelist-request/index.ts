import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const whitelistSchema = z.object({
  twitter_handle: z.string().min(1).max(100).regex(/^@?[A-Za-z0-9_]{1,15}$/),
  x_user_id: z.string().max(100).optional(),
  display_name: z.string().max(200).optional(),
  profile_image_url: z.string().url().max(500).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const submission = whitelistSchema.parse(body);

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
    
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});