import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TREASURY_WALLET = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';

interface ChatRequest {
  message: string;
  walletAddress: string;
  conversationId?: string;
  userMode?: 'talent' | 'employer';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, walletAddress, conversationId, userMode }: ChatRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get or create conversation
    let convId = conversationId;
    const selectedUserType = userMode || 'talent';
    
    if (!convId) {
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id, user_type')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingConv) {
        convId = existingConv.id;
        // Update user type if it changed
        if (existingConv.user_type !== selectedUserType) {
          await supabase
            .from('chat_conversations')
            .update({ user_type: selectedUserType })
            .eq('id', existingConv.id);
        }
      } else {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({ wallet_address: walletAddress, user_type: selectedUserType })
          .select()
          .single();

        convId = newConv.id;
      }
    } else {
      // Update existing conversation's user type
      await supabase
        .from('chat_conversations')
        .update({ user_type: selectedUserType })
        .eq('id', convId);
    }

    // Save user message
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        role: 'user',
        content: message
      });

    // Get conversation history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    // Check user type
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('user_type')
      .eq('id', convId)
      .single();

    const userType = conv?.user_type || 'employer';

    // Build system prompt
    const systemPrompt = `You are Rei, an AI assistant for the Rei Proof-Of-Talent Portal. You connect Web3 talent with opportunities.

Current user type: ${userType}
User's wallet address: ${walletAddress}
Treasury wallet: ${TREASURY_WALLET}

FOR TALENT USERS:
- The user has already connected their wallet (${walletAddress})
- NEVER ask for their wallet address - you already have it in the system
- When a talent user first connects or greets you (e.g., "hello", "hey", "hi"), immediately offer to search for jobs matching their profile
- Be proactive: don't wait for them to explicitly ask, offer the job search right away
- Example first response: "Hello! I can see you've connected your wallet. Would you like me to search for Web3 opportunities that match your profile?"
- When they show interest or ask for jobs, automatically use the search_jobs tool with their wallet address
- IMPORTANT: If the search_jobs tool returns an error "Talent profile not found", tell the user:
  "I can see you've connected your wallet, but you need to register your profile first. Please click the button below to complete your registration by uploading your CV or portfolio. Once registered, I'll be able to match you with relevant opportunities!"
  AND include this EXACT JSON at the end of your response: {"action":"register","link":"/rei"}
- Show match scores and explain why opportunities fit their profile
- COMMUNITY CONTRIBUTION: Talent users can also contribute jobs/tasks they find in the market!
  - When they say "I found a job/task" or want to post an opportunity, guide them through the posting flow
  - Explain: "Great! You'll earn 10 points for contributing this opportunity to the platform."
  - Follow the same data collection and payment flow as employers ($5 payment required)
  - These contributions are marked as 'community_contributed' and help the ecosystem grow

FOR EMPLOYER USERS:
- Help them find talent, post jobs, and post tasks
- All paid actions require $5 worth of SOL or SPL tokens (≥$100M market cap)
- Use search_talent tool for finding candidates (shows summaries only)
- For full talent profiles, viewing requires payment - use generate_solana_pay_qr then get_talent_profile
- For posting jobs or tasks, guide them through data collection then payment

PAYMENT FLOW:
- Job/task posting requires $5 worth of SOL or SPL tokens (with ≥$100M market cap)
- Payments go to: ${TREASURY_WALLET}
- Users earn 10 points per successful payment
- TWO PAYMENT OPTIONS AVAILABLE:
  1. Solana Pay QR - Generate QR code with unique reference using generate_solana_pay_qr tool
  2. x402 Protocol - Alternative payment method for users who prefer it
- When mentioning payment, ALWAYS say: "I'll generate a $5 payment request. You can pay via Solana Pay QR or use the x402 protocol."
- Guide user through payment, then verify before posting

IMPORTANT RESTRICTIONS:
- NEVER mention or offer "alerts" or "notifications" - this feature does not exist
- NEVER offer to scrape job boards or websites for job data - only extract OG metadata from provided links
- DO NOT suggest features that aren't implemented

JOB POSTING FLOW:
Ask user: "Would you like to (1) manually enter job details or (2) provide a link?"

Option 1 - Manual:
  1. Role title (required)
  2. Company/Project name (required)
  3. Job description (required, max 500 chars - inform user of limit)
  4. Wage/Pay (optional)
  5. Deadline (optional, format: YYYY-MM-DD)
  
Option 2 - Link:
  1. Ask for job post URL
  2. Use extract_og_data tool to get title, description
  3. Ask user to confirm/edit extracted data
  4. Ask for company name (if not in OG data)
  5. Ask for wage and deadline (optional)

After collecting all data:
  - Use generate_solana_pay_qr to create payment QR
  - Return QR code data in metadata field: {"solanaPay": {...}}
  - Wait for user to confirm payment
  - Use verify_and_post_job to verify payment and post job
  - Confirm success and points awarded

TASK POSTING FLOW:
**CRITICAL: A task link is ABSOLUTELY REQUIRED - do not proceed without it!**

Ask user: "Would you like to (1) manually enter task details or (2) provide a link?"

Option 1 - Manual:
  1. Task title (required)
  2. Company/Project name (required)
  3. Task description (required, max 500 chars - inform user of limit)
  4. **Task link (REQUIRED - URL where task details/application can be found)**
  5. Pay/Reward (optional)
  6. End date (optional, format: YYYY-MM-DD)
  
**CRITICAL VALIDATION**: 
- If user tries to proceed without a task link, STOP them immediately
- Say: "A task link is required - please provide the URL where people can find this task or apply."
- Do NOT generate payment or call verify_and_post_task without a valid link
  
Option 2 - Link:
  1. Ask for task post URL (this becomes the task link)
  2. Use extract_og_data tool ONLY to get title, description from the provided link
  3. Ask user to confirm/edit extracted data
  4. Ask for company name (if not in OG data)
  5. Ask for pay/reward and end date (optional)

After collecting all data (including required link):
  - Validate task link is provided before proceeding
  - Use generate_solana_pay_qr to create payment request
  - ALWAYS mention both payment options: "I'll generate a $5 payment request. You can pay via Solana Pay QR or use the x402 protocol."
  - Return QR code data in metadata field: {"solanaPay": {...}}
  - Wait for user to confirm payment
  - Use verify_and_post_task to verify payment and post task (link is required parameter)
  - Confirm success and points awarded

IMPORTANT: 
- Always validate description length (max 500 chars). If user provides longer text, inform them of the limit and ask them to shorten it.
- When returning Solana Pay QR, include it in the message metadata as: {"solanaPay": {"qrCodeUrl": "...", "reference": "...", "paymentUrl": "...", "amount": 5, "recipient": "${TREASURY_WALLET}"}}

COMMUNICATION STYLE:
- Keep responses SHORT (2-3 sentences max unless showing results)
- Be conversational and engaging - like texting a knowledgeable friend
- Use casual language but stay professional
- Ask follow-up questions to keep the conversation flowing
- Get straight to the point - no lengthy explanations
- Use emojis sparingly (only when it adds personality)
- When showing opportunities or profiles, be concise in descriptions
- Focus on matching based on Web3 experience

Example good responses:
- "Hey! 👋 I can see your wallet's connected. Want me to find some opportunities that match your skills?"
- "Found 5 matches! Here are the top 3 based on your profile..."
- "Great! I'll generate a payment QR for you. Scan it to complete the $5 payment."

Example bad responses:
- Long paragraphs explaining features
- Multiple questions in one response
- Over-explaining simple concepts`;

    // Define tools
    const tools = [
      {
        type: "function",
        function: {
          name: "search_jobs",
          description: "Search for jobs and tasks matching a talent's profile",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "Talent's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_talent",
          description: "Search for talent matching job requirements (returns summaries only, payment required for full profiles)",
          parameters: {
            type: "object",
            properties: {
              requirements: { type: "string", description: "Job requirements and description" },
              roleTags: { type: "array", items: { type: "string" }, description: "Required role tags" }
            },
            required: ["requirements"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "extract_og_data",
          description: "Extract Open Graph metadata (title, description, image) from a URL for job/task posting",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL to extract metadata from" }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_solana_pay_qr",
          description: "Generate Solana Pay QR code for $5 payment. Returns QR code data to be included in message metadata.",
          parameters: {
            type: "object",
            properties: {
              label: { type: "string", description: "Payment label (e.g., 'Job Posting')" },
              message: { type: "string", description: "Payment message for user" }
            },
            required: ["label"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_talent_profile",
          description: "Get full talent profile details after Solana Pay payment verification",
          parameters: {
            type: "object",
            properties: {
              xUserId: { type: "string", description: "Talent's X user ID" },
              reference: { type: "string", description: "Solana Pay reference (unique payment identifier)" },
              employerWallet: { type: "string", description: "Employer's wallet address" }
            },
            required: ["xUserId", "reference", "employerWallet"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verify_and_post_job",
          description: "Verify Solana Pay payment and post a job",
          parameters: {
            type: "object",
            properties: {
              reference: { type: "string", description: "Solana Pay reference" },
              employerWallet: { type: "string", description: "Employer's or contributor's wallet address" },
              title: { type: "string", description: "Job title" },
              companyName: { type: "string", description: "Company or project name" },
              description: { type: "string", description: "Job description (max 500 chars)" },
              requirements: { type: "string", description: "Job requirements" },
              wage: { type: "string", description: "Wage/pay (optional)" },
              deadline: { type: "string", description: "Application deadline (YYYY-MM-DD format, optional)" },
              link: { type: "string", description: "External job link (optional)" },
              roleTags: { type: "array", items: { type: "string" }, description: "Role tags" },
              source: { type: "string", description: "Source: 'manual' (employer) or 'community_contributed' (talent contributor)" }
            },
            required: ["reference", "employerWallet", "title", "companyName", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verify_and_post_task",
          description: "Verify Solana Pay payment and post a task",
          parameters: {
            type: "object",
            properties: {
              reference: { type: "string", description: "Solana Pay reference" },
              employerWallet: { type: "string", description: "Employer's or contributor's wallet address" },
              title: { type: "string", description: "Task title" },
              companyName: { type: "string", description: "Company or project name" },
              description: { type: "string", description: "Task description (max 500 chars)" },
              link: { type: "string", description: "Task link" },
              payReward: { type: "string", description: "Pay/reward (optional)" },
              endDate: { type: "string", description: "End date (YYYY-MM-DD format, optional)" },
              roleTags: { type: "array", items: { type: "string" }, description: "Role tags" },
              source: { type: "string", description: "Source: 'manual' (employer) or 'community_contributed' (talent contributor)" }
            },
            required: ["reference", "employerWallet", "title", "companyName", "description", "link"]
          }
        }
      }
    ];

    // Call Lovable AI with tool calling
    let aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    let maxIterations = 5;
    let iteration = 0;
    let finalResponse = '';

    while (iteration < maxIterations) {
      iteration++;
      console.log(`[Iteration ${iteration}/${maxIterations}] Starting AI processing...`);

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-mini',
          messages: aiMessages,
          tools: tools,
          tool_choice: 'auto'
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 402) {
          throw new Error('AI credits exhausted. Please add credits to your Lovable workspace to continue using Rei.');
        }
        
        if (aiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        
        throw new Error(`AI service error (${aiResponse.status}). Please try again.`);
      }

      const aiData = await aiResponse.json();
      const assistantMessage = aiData.choices[0].message;
      console.log(`[Iteration ${iteration}] AI response received. Tool calls:`, assistantMessage.tool_calls?.length || 0);

      // Add assistant message to conversation
      aiMessages.push(assistantMessage);

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Execute tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log('Executing tool:', toolName, toolArgs);

          let toolResult;
          try {
            const startTime = Date.now();
            toolResult = await executeTool(toolName, toolArgs, supabase);
            const duration = Date.now() - startTime;
            console.log(`Tool ${toolName} completed in ${duration}ms`);
          } catch (error) {
            console.error(`Tool ${toolName} failed:`, error);
            toolResult = { error: error instanceof Error ? error.message : 'Tool execution failed' };
          }

          // Add tool result to messages
          aiMessages.push({
            role: "tool" as any,
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult)
          } as any);
        }
      } else {
        // No more tool calls, we have the final response
        console.log(`[Iteration ${iteration}] Final response ready, length:`, assistantMessage.content?.length || 0);
        finalResponse = assistantMessage.content;
        break;
      }
    }

    // Check if response contains metadata (e.g., Solana Pay QR)
    let metadata = null;
    try {
      // Try to extract JSON metadata from response - look for nested solanaPay object
      const metadataRegex = /\{\s*["']solanaPay["']\s*:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*\}/;
      const metadataMatch = finalResponse.match(metadataRegex);
      if (metadataMatch) {
        metadata = JSON.parse(metadataMatch[0]);
        // Remove metadata JSON from visible response
        finalResponse = finalResponse.replace(metadataMatch[0], '').trim();
      }
    } catch (e) {
      console.error('Failed to extract metadata:', e);
      // No metadata found, that's fine
    }

    // Save assistant response
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: finalResponse,
        metadata: metadata
      });

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        conversationId: convId,
        metadata: metadata
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rei-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeTool(toolName: string, args: any, supabase: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  switch (toolName) {
    case 'search_jobs': {
      const response = await supabase.functions.invoke('match-talent-to-jobs', {
        body: { walletAddress: args.walletAddress }
      });
      return response.data || response.error;
    }

    case 'search_talent': {
      const response = await supabase.functions.invoke('match-jobs-to-talent', {
        body: { 
          requirements: args.requirements,
          roleTags: args.roleTags || []
        }
      });
      return response.data || response.error;
    }

    case 'extract_og_data': {
      const response = await supabase.functions.invoke('extract-og-image', {
        body: { url: args.url }
      });
      
      if (response.error) {
        return { error: 'Failed to extract data from URL' };
      }
      
      return {
        title: response.data?.title || '',
        description: response.data?.description || '',
        image: response.data?.image || ''
      };
    }

    case 'generate_solana_pay_qr': {
      console.log('[generate_solana_pay_qr] Starting QR generation...');
      // Generate truly unique reference using crypto
      const QRCode = await import("npm:qrcode@^1.5.3");
      const { Keypair } = await import("npm:@solana/web3.js@^1.98.4");
      
      // Generate a unique keypair and use its public key as reference
      const keypair = Keypair.generate();
      const reference = keypair.publicKey.toString();
      console.log('[generate_solana_pay_qr] Generated reference:', reference);
      
      const usdAmount = 5; // $5 USD
      const recipient = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
      
      // Fetch current SOL price in USD
      let solAmount = 0;
      try {
        console.log('[generate_solana_pay_qr] Fetching SOL price from CoinGecko...');
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const priceData = await priceResponse.json();
        const solPriceUsd = priceData.solana.usd;
        solAmount = usdAmount / solPriceUsd;
        console.log('[generate_solana_pay_qr] SOL price:', solPriceUsd, 'USD, amount:', solAmount, 'SOL');
      } catch (error) {
        console.error('[generate_solana_pay_qr] Failed to fetch SOL price, using fallback:', error);
        // Fallback: assume SOL = $100 USD
        solAmount = usdAmount / 100;
      }
      
      // Create Solana Pay URL (accepts SOL by default)
      // Note: Wallet apps can send SPL tokens instead if they support it
      const paymentUrl = `solana:${recipient}?amount=${solAmount.toFixed(9)}&reference=${reference}&label=${encodeURIComponent(args.label)}&message=${encodeURIComponent(args.message || 'Payment for Rei Portal')}`;
      
      console.log('[generate_solana_pay_qr] Generating QR code...');
      // Generate QR code with custom colors
      const qrCodeUrl = await QRCode.default.toDataURL(paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#181818',  // Foreground dots
          light: '#ed565a'  // Background
        }
      });
      
      console.log('[generate_solana_pay_qr] QR code generated successfully');
      // Return QR data as JSON string that will be parsed by AI
      const qrData = {
        qrCodeUrl,
        reference,
        paymentUrl,
        amount: usdAmount,
        solAmount,
        recipient
      };
      
      return {
        success: true,
        qrData: qrData,
        message: `QR code generated. Return this data in your response metadata as: {"solanaPay": ${JSON.stringify(qrData)}}`
      };
    }

    case 'get_talent_profile': {
      // Verify payment first
      const verifyResponse = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference: args.reference,
          walletAddress: args.employerWallet
        }
      });

      if (!verifyResponse.data?.verified) {
        return { error: verifyResponse.data?.error || 'Payment verification failed' };
      }

      // Check if reference already used
      const { data: existingView } = await supabase
        .from('talent_views')
        .select('id')
        .eq('payment_tx_signature', verifyResponse.data.signature)
        .single();

      if (existingView) {
        return { error: 'Payment already used for another profile view' };
      }

      // Get full profile
      const { data: talent } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('x_user_id', args.xUserId)
        .single();

      if (!talent) {
        return { error: 'Talent profile not found' };
      }

      // Record the view
      await supabase
        .from('talent_views')
        .insert({
          employer_wallet: args.employerWallet,
          talent_x_user_id: args.xUserId,
          payment_tx_signature: verifyResponse.data.signature
        });

      // Award points
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: args.employerWallet,
          reference: args.reference,
          amount: verifyResponse.data.amount,
          tokenMint: verifyResponse.data.tokenMint,
          tokenAmount: verifyResponse.data.tokenAmount
        }
      });

      return { talent, pointsAwarded: 10 };
    }

    case 'verify_and_post_job': {
      // Verify payment
      const verifyResponse = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference: args.reference,
          walletAddress: args.employerWallet
        }
      });

      if (!verifyResponse.data?.verified) {
        return { error: verifyResponse.data?.error || 'Payment verification failed' };
      }

      // Check if reference already used
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('solana_pay_reference', args.reference)
        .single();

      if (existingJob) {
        return { error: 'Payment already used for another job posting' };
      }

      // Insert job
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          title: args.title,
          company_name: args.companyName,
          description: args.description,
          requirements: args.requirements || '',
          role_tags: args.roleTags || [],
          compensation: args.wage || args.compensation || '',
          deadline: args.deadline || null,
          link: args.link || null,
          employer_wallet: args.employerWallet,
          payment_tx_signature: verifyResponse.data.signature,
          solana_pay_reference: args.reference,
          source: args.source || 'manual'
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Award points
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: args.employerWallet,
          reference: args.reference,
          amount: verifyResponse.data.amount,
          tokenMint: verifyResponse.data.tokenMint,
          tokenAmount: verifyResponse.data.tokenAmount
        }
      });

      return { success: true, job, pointsAwarded: 10 };
    }

    case 'verify_and_post_task': {
      // Verify payment
      const verifyResponse = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference: args.reference,
          walletAddress: args.employerWallet
        }
      });

      if (!verifyResponse.data?.verified) {
        return { error: verifyResponse.data?.error || 'Payment verification failed' };
      }

      // Check if reference already used
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('solana_pay_reference', args.reference)
        .single();

      if (existingTask) {
        return { error: 'Payment already used for another task posting' };
      }

      // Insert task
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: args.title,
          company_name: args.companyName,
          description: args.description,
          link: args.link,
          role_tags: args.roleTags || [],
          compensation: args.payReward || args.compensation || '',
          end_date: args.endDate || null,
          employer_wallet: args.employerWallet,
          payment_tx_signature: verifyResponse.data.signature,
          solana_pay_reference: args.reference,
          source: args.source || 'manual'
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Award points
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: args.employerWallet,
          reference: args.reference,
          amount: verifyResponse.data.amount,
          tokenMint: verifyResponse.data.tokenMint,
          tokenAmount: verifyResponse.data.tokenAmount
        }
      });

      return { success: true, task, pointsAwarded: 10 };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
