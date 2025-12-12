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
    const { fileName, fileContent, walletAddress, solanaWalletAddress, evmWalletAddress } = await req.json();
    
    // Use new wallet params if available, fallback to legacy walletAddress
    const solanaWallet = solanaWalletAddress || (walletAddress && !walletAddress.startsWith('0x') ? walletAddress : null);
    const evmWallet = evmWalletAddress || (walletAddress && walletAddress.startsWith('0x') ? walletAddress : null);
    
    console.log('Analyzing CV:', fileName);
    console.log('Solana Wallet:', solanaWallet);
    console.log('EVM Wallet:', evmWallet);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const COVALENT_API_KEY = Deno.env.get('COVALENT_API_KEY');
    const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY');
    
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
  "cv_content": {
    "personal_info": {
      "name": "<extracted name or 'Anonymous' if not found>",
      "location": "<extracted location or null if not found>",
      "professional_title": "<primary role/title from CV>"
    },
    "describe_yourself": "<synthesize a 2-3 sentence professional summary in format: 'I am a [Title] who helps [type of organizations] with [specific expertise]. [Brief backstory or unique value proposition]'>",
    "web3_communities": ["<community 1>", "<community 2>"],
    "hard_skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "soft_skills": ["<skill 1>", "<skill 2>"],
    "languages": ["<language 1 (proficiency)>"],
    "education": [
      {"institution": "<name>", "degree": "<degree/certification>", "year": "<year or period>"}
    ],
    "work_experience": [
      {"company": "<name>", "role": "<title>", "duration": "<period>", "highlights": ["<achievement 1>"]}
    ],
    "hobbies": ["<hobby 1>", "<hobby 2>"]
  },
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "recommended_improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

