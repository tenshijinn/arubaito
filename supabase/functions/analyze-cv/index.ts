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

    // Step 1: Extract company/project claims from CV
    type ProjectConfig = {
      regex: RegExp;
      contracts?: string[];
      chain?: string;
    };
    
    const projectKeywords: Record<string, ProjectConfig> = {
      // DeFi Projects
      uniswap: { regex: /uniswap/gi, contracts: ['0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'] },
      aave: { regex: /aave/gi, contracts: ['0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'] },
      compound: { regex: /compound/gi, contracts: ['0xc00e94cb662c3520282e6f5717214004a7f26888'] },
      makerdao: { regex: /maker|makerdao|dai/gi, contracts: ['0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'] },
      curve: { regex: /curve\s*(finance)?/gi, contracts: ['0xd533a949740bb3306d119cc777fa900ba034cd52'] },
      yearn: { regex: /yearn/gi, contracts: ['0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e'] },
      sushi: { regex: /sushi(swap)?/gi, contracts: ['0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'] },
      
      // Solana Projects
      serum: { regex: /serum/gi, chain: 'solana' },
      raydium: { regex: /raydium/gi, chain: 'solana' },
      marinade: { regex: /marinade/gi, chain: 'solana' },
      
      // Layer 2s
      arbitrum: { regex: /arbitrum/gi, chain: 'arbitrum' },
      optimism: { regex: /optimism/gi, chain: 'optimism' },
      polygon: { regex: /polygon|matic/gi, chain: 'polygon' },
      
      // NFT/Gaming
      opensea: { regex: /opensea/gi, contracts: ['0x00000000006c3852cbef3e08e8df289169ede581'] },
      blur: { regex: /blur/gi, contracts: ['0x29469395eaf6f95920e59f858042f0e28d98a20b'] },
      
      // General blockchain mentions
      ethereum: { regex: /ethereum|eth\b/gi, chain: 'ethereum' },
      solana: { regex: /solana|sol\b/gi, chain: 'solana' },
      bsc: { regex: /binance smart chain|bsc\b/gi, chain: 'bsc' },
      base: { regex: /base\s*(chain|network)?/gi, chain: 'base' },
    };
    
    const claimedProjects: Array<{ name: string; contracts: string[]; chain: string }> = [];
    const detectedChains = new Set<string>();
    
    for (const [project, config] of Object.entries(projectKeywords)) {
      if (config.regex.test(fileContent)) {
        claimedProjects.push({
          name: project,
          contracts: config.contracts || [],
          chain: config.chain || 'ethereum'
        });
        if (config.chain) {
          detectedChains.add(config.chain);
        }
      }
    }
    
    console.log('Claimed projects in CV:', claimedProjects);
    console.log('Detected blockchain networks:', Array.from(detectedChains));

    // Step 2: Enhanced wallet verification with Proof-of-Work checks
    let bluechipVerified = false;
    let bluechipScore = 0;
    let bluechipDetails: any = null;
    const verifiedProjects: Array<any> = [];
    const unverifiedProjects: Array<any> = [];

    if (walletAddress && COVALENT_API_KEY) {
      console.log('Starting Proof-of-Work verification for wallet:', walletAddress);
      
      const verificationResults: Array<any> = [];
      const earlyActivityThresholds = {
        ethereum: { startDate: '2015-01-01', endDate: '2018-12-31' },
        solana: { startDate: '2020-01-01', endDate: '2021-06-30' },
        bsc: { startDate: '2020-09-01', endDate: '2021-06-30' }
      };

      // Check Ethereum - Both early activity AND project interactions
      if (detectedChains.has('ethereum') || claimedProjects.some(p => p.chain === 'ethereum')) {
        try {
          const ethResponse = await fetch(
            `https://api.covalenthq.com/v1/eth-mainnet/address/${walletAddress}/transactions_v3/?key=${COVALENT_API_KEY}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (ethResponse.ok) {
            const ethData = await ethResponse.json();
            const transactions = ethData.data?.items || [];
            
            // Check early activity (OG status)
            const earlyTxs = transactions.filter((tx: any) => {
              const txDate = new Date(tx.block_signed_at);
              return txDate >= new Date('2015-01-01') && txDate <= new Date('2018-12-31');
            });
            
            if (earlyTxs.length > 0) {
              bluechipScore += 30;
              verificationResults.push({
                chain: 'Ethereum',
                verificationType: 'Early Activity (OG Status)',
                period: '2015-2018',
                transactions: earlyTxs.length,
                earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
              });
            }
            
            // Verify claimed project interactions
            const ethProjects = claimedProjects.filter(p => 
              p.chain === 'ethereum' && p.contracts && p.contracts.length > 0
            );
            
            for (const project of ethProjects) {
              const projectTxs = transactions.filter((tx: any) => {
                const toAddress = tx.to_address?.toLowerCase();
                const fromAddress = tx.from_address?.toLowerCase();
                return project.contracts.some(contract => 
                  contract.toLowerCase() === toAddress || contract.toLowerCase() === fromAddress
                );
              });
              
              if (projectTxs.length > 0) {
                bluechipScore += 10;
                verifiedProjects.push({
                  name: project.name,
                  chain: 'Ethereum',
                  interactions: projectTxs.length,
                  firstInteraction: projectTxs[projectTxs.length - 1]?.block_signed_at
                });
                verificationResults.push({
                  chain: 'Ethereum',
                  verificationType: `Project Interaction: ${project.name}`,
                  transactions: projectTxs.length,
                  earliestDate: projectTxs[projectTxs.length - 1]?.block_signed_at
                });
              } else {
                unverifiedProjects.push({
                  name: project.name,
                  chain: 'Ethereum',
                  reason: 'No on-chain interactions found with project contracts'
                });
              }
            }
          }
        } catch (error) {
          console.error('Ethereum verification error:', error);
        }
      }

      // Check Solana
      if (detectedChains.has('solana') || claimedProjects.some(p => p.chain === 'solana')) {
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
                verificationType: 'Early Activity (OG Status)',
                period: '2020-early 2021',
                transactions: earlyTxs.length,
                earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
              });
            }
            
            // Note: Solana project verification limited by Covalent API
            const solProjects = claimedProjects.filter(p => p.chain === 'solana');
            if (solProjects.length > 0 && earlyTxs.length > 0) {
              // If they have early Solana activity and claim Solana projects, give partial credit
              solProjects.forEach(project => {
                verifiedProjects.push({
                  name: project.name,
                  chain: 'Solana',
                  interactions: 'verified_by_early_activity',
                  note: 'Verified by early Solana blockchain activity'
                });
              });
            }
          }
        } catch (error) {
          console.error('Solana verification error:', error);
        }
      }

      // Check BSC
      if (detectedChains.has('bsc') || claimedProjects.some(p => p.chain === 'bsc')) {
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
                verificationType: 'Early Activity (OG Status)',
                period: 'Sept 2020-early 2021',
                transactions: earlyTxs.length,
                earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
              });
            }
            
            // BSC project verification similar to Solana
            const bscProjects = claimedProjects.filter(p => p.chain === 'bsc');
            if (bscProjects.length > 0 && earlyTxs.length > 0) {
              bscProjects.forEach(project => {
                verifiedProjects.push({
                  name: project.name,
                  chain: 'BSC',
                  interactions: 'verified_by_early_activity',
                  note: 'Verified by early BSC blockchain activity'
                });
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
          claimedProjects: claimedProjects.map(p => p.name),
          verifiedProjects: verifiedProjects,
          unverifiedProjects: unverifiedProjects,
          detectedChains: Array.from(detectedChains),
          walletAddress: walletAddress,
          proofOfWork: {
            totalClaimed: claimedProjects.length,
            totalVerified: verifiedProjects.length,
            verificationRate: claimedProjects.length > 0 
              ? Math.round((verifiedProjects.length / claimedProjects.length) * 100) 
              : 0
          }
        };
      }

      console.log('Proof-of-Work verification results:', { 
        bluechipVerified, 
        bluechipScore, 
        verifiedProjects: verifiedProjects.length,
        unverifiedProjects: unverifiedProjects.length,
        bluechipDetails 
      });
    } else if (claimedProjects.length > 0 && !walletAddress) {
      // If projects are claimed but no wallet provided, note this
      console.log('WARNING: Projects claimed but no wallet provided for verification');
      unverifiedProjects.push(...claimedProjects.map(p => ({
        name: p.name,
        chain: p.chain,
        reason: 'No wallet address provided for verification'
      })));
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
