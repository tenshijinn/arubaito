import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TREASURY_WALLET = '6FmWdgfvBHeNjjg12cGuq3dPKLKh5BmEMiVSddtA1aU7';

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
- Viewing full talent profiles requires $5 SOL payment to ${TREASURY_WALLET}
- Posting jobs requires $5 SOL payment
- Posting task links requires $5 SOL payment
- Use search_talent tool for finding candidates (shows summaries only)
- After payment verification, use get_talent_profile to show full details

PAYMENT FLOW:
1. When user wants to view talent/post job/post task, explain the $5 SOL requirement
2. Tell them to click the payment button
3. Once they confirm transaction, use verify_payment tool with the signature
4. If verified, complete the action (show profile, save job, save task)

Always be helpful, concise, and professional. Focus on matching based on Web3 experience.`;

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
          name: "request_payment",
          description: "Request a $5 SOL payment for viewing talent profile, posting job, or posting task",
          parameters: {
            type: "object",
            properties: {
              action: { 
                type: "string", 
                enum: ["view_talent", "post_job", "post_task"],
                description: "What the payment is for" 
              },
              details: { type: "object", description: "Additional details about the action" }
            },
            required: ["action", "details"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "verify_payment",
          description: "Verify a Solana payment transaction",
          parameters: {
            type: "object",
            properties: {
              txSignature: { type: "string", description: "Solana transaction signature" },
              senderWallet: { type: "string", description: "Sender wallet address" }
            },
            required: ["txSignature", "senderWallet"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_talent_profile",
          description: "Get full talent profile details after payment verification",
          parameters: {
            type: "object",
            properties: {
              xUserId: { type: "string", description: "Talent's X user ID" },
              txSignature: { type: "string", description: "Verified payment transaction signature" },
              employerWallet: { type: "string", description: "Employer's wallet address" }
            },
            required: ["xUserId", "txSignature", "employerWallet"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "submit_job",
          description: "Submit a job posting after payment verification",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              requirements: { type: "string" },
              roleTags: { type: "array", items: { type: "string" } },
              compensation: { type: "string" },
              txSignature: { type: "string" },
              employerWallet: { type: "string" }
            },
            required: ["title", "description", "txSignature", "employerWallet"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "submit_task",
          description: "Submit a task link after payment verification",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              link: { type: "string" },
              roleTags: { type: "array", items: { type: "string" } },
              compensation: { type: "string" },
              txSignature: { type: "string" },
              employerWallet: { type: "string" }
            },
            required: ["title", "description", "link", "txSignature", "employerWallet"]
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
          model: 'google/gemini-2.5-flash',
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

    // Save assistant response
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: finalResponse
      });

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        conversationId: convId
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

    case 'request_payment': {
      return {
        payment_required: true,
        action: args.action,
        amount_usd: 5,
        treasury_wallet: TREASURY_WALLET,
        details: args.details,
        message: `Please send approximately $5 worth of SOL to ${TREASURY_WALLET} to ${args.action.replace('_', ' ')}`
      };
    }

    case 'verify_payment': {
      const response = await supabase.functions.invoke('verify-sol-payment', {
        body: {
          txSignature: args.txSignature,
          expectedAmount: 5,
          senderWallet: args.senderWallet
        }
      });
      return response.data || response.error;
    }

    case 'get_talent_profile': {
      // First verify the payment hasn't been used
      const { data: existingView } = await supabase
        .from('talent_views')
        .select('id')
        .eq('payment_tx_signature', args.txSignature)
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
          payment_tx_signature: args.txSignature
        });

      return { talent };
    }

    case 'submit_job': {
      // Check if payment already used
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('payment_tx_signature', args.txSignature)
        .single();

      if (existingJob) {
        return { error: 'Payment already used for another job posting' };
      }

      // Insert job
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          title: args.title,
          description: args.description,
          requirements: args.requirements || '',
          role_tags: args.roleTags || [],
          compensation: args.compensation || '',
          employer_wallet: args.employerWallet,
          payment_tx_signature: args.txSignature
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { success: true, job };
    }

    case 'submit_task': {
      // Check if payment already used
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('payment_tx_signature', args.txSignature)
        .single();

      if (existingTask) {
        return { error: 'Payment already used for another task posting' };
      }

      // Insert task
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: args.title,
          description: args.description,
          link: args.link,
          role_tags: args.roleTags || [],
          compensation: args.compensation || '',
          employer_wallet: args.employerWallet,
          payment_tx_signature: args.txSignature
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { success: true, task };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}