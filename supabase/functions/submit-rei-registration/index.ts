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
      console.log('Video detected, attempting transcription...');
      
      try {
        // Call transcribe-video function
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-video', {
          body: { filePath: registrationData.file_path }
        });

        if (transcribeError) {
          console.warn('Transcription not available, continuing without it:', transcribeError);
          // Continue without transcription
        } else if (transcribeData?.text) {
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
      } catch (transcriptionError) {
        console.warn('Transcription failed, continuing without it:', transcriptionError);
        // Don't throw - allow registration to proceed without transcription
      }
    }

    // Run AI analysis if we have a transcript
    let profileAnalysis = null;
    let analysisSummary = null;
    let profileScore = null;

    if (processedFilePath.endsWith('_transcript.txt') || processedFilePath.endsWith('.txt')) {
      console.log('Running AI analysis on transcript...');
      
      try {
        // Get the transcript content
        const { data: transcriptData, error: downloadError } = await supabase.storage
          .from('rei-contributor-files')
          .download(processedFilePath);

        if (!downloadError && transcriptData) {
          const transcriptText = await transcriptData.text();
          
          // Call analyze-rei-profile function
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-rei-profile', {
            body: {
              transcript: transcriptText,
              walletAddress: registrationData.wallet_address,
              roleTags: registrationData.role_tags
            }
          });

          if (!analysisError && analysisData?.analysis) {
            profileAnalysis = analysisData.analysis;
            analysisSummary = analysisData.analysis.summary;
            profileScore = analysisData.analysis.overall_score;
            console.log('AI analysis completed. Score:', profileScore);
          } else {
            console.warn('Analysis failed:', analysisError);
          }
        }
      } catch (analysisError) {
        console.warn('Failed to run AI analysis:', analysisError);
        // Continue without analysis
      }
    }

    // Upsert registration data - use x_user_id for conflict since users can update their wallet
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
          file_path: processedFilePath,
          portfolio_url: registrationData.portfolio_url,
          role_tags: registrationData.role_tags,
          consent: registrationData.consent,
          profile_analysis: profileAnalysis,
          analysis_summary: analysisSummary,
          profile_score: profileScore,
        },
        { 
          onConflict: 'x_user_id',
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