import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationData {
  x_user_id?: string;
  handle?: string;
  display_name?: string;
  profile_image_url?: string;
  verified?: boolean;
  wallet_address: string;
  file_path: string;
  portfolio_url?: string;
  role_tags: string[];
  consent: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const registrationData: RegistrationData = await req.json();

    console.log('Submitting registration for:', registrationData.handle || registrationData.wallet_address);

    // Check if file is a video and needs transcription
    let processedFilePath = registrationData.file_path;
    const isVideo = registrationData.file_path.match(/\.(webm|mp4|mov)$/i);
    
    if (isVideo) {
      console.log('Video detected, transcribing...');
      
      // Call transcribe-video function
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-video', {
        body: { filePath: registrationData.file_path }
      });

      if (transcribeError) {
        console.error('Transcription error:', transcribeError);
        throw new Error('Failed to transcribe video');
      }

      if (!transcribeData?.text) {
        throw new Error('No transcription text received');
      }

      console.log('Video transcribed successfully');
      
      // Save transcription as text file
      const textContent = transcribeData.text;
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const textFileName = registrationData.file_path.replace(/\.(webm|mp4|mov)$/i, '_transcript.txt');
      
      const { error: uploadError } = await supabase.storage
        .from('rei-contributor-files')
        .upload(textFileName, textBlob);

      if (uploadError) {
        console.error('Failed to save transcript:', uploadError);
        // Continue anyway, we'll use the video file
      } else {
        processedFilePath = textFileName;
        console.log('Transcript saved as:', textFileName);
      }
    }

    // Upsert registration data
    const { data, error } = await supabase
      .from('rei_registry')
      .upsert(
        {
          x_user_id: registrationData.x_user_id,
          handle: registrationData.handle,
          display_name: registrationData.display_name,
          profile_image_url: registrationData.profile_image_url,
          verified: registrationData.verified,
          wallet_address: registrationData.wallet_address,
          file_path: processedFilePath, // Use transcript file if video was transcribed
          portfolio_url: registrationData.portfolio_url,
          role_tags: registrationData.role_tags,
          consent: registrationData.consent,
        },
        { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Registration successful:', data.id);

    // TODO: Trigger NFT minting
    // This would call a Solana program to mint an SBT to the wallet_address
    // For now, we'll just log it
    console.log('NFT mint placeholder for wallet:', registrationData.wallet_address);

    return new Response(
      JSON.stringify({
        success: true,
        registration: data,
        message: 'Registration successful! Your Proof-of-Talent NFT will be minted shortly.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});