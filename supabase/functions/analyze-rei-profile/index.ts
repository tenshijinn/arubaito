import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  transcript: string;
  walletAddress: string;
  roleTags: string[];
}

// Moralis MCP API endpoint
const MORALIS_MCP_URL = 'http://localhost:7332';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const { transcript, walletAddress, roleTags }: AnalysisRequest = await req.json();

    console.log('Analyzing profile for wallet:', walletAddress);

    // Prepare AI analysis prompt
    const systemPrompt = `You are an expert Web3 talent evaluator. Analyze the provided video transcript and assess the contributor's profile.

Evaluation Criteria:
1. **Communication Quality** (0-25): Clarity, professionalism, confidence
2. **Web3 Experience** (0-25): Demonstrated knowledge, specific projects mentioned, blockchain understanding
3. **Technical Skills** (0-25): Relevant skills for stated roles, depth of expertise
4. **Role Fit** (0-25): Alignment with selected roles, potential contribution value

Provide your analysis in the following JSON structure:
{
  "overall_score": <number 0-100>,
  "category_scores": {
    "communication": <number 0-25>,
    "web3_experience": <number 0-25>,
    "technical_skills": <number 0-25>,
    "role_fit": <number 0-25>
  },
  "key_strengths": [<array of 3-5 brief strength statements>],
  "experience_highlights": [<array of 2-4 specific experiences or projects mentioned>],
  "recommended_improvements": [<array of 2-3 actionable suggestions>],
  "summary": "<2-3 sentence professional summary of the candidate>",
  "notable_mentions": {
    "projects": [<array of Web3 projects mentioned>],
    "technologies": [<array of technologies/tools mentioned>],
    "achievements": [<array of achievements or contributions mentioned>]
  }
}`;

    const userPrompt = `Selected Roles: ${roleTags.join(', ')}

Video Transcript:
${transcript}

Please analyze this contributor's profile based on their video introduction.`;

    // Call Lovable AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    let analysis = JSON.parse(analysisText);

    // Verify wallet history using Moralis MCP API
    let walletVerification = null;
    let bluechipScore = 0;

    if (walletAddress) {
      console.log('Verifying Solana wallet history via Moralis MCP...');
      
      try {
        // Fetch wallet transactions from Moralis MCP
        const txResponse = await fetch(`${MORALIS_MCP_URL}/getWalletTransactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: walletAddress,
            chain: 'solana'
          })
        });

        // Fetch wallet tokens from Moralis MCP
        const tokensResponse = await fetch(`${MORALIS_MCP_URL}/getWalletTokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: walletAddress,
            chain: 'solana'
          })
        });

        // Fetch wallet NFTs from Moralis MCP
        const nftsResponse = await fetch(`${MORALIS_MCP_URL}/getWalletNFTs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: walletAddress,
            chain: 'solana'
          })
        });

        if (txResponse.ok) {
          const txData = await txResponse.json();
          const transactions = txData.result || txData.transactions || [];
          
          if (transactions.length > 0) {
            // Find oldest transaction
            const timestamps = transactions
              .map((tx: any) => tx.blockTime || tx.timestamp)
              .filter((t: any) => t)
              .sort((a: number, b: number) => a - b);
            
            if (timestamps.length > 0) {
              const firstTxDate = new Date(timestamps[0] * 1000);
              const accountAge = Math.floor((Date.now() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // Calculate bluechip score based on account age and activity
              if (accountAge > 1095) bluechipScore += 40; // 3+ years
              else if (accountAge > 730) bluechipScore += 30; // 2+ years
              else if (accountAge > 365) bluechipScore += 20; // 1+ year
              
              if (transactions.length > 100) bluechipScore += 30;
              else if (transactions.length > 50) bluechipScore += 20;
              else if (transactions.length > 10) bluechipScore += 10;

              // Get token and NFT counts for additional scoring
              let tokenCount = 0;
              let nftCount = 0;

              if (tokensResponse.ok) {
                const tokensData = await tokensResponse.json();
                tokenCount = (tokensData.result || tokensData.tokens || []).length;
                if (tokenCount > 10) bluechipScore += 15;
                else if (tokenCount > 5) bluechipScore += 10;
                else if (tokenCount > 0) bluechipScore += 5;
              }

              if (nftsResponse.ok) {
                const nftsData = await nftsResponse.json();
                nftCount = (nftsData.result || nftsData.nfts || []).length;
                if (nftCount > 20) bluechipScore += 15;
                else if (nftCount > 10) bluechipScore += 10;
                else if (nftCount > 0) bluechipScore += 5;
              }

              walletVerification = {
                verified: true,
                chain: 'Solana',
                first_transaction: firstTxDate.toISOString(),
                account_age_days: accountAge,
                transaction_count: transactions.length,
                token_count: tokenCount,
                nft_count: nftCount,
                bluechip_score: Math.min(bluechipScore, 100)
              };

              console.log('Wallet verified:', walletVerification);
            }
          }
        } else {
          console.warn('Moralis MCP transaction fetch failed:', await txResponse.text());
        }
      } catch (walletError) {
        console.error('Wallet verification failed:', walletError);
        walletVerification = { verified: false, error: 'Unable to verify wallet history via Moralis MCP' };
      }
    }

    // Enhance analysis with wallet data
    if (walletVerification?.verified) {
      analysis.wallet_verification = walletVerification;
      // Adjust overall score based on wallet verification
      const walletBonus = Math.floor(bluechipScore * 0.15); // Up to 15 points bonus
      analysis.overall_score = Math.min(100, analysis.overall_score + walletBonus);
    }

    console.log('Analysis complete. Overall score:', analysis.overall_score);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rei-profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
