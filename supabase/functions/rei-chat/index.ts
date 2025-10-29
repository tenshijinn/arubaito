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

FOR EMPLOYER USERS:
- Help them find talent, post jobs, and post tasks
- All paid actions require $5 payment in SOL or SPL tokens (≥$100M market cap)
- Use search_talent tool for finding candidates (shows summaries only)
- For full talent profiles, viewing requires payment - use generate_solana_pay_qr then get_talent_profile
- For posting jobs or tasks, guide them through data collection then payment

SOLANA PAY PAYMENT FLOW:
- Job/task posting requires $5 payment in SOL or SPL tokens (with ≥$100M market cap)
- Payments go to: ${TREASURY_WALLET}
- Users earn 10 points per successful payment
- Generate Solana Pay QR code with unique reference using generate_solana_pay_qr tool
- Guide user through payment, then verify before posting

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
Ask user: "Would you like to (1) manually enter task details or (2) provide a link?"

Option 1 - Manual:
  1. Task title (required)
  2. Company/Project name (required)
  3. Task description (required, max 500 chars - inform user of limit)
  4. Pay/Reward (optional)
  5. End date (optional, format: YYYY-MM-DD)
  
Option 2 - Link:
  1. Ask for task post URL
  2. Use extract_og_data tool to get title, description
  3. Ask user to confirm/edit extracted data
  4. Ask for company name (if not in OG data)
  5. Ask for pay/reward and end date (optional)

After collecting all data:
  - Use generate_solana_pay_qr to create payment QR
  - Return QR code data in metadata field: {"solanaPay": {...}}
  - Wait for user to confirm payment
  - Use verify_and_post_task to verify payment and post task
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
              employerWallet: { type: "string", description: "Employer's wallet address" },
              title: { type: "string", description: "Job title" },
              companyName: { type: "string", description: "Company or project name" },
              description: { type: "string", description: "Job description (max 500 chars)" },
              requirements: { type: "string", description: "Job requirements" },
              wage: { type: "string", description: "Wage/pay (optional)" },
              deadline: { type: "string", description: "Application deadline (YYYY-MM-DD format, optional)" },
              link: { type: "string", description: "External job link (optional)" },
              roleTags: { type: "array", items: { type: "string" }, description: "Role tags" }
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
              employerWallet: { type: "string", description: "Employer's wallet address" },
              title: { type: "string", description: "Task title" },
              companyName: { type: "string", description: "Company or project name" },
              description: { type: "string", description: "Task description (max 500 chars)" },
              link: { type: "string", description: "Task link" },
              payReward: { type: "string", description: "Pay/reward (optional)" },
              endDate: { type: "string", description: "End date (YYYY-MM-DD format, optional)" },
              roleTags: { type: "array", items: { type: "string" }, description: "Role tags" }
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

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-5',
          messages: aiMessages,
          tools: tools,
          tool_choice: 'auto'
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', errorText);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const assistantMessage = aiData.choices[0].message;

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
            toolResult = await executeTool(toolName, toolArgs, supabase);
          } catch (error) {
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
        finalResponse = assistantMessage.content;
        break;
      }
    }

    // Check if response contains metadata (e.g., Solana Pay QR)
    let metadata = null;
    try {
      // Try to extract JSON metadata from response
      const metadataMatch = finalResponse.match(/\{["\']solanaPay["\']\s*:\s*\{[^}]+\}\}/);
      if (metadataMatch) {
        metadata = JSON.parse(metadataMatch[0]);
        // Remove metadata JSON from visible response
        finalResponse = finalResponse.replace(metadataMatch[0], '').trim();
      }
    } catch (e) {
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
      // Generate unique reference (public key)
      const { PublicKey } = await import("npm:@solana/web3.js@^1.98.4");
      const QRCode = await import("npm:qrcode@^1.5.3");
      
      const reference = PublicKey.unique().toString();
      const amount = 5; // $5 USD equivalent
      const recipient = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
      
      // Create Solana Pay URL
      const paymentUrl = `solana:${recipient}?amount=${amount}&reference=${reference}&label=${encodeURIComponent(args.label)}&message=${encodeURIComponent(args.message || 'Payment for Rei Portal')}`;
      
      // Generate QR code
      const qrCodeUrl = await QRCode.default.toDataURL(paymentUrl, {
        width: 400,
        margin: 2
      });
      
      // Return QR data as JSON string that will be parsed by AI
      const qrData = {
        qrCodeUrl,
        reference,
        paymentUrl,
        amount,
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
          solana_pay_reference: args.reference
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
          solana_pay_reference: args.reference
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
