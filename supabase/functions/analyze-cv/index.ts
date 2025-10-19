import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileContent, walletAddress } = await req.json();
    console.log('Analyzing CV:', fileName, 'Wallet:', walletAddress);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const COVALENT_API_KEY = Deno.env.get('COVALENT_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Web3 Proof-of-Talent Benchmarks
    const benchmarks = `
Web3 Proof-of-Talent CV Scoring Benchmarks:

You must evaluate candidates using both QUALITATIVE and QUANTITATIVE criteria for each category.

SCORING METHODOLOGY:
- Each category has a qualitative score (0-1) and quantitative score (0-1)
- Qualitative (70%): Assesses depth, clarity, relevance, and alignment with Web3 ethos
- Quantitative (30%): Rewards measurable outcomes, metrics, and data-backed achievements
- Final category score = (qualitative * 0.7 + quantitative * 0.3) * category_weight
- Total score = sum of all category scores (0-100)

QUANTITATIVE INDICATORS TO DETECT:
- Percentage improvements (e.g., "increased retention by 45%")
- User/community growth numbers (e.g., "onboarded 10K users")
- Financial metrics (e.g., "$2M raised", "managed $5M treasury")
- Technical metrics (e.g., "deployed 15 smart contracts", "reduced gas costs by 30%")
- Time/efficiency gains (e.g., "reduced processing time by 50%")
- Governance participation (e.g., "submitted 8 proposals", "achieved 90% approval rate")

CATEGORIES & WEIGHTS:

1. WEB3 EXPERIENCE & TECHNICAL DEPTH (weight: 25)
   Qualitative: 
   - Depth of blockchain/Web3 roles and responsibilities
   - Understanding of decentralized systems, tokenomics, DAOs
   - Quality of technical explanations and project descriptions
   Quantitative:
   - Metrics around contracts deployed, protocols built, TVL managed
   - User adoption numbers, transaction volumes
   - Technical performance improvements

2. DECENTRALIZATION ETHOS & COMMUNITY IMPACT (weight: 20)
   Qualitative:
   - Demonstration of commitment to decentralization principles
   - Evidence of community building, open-source contributions
   - Cultural fit with Web3 values (transparency, permissionless access)
   Quantitative:
   - Community size grown, engagement metrics
   - Number of open-source contributions, repos maintained
   - DAO participation rates, voting engagement

3. GOVERNANCE & COORDINATION (weight: 15)
   Qualitative:
   - Experience with DAO governance, proposal writing
   - Coordination across distributed teams
   - Decision-making in decentralized environments
   Quantitative:
   - Number of proposals submitted/passed
   - Voting participation percentages
   - Multi-sig signers managed, treasury decisions made

4. MEASURABLE IMPACT & OUTCOMES (weight: 25)
   Qualitative:
   - Clear articulation of project outcomes and learnings
   - Evidence of problem-solving and innovation
   - Quality of storytelling around achievements
   Quantitative:
   - Revenue/funding raised, ROI delivered
   - User growth, retention, or engagement metrics
   - Protocol TVL, volume, or market share gains

5. COMMUNICATION & DOCUMENTATION (weight: 15)
   Qualitative:
   - Clarity of role descriptions and experiences
   - Professional presentation and structure
   - Alignment with technical communication standards
   Quantitative:
   - Number of technical docs/articles published
   - Presentations given, talks delivered
   - Blog posts, tutorials, or educational content created

EXAMPLES OF STRONG QUANTITATIVE EVIDENCE:
- "Led DAO that grew from 500 to 5,000 members in 6 months"
- "Deployed 12 smart contracts managing $3M in assets"
- "Reduced transaction costs by 40% through L2 optimization"
- "Facilitated 25+ governance proposals with 85% passage rate"
- "Authored 15 technical articles with 50K+ total views"
`;

    // Call Lovable AI to analyze the CV
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert Web3 CV/resume analyzer specializing in evaluating talent for decentralized organizations.

${benchmarks}

Analyze the CV against these Web3 Proof-of-Talent benchmarks and return your response in this EXACT JSON format:

{
  "total_score": <number 0-100>,
  "categories": [
    {
      "id": "web3_experience",
      "name": "Web3 Experience & Technical Depth",
      "weight": 25,
      "qualitative_score": <number 0-1>,
      "quantitative_score": <number 0-1>,
      "final_score": <number 0-25>,
      "reason": "<explanation of scoring>",
      "examples_found": ["<specific metric or achievement found>"]
    },
    {
      "id": "decentralization_ethos",
      "name": "Decentralization Ethos & Community Impact",
      "weight": 20,
      "qualitative_score": <number 0-1>,
      "quantitative_score": <number 0-1>,
      "final_score": <number 0-20>,
      "reason": "<explanation of scoring>",
      "examples_found": ["<specific metric or achievement found>"]
    },
    {
      "id": "governance",
      "name": "Governance & Coordination",
      "weight": 15,
      "qualitative_score": <number 0-1>,
      "quantitative_score": <number 0-1>,
      "final_score": <number 0-15>,
      "reason": "<explanation of scoring>",
      "examples_found": ["<specific metric or achievement found>"]
    },
    {
      "id": "impact",
      "name": "Measurable Impact & Outcomes",
      "weight": 25,
      "qualitative_score": <number 0-1>,
      "quantitative_score": <number 0-1>,
      "final_score": <number 0-25>,
      "reason": "<explanation of scoring>",
      "examples_found": ["<specific metric or achievement found>"]
    },
    {
      "id": "communication",
      "name": "Communication & Documentation",
      "weight": 15,
      "qualitative_score": <number 0-1>,
      "quantitative_score": <number 0-1>,
      "final_score": <number 0-15>,
      "reason": "<explanation of scoring>",
      "examples_found": ["<specific metric or achievement found>"]
    }
  ],
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "recommended_improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

Calculate final_score for each category as: (qualitative_score * 0.7 + quantitative_score * 0.3) * weight

Be specific, evidence-based, and constructive. Look for quantitative metrics and measurable outcomes.`
          },
          {
            role: 'user',
            content: `Please analyze this CV:\n\n${fileContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response:', aiResponse);

    // Parse the JSON response from AI
    let analysis;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI analysis results');
    }

    // Validate and normalize scores
    analysis.total_score = Math.min(100, Math.max(0, analysis.total_score || 0));
    
    // Validate categories
    if (analysis.categories && Array.isArray(analysis.categories)) {
      analysis.categories = analysis.categories.map((cat: any) => ({
        ...cat,
        qualitative_score: Math.min(1, Math.max(0, cat.qualitative_score || 0)),
        quantitative_score: Math.min(1, Math.max(0, cat.quantitative_score || 0)),
        final_score: Math.min(cat.weight || 0, Math.max(0, cat.final_score || 0))
      }));
    }

    // Store legacy scores for backward compatibility
    analysis.overall_score = analysis.total_score;
    analysis.content_score = 0;
    analysis.structure_score = 0;
    analysis.formatting_score = 0;
    analysis.keywords_score = 0;
    analysis.experience_score = 0;
    analysis.feedback = `Total Score: ${analysis.total_score}/100\n\nTop Strengths:\n${(analysis.top_strengths || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\nRecommended Improvements:\n${(analysis.recommended_improvements || []).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`;

    // Step 1: Scan CV for blockchain keywords
    const blockchainKeywords = {
      ethereum: /ethereum|eth\b/gi,
      solana: /solana|sol\b/gi,
      bsc: /binance smart chain|bsc\b/gi,
      uniswap: /uniswap/gi,
      serum: /serum/gi,
      pancakeswap: /pancakeswap/gi
    };
    
    const detectedChains = [];
    for (const [chain, regex] of Object.entries(blockchainKeywords)) {
      if (regex.test(fileContent)) {
        detectedChains.push(chain);
      }
    }
    
    console.log('Detected blockchain keywords:', detectedChains);

    // Step 3 & 4: Wallet verification via Covalent API
    let bluechipVerified = false;
    let bluechipScore = 0;
    let bluechipDetails = null;

    if (walletAddress && COVALENT_API_KEY) {
      console.log('Starting wallet verification for:', walletAddress);
      
      const verificationResults = [];
      const earlyActivityThresholds = {
        ethereum: { startDate: '2015-01-01', endDate: '2018-12-31', protocols: ['uniswap'] },
        solana: { startDate: '2020-01-01', endDate: '2021-06-30', protocols: ['serum'] },
        bsc: { startDate: '2020-09-01', endDate: '2021-06-30', protocols: ['pancakeswap'] }
      };

      // Check Ethereum
      if (detectedChains.includes('ethereum') || detectedChains.includes('uniswap')) {
        try {
          const ethResponse = await fetch(
            `https://api.covalenthq.com/v1/eth-mainnet/address/${walletAddress}/transactions_v3/?key=${COVALENT_API_KEY}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (ethResponse.ok) {
            const ethData = await ethResponse.json();
            const transactions = ethData.data?.items || [];
            
            const earlyTxs = transactions.filter((tx: any) => {
              const txDate = new Date(tx.block_signed_at);
              return txDate >= new Date('2015-01-01') && txDate <= new Date('2018-12-31');
            });
            
            if (earlyTxs.length > 0) {
              bluechipScore += 30;
              verificationResults.push({
                chain: 'Ethereum',
                period: '2015-2018',
                transactions: earlyTxs.length,
                earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
              });
            }
          }
        } catch (error) {
          console.error('Ethereum verification error:', error);
        }
      }

      // Check Solana
      if (detectedChains.includes('solana') || detectedChains.includes('serum')) {
        try {
          const solResponse = await fetch(
            `https://api.covalenthq.com/v1/solana-mainnet/address/${walletAddress}/transactions_v3/?key=${COVALENT_API_KEY}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (solResponse.ok) {
            const solData = await solResponse.json();
            const transactions = solData.data?.items || [];
            
            const earlyTxs = transactions.filter((tx: any) => {
              const txDate = new Date(tx.block_signed_at);
              return txDate >= new Date('2020-01-01') && txDate <= new Date('2021-06-30');
            });
            
            if (earlyTxs.length > 0) {
              bluechipScore += 25;
              verificationResults.push({
                chain: 'Solana',
                period: '2020-early 2021',
                transactions: earlyTxs.length,
                earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
              });
            }
          }
        } catch (error) {
          console.error('Solana verification error:', error);
        }
      }

      // Check BSC
      if (detectedChains.includes('bsc') || detectedChains.includes('pancakeswap')) {
        try {
          const bscResponse = await fetch(
            `https://api.covalenthq.com/v1/bsc-mainnet/address/${walletAddress}/transactions_v3/?key=${COVALENT_API_KEY}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (bscResponse.ok) {
            const bscData = await bscResponse.json();
            const transactions = bscData.data?.items || [];
            
            const earlyTxs = transactions.filter((tx: any) => {
              const txDate = new Date(tx.block_signed_at);
              return txDate >= new Date('2020-09-01') && txDate <= new Date('2021-06-30');
            });
            
            if (earlyTxs.length > 0) {
              bluechipScore += 20;
              verificationResults.push({
                chain: 'BSC',
                period: 'Sept 2020-early 2021',
                transactions: earlyTxs.length,
                earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
              });
            }
          }
        } catch (error) {
          console.error('BSC verification error:', error);
        }
      }

      if (verificationResults.length > 0) {
        bluechipVerified = true;
        bluechipDetails = {
          verifications: verificationResults,
          detectedKeywords: detectedChains,
          walletAddress: walletAddress
        };
      }

      console.log('Wallet verification results:', { bluechipVerified, bluechipScore, bluechipDetails });
    }

    analysis.bluechip_verified = bluechipVerified;
    analysis.bluechip_score = bluechipScore;
    analysis.bluechip_details = bluechipDetails;
    
    // Store detailed scoring breakdown
    analysis.scoring_details = {
      total_score: analysis.total_score,
      categories: analysis.categories,
      top_strengths: analysis.top_strengths,
      recommended_improvements: analysis.recommended_improvements
    };

    console.log('CV Analysis completed:', analysis);

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-cv function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