IMPORTANT for cv_content extraction:
- Extract real data from the CV, do not make up information
- For describe_yourself, synthesize a compelling professional summary based on their experience
- For web3_communities, look for DAOs, protocols, or communities they mention being part of
- For hobbies, include any personal interests, side projects, or non-work activities mentioned
- If a field has no relevant data in the CV, use an empty array [] or null

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
      
      // Layer 2s & L2 Networks
      arbitrum: { regex: /arbitrum/gi, chain: 'arbitrum' },
      optimism: { regex: /optimism|op\s*(mainnet|network)?/gi, chain: 'optimism' },
      polygon: { regex: /polygon|matic/gi, chain: 'polygon' },
      base: { regex: /base\s*(chain|network)?/gi, chain: 'base' },
      zksync: { regex: /zksync|zk\s*sync/gi, chain: 'zksync' },
      scroll: { regex: /scroll/gi, chain: 'scroll' },
      linea: { regex: /linea/gi, chain: 'linea' },
      blast: { regex: /blast\s*(network|chain)?/gi, chain: 'blast' },
      
      // Alt L1s
      avalanche: { regex: /avalanche|avax/gi, chain: 'avalanche' },
      fantom: { regex: /fantom|ftm/gi, chain: 'fantom' },
      gnosis: { regex: /gnosis|xdai/gi, chain: 'gnosis' },
      sei: { regex: /sei\s*(network)?/gi, chain: 'sei' },
      layeronex: { regex: /layer\s*one\s*x|l1x/gi, chain: 'layeronex' },
      
      // NFT/Gaming
      opensea: { regex: /opensea/gi, contracts: ['0x00000000006c3852cbef3e08e8df289169ede581'] },
      blur: { regex: /blur/gi, contracts: ['0x29469395eaf6f95920e59f858042f0e28d98a20b'] },
      
      // General blockchain mentions
      ethereum: { regex: /ethereum|eth\b/gi, chain: 'ethereum' },
      solana: { regex: /solana|sol\b/gi, chain: 'solana' },
      bsc: { regex: /binance smart chain|bsc|bnb\s*chain/gi, chain: 'bsc' },
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
    
    // Significant activities collector
    interface SignificantActivity {
      type: string;
      description: string;
      experience: string;
      chain: string;
      date: string;
      priority: number; // For sorting
    }
    const allActivities: SignificantActivity[] = [];
    
    // Known protocol addresses for activity classification
    const knownProtocols: Record<string, { name: string; type: string; experience: string }> = {
      // DEX Routers
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap', type: 'swap', experience: 'DEX trading experience' },
      '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3', type: 'swap', experience: 'DEX trading experience' },
      '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { name: 'SushiSwap', type: 'swap', experience: 'DEX trading experience' },
      '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Protocol', type: 'swap', experience: 'DEX aggregator experience' },
      '0x1111111254fb6c44bac0bed2854e76f90643097d': { name: '1inch', type: 'swap', experience: 'DEX aggregator experience' },
      // Lending
      '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9': { name: 'Aave V2', type: 'protocol', experience: 'DeFi lending experience' },
      '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'Aave V3', type: 'protocol', experience: 'DeFi lending experience' },
      '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b': { name: 'Compound', type: 'protocol', experience: 'DeFi lending experience' },
      // Staking
      '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': { name: 'Lido', type: 'stake', experience: 'Liquid staking experience' },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'transfer', experience: 'ETH wrapping experience' },
      // NFT Marketplaces
      '0x00000000006c3852cbef3e08e8df289169ede581': { name: 'OpenSea', type: 'nft', experience: 'NFT trading experience' },
      '0x00000000000001ad428e4906ae43d8f9852d0dd6': { name: 'OpenSea Seaport', type: 'nft', experience: 'NFT trading experience' },
      '0x29469395eaf6f95920e59f858042f0e28d98a20b': { name: 'Blur', type: 'nft', experience: 'NFT trading experience' },
      '0x59728544b08ab483533076417fbbb2fd0b17ce3a': { name: 'LooksRare', type: 'nft', experience: 'NFT trading experience' },
      // DAOs/Governance
      '0x408ed6354d4973f66138c91495f2f2fcbd8724c3': { name: 'Uniswap Governor', type: 'governance', experience: 'DAO governance participation' },
      '0xec568fffba86c094cf06b22134b23074dfe2252c': { name: 'Compound Governor', type: 'governance', experience: 'DAO governance participation' },
      // POAPs
      '0x22c1f6050e56d2876009903609a2cc3fef83b415': { name: 'POAP', type: 'poap', experience: 'Event attendance verification' },
    };
    
    // Function to classify a transaction
    const classifyTransaction = (tx: any, chain: string): SignificantActivity | null => {
      const toAddress = tx.to_address?.toLowerCase();
      const methodName = tx.method_name?.toLowerCase() || '';
      const txDate = tx.block_signed_at;
      
      // Check known protocols first
      if (toAddress && knownProtocols[toAddress]) {
        const protocol = knownProtocols[toAddress];
        return {
          type: protocol.type,
          description: `Interacted with ${protocol.name}`,
          experience: protocol.experience,
          chain,
          date: txDate,
          priority: protocol.type === 'governance' ? 5 : protocol.type === 'stake' ? 4 : 3
        };
      }
      
      // Classify by method name
      if (methodName.includes('swap') || methodName.includes('exchange')) {
        return {
          type: 'swap',
          description: `Executed token swap on ${chain}`,
          experience: 'DEX trading experience',
          chain,
          date: txDate,
          priority: 3
        };
      }
      
      if (methodName.includes('stake') || methodName.includes('deposit') || methodName.includes('delegate')) {
        return {
          type: 'stake',
          description: `Staked or deposited assets on ${chain}`,
          experience: 'Staking and yield farming experience',
          chain,
          date: txDate,
          priority: 4
        };
      }
      
      if (methodName.includes('vote') || methodName.includes('propose') || methodName.includes('cast')) {
        return {
          type: 'governance',
          description: `Participated in governance on ${chain}`,
          experience: 'DAO governance participation',
          chain,
          date: txDate,
          priority: 5
        };
      }
      
      if (methodName.includes('mint') || methodName.includes('safetransferfrom') || methodName.includes('claim')) {
        return {
          type: 'nft',
          description: `NFT activity on ${chain}`,
          experience: 'NFT minting and collecting experience',
          chain,
          date: txDate,
          priority: 2
        };
      }
      
      if (methodName.includes('addliquidity') || methodName.includes('removeliquidity')) {
        return {
          type: 'liquidity',
          description: `Provided liquidity on ${chain}`,
          experience: 'Liquidity provision experience',
          chain,
          date: txDate,
          priority: 4
        };
      }
      
      // FALLBACK: Check for value transfers (ETH/native token transfers)
      if (tx.value && parseFloat(tx.value) > 0) {
        return {
          type: 'transfer',
          description: `Native token transfer on ${chain}`,
          experience: `Blockchain transaction experience on ${chain}`,
          chain,
          date: txDate,
          priority: 1
        };
      }
      
      // FALLBACK: Check for token transfers
      if (tx.log_events?.length > 0 || tx.token_transfers?.length > 0) {
        return {
          type: 'transfer',
          description: `Token transfer on ${chain}`,
          experience: `Token management experience on ${chain}`,
          chain,
          date: txDate,
          priority: 1
        };
      }
      
      // FALLBACK: Any contract interaction (has to_address and is a contract call)
      const gasSpent = typeof tx.gas_spent === 'string' ? parseInt(tx.gas_spent) : (tx.gas_spent || 0);
      if (toAddress && gasSpent > 21000) {
        return {
          type: 'protocol',
          description: `Smart contract interaction on ${chain}`,
          experience: `DeFi/dApp experience on ${chain}`,
          chain,
          date: txDate,
          priority: 1
        };
      }
      
      // FINAL FALLBACK: Any transaction with a hash is at least blockchain activity
      if (tx.tx_hash || tx.hash || tx.signature) {
        return {
          type: 'transfer',
          description: `Blockchain transaction on ${chain}`,
          experience: `On-chain activity on ${chain}`,
          chain,
          date: txDate,
          priority: 0
        };
      }
      
      return null;
    };

    // Helper function to fetch Solana transactions via Helius
    const fetchSolanaTransactionsHelius = async (wallet: string): Promise<any[]> => {
      if (!HELIUS_API_KEY) {
        console.log('HELIUS_API_KEY not configured, skipping Helius');
        return [];
      }
      
      try {
        console.log('Fetching Solana transactions via Helius for:', wallet);
        
        // Get signatures first
        const signaturesResponse = await fetch(
          `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=100`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (!signaturesResponse.ok) {
          console.error('Helius signatures error:', signaturesResponse.status);
          return [];
        }
        
        const transactions = await signaturesResponse.json();
        console.log('Helius returned', transactions.length, 'transactions');
        return transactions;
      } catch (error) {
        console.error('Helius fetch error:', error);
        return [];
      }
    };

    // Helper function to classify Helius transaction
    const classifyHeliusTransaction = (tx: any): SignificantActivity | null => {
      const txDate = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString();
      const type = tx.type?.toLowerCase() || '';
      const source = tx.source?.toLowerCase() || '';
      
      // Helius provides pre-classified types
      if (type.includes('swap') || source.includes('jupiter') || source.includes('raydium') || source.includes('orca')) {
        return {
          type: 'swap',
          description: `Swapped tokens on ${tx.source || 'Solana DEX'}`,
          experience: 'DEX trading experience on Solana',
          chain: 'Solana',
          date: txDate,
          priority: 3
        };
      }
      
      if (type.includes('stake') || type.includes('deposit') || source.includes('marinade') || source.includes('lido')) {
        return {
          type: 'stake',
          description: `Staked assets on ${tx.source || 'Solana'}`,
          experience: 'Staking experience on Solana',
          chain: 'Solana',
          date: txDate,
          priority: 4
        };
      }
      
      if (type.includes('nft') || type.includes('compressed_nft') || source.includes('magic_eden') || source.includes('tensor')) {
        return {
          type: 'nft',
          description: `NFT activity on ${tx.source || 'Solana'}`,
          experience: 'NFT trading on Solana',
          chain: 'Solana',
          date: txDate,
          priority: 2
        };
      }
      
      if (type.includes('transfer') && tx.tokenTransfers?.length > 0) {
        return {
          type: 'transfer',
          description: `Token transfer on Solana`,
          experience: 'Token management on Solana',
          chain: 'Solana',
          date: txDate,
          priority: 1
        };
      }
      
      return null;
    };

    const hasAnyWallet = solanaWallet || evmWallet;
    
    if (hasAnyWallet && (HELIUS_API_KEY || COVALENT_API_KEY)) {
      console.log('Starting Proof-of-Work verification');
      
      const verificationResults: Array<any> = [];
      const earlyActivityThresholds = {
        ethereum: { startDate: '2015-01-01', endDate: '2018-12-31' },
        solana: { startDate: '2020-01-01', endDate: '2021-06-30' },
        bsc: { startDate: '2020-09-01', endDate: '2021-06-30' }
      };

      // Check Solana using Helius (primary) with Covalent fallback
      if (solanaWallet) {
        console.log('Processing Solana wallet:', solanaWallet);
        let solanaTransactions: any[] = [];
        let usedHelius = false;
        
        // Try Helius first
        if (HELIUS_API_KEY) {
          solanaTransactions = await fetchSolanaTransactionsHelius(solanaWallet);
          usedHelius = solanaTransactions.length > 0;
        }
        
        // Fallback to Covalent if Helius failed
        if (!usedHelius && COVALENT_API_KEY) {
          console.log('Falling back to Covalent for Solana');
          try {
            const solResponse = await fetch(
              `https://api.covalenthq.com/v1/solana-mainnet/address/${solanaWallet}/transactions_v3/?key=${COVALENT_API_KEY}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            
            if (solResponse.ok) {
              const solData = await solResponse.json();
              solanaTransactions = solData.data?.items || [];
            }
          } catch (error) {
            console.error('Covalent Solana error:', error);
          }
        }
        
        // Process Solana transactions
        if (solanaTransactions.length > 0) {
          console.log('Processing', solanaTransactions.length, 'Solana transactions');
          
          for (const tx of solanaTransactions.slice(0, 100)) {
            const activity = usedHelius 
              ? classifyHeliusTransaction(tx) 
              : classifyTransaction(tx, 'Solana');
            if (activity) {
              allActivities.push(activity);
            }
          }
          
          // Check early activity for OG status
          const earlyTxs = solanaTransactions.filter((tx: any) => {
            const txDate = usedHelius 
              ? new Date(tx.timestamp * 1000) 
              : new Date(tx.block_signed_at);
            return txDate >= new Date('2020-01-01') && txDate <= new Date('2021-06-30');
          });
          
          if (earlyTxs.length > 0) {
            bluechipScore += 25;
            verificationResults.push({
              chain: 'Solana',
              verificationType: 'Early Activity (OG Status)',
              period: '2020-early 2021',
              transactions: earlyTxs.length,
              earliestDate: usedHelius 
                ? new Date(earlyTxs[earlyTxs.length - 1]?.timestamp * 1000).toISOString()
                : earlyTxs[earlyTxs.length - 1]?.block_signed_at
            });
          }
          
          // Verify claimed Solana projects
          const solProjects = claimedProjects.filter(p => p.chain === 'solana');
          if (solProjects.length > 0 && solanaTransactions.length > 0) {
            solProjects.forEach(project => {
              verifiedProjects.push({
                name: project.name,
                chain: 'Solana',
                interactions: 'verified_by_activity',
                note: 'Verified by Solana blockchain activity'
              });
            });
          }
        }
      }

      // EVM Chain Configuration - 14 chains total (13 Covalent + LayerOneX)
      interface ChainConfig {
        id: string;
        name: string;
        covalentId?: string;
        earlyActivity?: { startDate: string; endDate: string; bonus: number };
      }
      
      const EVM_CHAINS: ChainConfig[] = [
        // Foundational chains
        { id: 'ethereum', name: 'Ethereum', covalentId: 'eth-mainnet', earlyActivity: { startDate: '2015-01-01', endDate: '2018-12-31', bonus: 30 } },
        { id: 'bsc', name: 'BSC', covalentId: 'bsc-mainnet', earlyActivity: { startDate: '2020-09-01', endDate: '2021-06-30', bonus: 20 } },
        { id: 'polygon', name: 'Polygon', covalentId: 'matic-mainnet', earlyActivity: { startDate: '2020-06-01', endDate: '2021-12-31', bonus: 15 } },
        { id: 'arbitrum', name: 'Arbitrum', covalentId: 'arbitrum-mainnet', earlyActivity: { startDate: '2021-08-31', endDate: '2022-06-30', bonus: 15 } },
        { id: 'optimism', name: 'Optimism', covalentId: 'optimism-mainnet', earlyActivity: { startDate: '2021-07-01', endDate: '2022-06-30', bonus: 15 } },
        { id: 'base', name: 'Base', covalentId: 'base-mainnet', earlyActivity: { startDate: '2023-08-09', endDate: '2024-03-31', bonus: 10 } },
        { id: 'gnosis', name: 'Gnosis', covalentId: 'gnosis-mainnet', earlyActivity: { startDate: '2018-01-01', endDate: '2021-12-31', bonus: 15 } },
        // Frontier L2s and newer chains
        { id: 'avalanche', name: 'Avalanche', covalentId: 'avalanche-mainnet', earlyActivity: { startDate: '2020-09-21', endDate: '2021-12-31', bonus: 15 } },
        { id: 'fantom', name: 'Fantom', covalentId: 'fantom-mainnet', earlyActivity: { startDate: '2019-12-01', endDate: '2021-12-31', bonus: 12 } },
        { id: 'zksync', name: 'zkSync Era', covalentId: 'zksync-mainnet', earlyActivity: { startDate: '2023-03-24', endDate: '2024-03-31', bonus: 10 } },
        { id: 'scroll', name: 'Scroll', covalentId: 'scroll-mainnet', earlyActivity: { startDate: '2023-10-17', endDate: '2024-06-30', bonus: 10 } },
        { id: 'linea', name: 'Linea', covalentId: 'linea-mainnet', earlyActivity: { startDate: '2023-07-11', endDate: '2024-06-30', bonus: 10 } },
        { id: 'blast', name: 'Blast', covalentId: 'blast-mainnet', earlyActivity: { startDate: '2024-02-29', endDate: '2024-06-30', bonus: 8 } },
        { id: 'sei', name: 'Sei', covalentId: 'sei-mainnet' },
      ];

      // Helper function to fetch transactions from Covalent
      const fetchCovalentTransactions = async (wallet: string, chain: ChainConfig): Promise<{ chain: ChainConfig; transactions: any[] }> => {
        if (!chain.covalentId) return { chain, transactions: [] };
        
        try {
          const response = await fetch(
            `https://api.covalenthq.com/v1/${chain.covalentId}/address/${wallet}/transactions_v3/?key=${COVALENT_API_KEY}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            const transactions = data.data?.items || [];
            if (transactions.length > 0) {
              console.log(`${chain.name} transactions found:`, transactions.length);
            }
            return { chain, transactions };
          }
        } catch (error) {
          console.error(`${chain.name} fetch error:`, error);
        }
        return { chain, transactions: [] };
      };

      // Helper function to fetch LayerOneX transactions (native API)
      const fetchLayerOneXTransactions = async (wallet: string): Promise<any[]> => {
        try {
          console.log('Fetching LayerOneX transactions for:', wallet);
          const response = await fetch(
            `https://explorer.l1xapp.com/api/v2/addresses/${wallet}/transactions`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            const transactions = data.items || [];
            console.log('LayerOneX transactions found:', transactions.length);
            return transactions;
          }
        } catch (error) {
          console.error('LayerOneX fetch error:', error);
        }
        return [];
      };

      // Normalize LayerOneX transaction to our format
      const classifyLayerOneXTransaction = (tx: any): SignificantActivity | null => {
        const txDate = tx.timestamp || new Date().toISOString();
        const methodName = tx.method?.toLowerCase() || '';
        
        if (methodName.includes('swap') || methodName.includes('exchange')) {
          return { type: 'swap', description: 'Token swap on LayerOneX', experience: 'DEX trading on LayerOneX', chain: 'LayerOneX', date: txDate, priority: 3 };
        }
        if (methodName.includes('stake') || methodName.includes('delegate')) {
          return { type: 'stake', description: 'Staked assets on LayerOneX', experience: 'Staking on LayerOneX', chain: 'LayerOneX', date: txDate, priority: 4 };
        }
        if (tx.to?.hash && tx.gas_used > 21000) {
          return { type: 'protocol', description: 'Smart contract interaction on LayerOneX', experience: 'dApp experience on LayerOneX', chain: 'LayerOneX', date: txDate, priority: 1 };
        }
        if (tx.value && parseFloat(tx.value) > 0) {
          return { type: 'transfer', description: 'Token transfer on LayerOneX', experience: 'Blockchain activity on LayerOneX', chain: 'LayerOneX', date: txDate, priority: 0 };
        }
        return null;
      };

      // Check EVM chains using Covalent + LayerOneX native API
      if (evmWallet) {
        console.log('Processing EVM wallet:', evmWallet, 'across', EVM_CHAINS.length + 1, 'chains (including LayerOneX)');
        
        // Process Covalent chains in parallel batches to avoid rate limiting
        if (COVALENT_API_KEY) {
          const batchSize = 5;
          for (let i = 0; i < EVM_CHAINS.length; i += batchSize) {
            const batch = EVM_CHAINS.slice(i, i + batchSize);
            const results = await Promise.allSettled(
              batch.map(chain => fetchCovalentTransactions(evmWallet, chain))
            );
            
            for (const result of results) {
              if (result.status === 'fulfilled') {
                const { chain, transactions } = result.value;
                
                if (transactions.length > 0) {
                  detectedChains.add(chain.name);
                  
                  // Classify transactions for significant activities
                  for (const tx of transactions.slice(0, 50)) {
                    const activity = classifyTransaction(tx, chain.name);
                    if (activity) {
                      allActivities.push(activity);
                    }
                  }
                  
                  // Check early activity for OG status
                  if (chain.earlyActivity) {
                    const earlyTxs = transactions.filter((tx: any) => {
                      const txDate = new Date(tx.block_signed_at);
                      return txDate >= new Date(chain.earlyActivity!.startDate) && txDate <= new Date(chain.earlyActivity!.endDate);
                    });
                    
                    if (earlyTxs.length > 0) {
                      bluechipScore += chain.earlyActivity.bonus;
                      verificationResults.push({
                        chain: chain.name,
                        verificationType: 'Early Activity (OG Status)',
                        period: `${chain.earlyActivity.startDate} - ${chain.earlyActivity.endDate}`,
                        transactions: earlyTxs.length,
                        earliestDate: earlyTxs[earlyTxs.length - 1]?.block_signed_at
                      });
                    }
                  }
                  
                  // Verify claimed project interactions (Ethereum-specific)
                  if (chain.id === 'ethereum') {
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
                          chain: chain.name,
                          interactions: projectTxs.length,
                          firstInteraction: projectTxs[projectTxs.length - 1]?.block_signed_at
                        });
                        verificationResults.push({
                          chain: chain.name,
                          verificationType: `Project Interaction: ${project.name}`,
                          transactions: projectTxs.length,
                          earliestDate: projectTxs[projectTxs.length - 1]?.block_signed_at
                        });
                      } else {
                        unverifiedProjects.push({
                          name: project.name,
                          chain: chain.name,
                          reason: 'No on-chain interactions found with project contracts'
                        });
                      }
                    }
                  }
                  
                  // Verify chain-specific project claims
                  const chainProjects = claimedProjects.filter(p => p.chain === chain.id);
                  if (chainProjects.length > 0 && transactions.length > 0) {
                    chainProjects.forEach(project => {
                      if (!verifiedProjects.some(vp => vp.name === project.name)) {
                        verifiedProjects.push({
                          name: project.name,
                          chain: chain.name,
                          interactions: 'verified_by_activity',
                          note: `Verified by ${chain.name} blockchain activity`
                        });
                      }
                    });
                  }
                }
              }
            }
          }
        }
        
        // Process LayerOneX (native API, no Covalent dependency)
        const l1xTransactions = await fetchLayerOneXTransactions(evmWallet);
        if (l1xTransactions.length > 0) {
          detectedChains.add('LayerOneX');
          
          for (const tx of l1xTransactions.slice(0, 50)) {
            const activity = classifyLayerOneXTransaction(tx);
            if (activity) {
              allActivities.push(activity);
            }
          }
          
          // Check for early LayerOneX activity
          const earlyL1xTxs = l1xTransactions.filter((tx: any) => {
            const txDate = new Date(tx.timestamp);
            return txDate >= new Date('2023-01-01') && txDate <= new Date('2024-06-30');
          });
          
          if (earlyL1xTxs.length > 0) {
            bluechipScore += 10;
            verificationResults.push({
              chain: 'LayerOneX',
              verificationType: 'Early Activity (OG Status)',
              period: '2023-2024',
              transactions: earlyL1xTxs.length,
              earliestDate: earlyL1xTxs[earlyL1xTxs.length - 1]?.timestamp
            });
          }
        }
      }
      
      // Select top 5 most significant and diverse activities
      const selectTopActivities = (activities: SignificantActivity[]): SignificantActivity[] => {
        // Sort by priority (higher = more significant) and recency
        const sorted = [...activities].sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        // Ensure diversity - try to include different types
        const selected: SignificantActivity[] = [];
        const usedTypes = new Set<string>();
        
        // First pass: pick one of each type
        for (const activity of sorted) {
          if (!usedTypes.has(activity.type) && selected.length < 5) {
            selected.push(activity);
            usedTypes.add(activity.type);
          }
        }
        
        // Second pass: fill remaining slots with highest priority
        for (const activity of sorted) {
          if (selected.length >= 5) break;
          if (!selected.includes(activity)) {
            selected.push(activity);
          }
        }
        
        return selected.slice(0, 5);
      };
      
      const topActivities = selectTopActivities(allActivities);
      console.log('Significant activities found:', topActivities.length);

      if (verificationResults.length > 0 || topActivities.length > 0) {
        bluechipVerified = verificationResults.length > 0;
        bluechipDetails = {
          verifications: verificationResults,
          claimedProjects: claimedProjects.map(p => p.name),
          verifiedProjects: verifiedProjects,
          unverifiedProjects: unverifiedProjects,
          detectedChains: Array.from(detectedChains),
          solanaWalletAddress: solanaWallet,
          evmWalletAddress: evmWallet,
          walletAddress: solanaWallet || evmWallet, // Legacy compatibility
          proofOfWork: {
            totalClaimed: claimedProjects.length,
            totalVerified: verifiedProjects.length,
            verificationRate: claimedProjects.length > 0 
              ? Math.round((verifiedProjects.length / claimedProjects.length) * 100) 
              : 0
          },
          significantActivities: topActivities.map(a => ({
            type: a.type,
            description: a.description,
            experience: a.experience,
            chain: a.chain,
            date: a.date
          }))
        };
      } else if (solanaWallet || evmWallet) {
        // Even if no bluechip verification, still create bluechipDetails with wallets for display
        bluechipDetails = {
          verifications: [],
          solanaWalletAddress: solanaWallet,
          evmWalletAddress: evmWallet,
          walletAddress: solanaWallet || evmWallet,
          significantActivities: []
        };
      }

      console.log('Proof-of-Work verification results:', { 
        bluechipVerified, 
        bluechipScore, 
        verifiedProjects: verifiedProjects.length,
        unverifiedProjects: unverifiedProjects.length,
        significantActivities: topActivities.length,
        bluechipDetails 
      });
    } else if ((solanaWallet || evmWallet) && !HELIUS_API_KEY && !COVALENT_API_KEY) {
      // Wallets provided but no API keys - still store wallet addresses
      console.log('Wallets provided but no API keys configured');
      bluechipDetails = {
        verifications: [],
        solanaWalletAddress: solanaWallet,
        evmWalletAddress: evmWallet,
        walletAddress: solanaWallet || evmWallet,
        significantActivities: []
      };
    } else if (claimedProjects.length > 0 && !solanaWallet && !evmWallet) {
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
    
    // Store detailed scoring breakdown with cv_content
    analysis.scoring_details = {
      total_score: analysis.total_score,
      categories: analysis.categories,
      top_strengths: analysis.top_strengths,
      recommended_improvements: analysis.recommended_improvements,
      cv_content: analysis.cv_content || null
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
