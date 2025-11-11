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

    // Get conversation history (limit to last 15 messages to prevent context bleed)
    const { data: allMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(15);
    
    // Reverse to get chronological order
    const messages = (allMessages || []).reverse();

    // Check user type
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('user_type')
      .eq('id', convId)
      .single();

    const userType = conv?.user_type || 'employer';

    // Build system prompt
    const systemPrompt = `You are Rei, an AI assistant for the Rei Proof-Of-Talent Portal. You connect Web3 talent with opportunities.

CRITICAL: Keep ALL responses concise (under 50 words when possible). Users value speed over verbosity.

Current user type: ${userType}
User's wallet address: ${walletAddress}
Treasury wallet: ${TREASURY_WALLET}

KEY ACTIONS & WHEN TO USE EACH TOOL:

1. **JOB SEARCH** (Talent) - User says "find jobs", "show jobs", "job opportunities"
   → Use search_jobs tool immediately

2. **TASK SEARCH** (Talent) - User says "find tasks", "show tasks", "available bounties"
   → Use search_tasks tool immediately

3. **POST PAID JOB** (Employer/Talent) - User says "post a job", "I want to hire", "create job post"
   → Use start_paid_job_posting tool to signal intent
   → Then collect job details and proceed with payment flow

4. **POST PAID TASK** (Employer/Talent) - User says "post a task", "list a bounty"
   → Use start_paid_task_posting tool to signal intent
   → Then collect task details and proceed with payment flow

5. **CONTRIBUTE OPPORTUNITY** (Talent) - User says "I found a job to share", "submit opportunity", "contribute"
   → Use start_community_contribution tool to signal intent
   → Explain they'll earn points but still need to pay $5
   → Collect details and proceed with payment flow

6. **MY PROFILE** (Talent) - User says "check my points", "show my stats", "submission history"
   → Use get_my_profile tool immediately

FOR TALENT USERS:
- Wallet already connected (${walletAddress}) - NEVER ask for it again
- When greeting, offer to search jobs/tasks immediately
- If search_jobs/search_tasks returns "profile not found" error:
  Say: "You need to register your profile first. Click below to upload your CV/portfolio."
  Include: {"action":"register","link":"/rei"}
- Show match scores and explain why opportunities fit
- Talent can ALSO post jobs/tasks as contributions (earns points, still requires $5 payment)

FOR EMPLOYER USERS:
- Help find talent, post jobs, post tasks
- Use search_talent for finding candidates (summaries only)
- Full profiles require $5 payment
- All postings require $5 payment

PAYMENT FLOW:
- Job/task posting requires $5 worth of SOL or SPL tokens (with ≥$100M market cap)
- Payments go to: ${TREASURY_WALLET}
- Users earn 10 points per successful payment
- TWO PAYMENT OPTIONS AVAILABLE:
  1. Solana Pay QR - Generate QR code with unique reference
  2. x402 Protocol - Alternative payment method
- When payment is ready, simply say: "Payment ready! Connect your wallet and choose your preferred payment method below."
- DO NOT ask users which payment method they prefer - the UI will show both options automatically
- Immediately generate the payment using generate_solana_pay_qr tool after collecting all details
- Return payment data in metadata, and the UI will display both payment options as cards

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
     - If extraction fails with "BLOCKED" error (e.g., LinkedIn/Indeed), tell user:
       "LinkedIn/Indeed blocks automated data extraction due to anti-scraping protections. Let's enter the details manually instead."
     - If extraction succeeds but returns empty data, tell user:
       "I couldn't find job details on that page. Let's enter them manually."
  3. Ask user to confirm/edit extracted data OR switch to manual entry
  4. Ask for company name (if not in OG data)
  5. Ask for wage and deadline (optional)

After collecting all data:
  - Call generate_solana_pay_qr with amount=5, memo="Job posting: [title]"
  - When payment is generated, respond with EXACTLY: "Payment ready! Connect your wallet and choose your preferred payment method below."
  - DO NOT add extra commentary, explanations, or formatting
  - DO NOT repeat job details
  - DO NOT explain payment options - the UI handles everything
  - Return QR code data in metadata field: {"solanaPay": {...}}
  - Wait for user to complete payment
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
  - Call generate_solana_pay_qr with amount=5, memo="Task posting: [title]"
  - When payment is generated, respond with EXACTLY: "Payment ready! Connect your wallet and choose your preferred payment method below."
  - DO NOT add extra commentary, explanations, or formatting
  - DO NOT repeat task details
  - DO NOT explain payment options - the UI handles everything
  - Return QR code data in metadata field: {"solanaPay": {...}}
  - Wait for user to complete payment
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
- "Got it! What's the role title?"
- "I found 3 matching jobs. Check them out!"
- "Payment ready! Connect your wallet and choose your preferred payment method below."
- IMPORTANT: Keep responses under 50 words when possible
- Use bullet points instead of long paragraphs
- Only elaborate when user explicitly asks for details or clarification
- For payment generation: use the exact phrase "Payment ready! Connect your wallet and choose your preferred payment method below." - nothing more

Example bad responses:
- Long paragraphs explaining features
- Multiple questions in one response
- Over-explaining simple concepts
- Adding extra commentary after payment generation`;

    // Define tools
    const tools = [
      // === TALENT SEARCH TOOLS ===
      {
        type: "function",
        function: {
          name: "search_jobs",
          description: "Search for job opportunities matching talent's profile. Use when talent asks to 'find jobs', 'show jobs', 'job search'.",
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
          name: "search_tasks",
          description: "Search for task/bounty opportunities matching talent's skills. Use when talent asks to 'find tasks', 'show tasks', 'available bounties'.",
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
          name: "get_my_profile",
          description: "Get user's profile including points, submission history, and stats. Use when user asks 'check my points', 'show my profile', 'view my stats'.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "User's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      
      // === POSTING INTENT SIGNALS ===
      {
        type: "function",
        function: {
          name: "start_paid_job_posting",
          description: "Signal that user wants to post a paid job listing. Use when user says 'post a job', 'I want to hire', 'create job post'. Returns acknowledgment to begin data collection.",
          parameters: {
            type: "object",
            properties: {
              userType: { type: "string", description: "employer or talent" }
            },
            required: ["userType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "start_paid_task_posting",
          description: "Signal that user wants to post a paid task/bounty. Use when user says 'post a task', 'list a bounty'. Returns acknowledgment to begin data collection.",
          parameters: {
            type: "object",
            properties: {
              userType: { type: "string", description: "employer or talent" }
            },
            required: ["userType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "start_community_contribution",
          description: "Signal that talent wants to submit job/task as community contribution (earns points). Use when talent says 'I found a job to share', 'submit opportunity', 'contribute'.",
          parameters: {
            type: "object",
            properties: {
              submissionType: { 
                type: "string", 
                enum: ["job", "task"],
                description: "Type of opportunity to contribute"
              }
            },
            required: ["submissionType"]
          }
        }
      },
      
      // === EMPLOYER TOOLS ===
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
          tool_choice: 'auto',
          max_completion_tokens: 300
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
    
    case 'search_tasks': {
      // Search tasks matching talent profile
      const { data: talent } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .single();
      
      if (!talent) {
        return { error: 'Talent profile not found. Please register first.' };
      }
      
      // Get all active tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        return { error: 'Failed to fetch tasks' };
      }
      
      // Simple matching based on role tags
      const matchedTasks = tasks.map((task: any) => {
        let matchScore = 0;
        let matchReasons = [];
        
        // Check role tag overlap
        const talentTags = talent.role_tags || [];
        const taskTags = task.role_tags || [];
        const matchingTags = talentTags.filter((tag: string) => taskTags.includes(tag));
        
        if (matchingTags.length > 0) {
          matchScore += matchingTags.length * 20;
          matchReasons.push(`Matches ${matchingTags.length} role tag(s): ${matchingTags.join(', ')}`);
        }
        
        return {
          ...task,
          matchScore: Math.min(matchScore, 100),
          matchReason: matchReasons.join('. ')
        };
      });
      
      // Sort by match score
      matchedTasks.sort((a: any, b: any) => b.matchScore - a.matchScore);
      
      return {
        tasks: matchedTasks.slice(0, 10),
        talentProfile: {
          wallet_address: talent.wallet_address,
          role_tags: talent.role_tags
        }
      };
    }
    
    case 'get_my_profile': {
      // Get user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .single();
      
      // Get submission history
      const { data: submissions } = await supabase
        .from('community_submissions')
        .select('*')
        .eq('submitter_wallet', args.walletAddress)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Get points transactions
      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        points: {
          total: pointsData?.total_points || 0,
          pending: pointsData?.points_pending || 0,
          lifetime_earnings_sol: pointsData?.lifetime_earnings_sol || 0
        },
        submissions: submissions || [],
        recent_transactions: transactions || []
      };
    }
    
    case 'start_paid_job_posting': {
      return {
        success: true,
        message: `Acknowledged: ${args.userType === 'talent' ? 'Talent' : 'Employer'} wants to post a paid job. Begin collecting job details (title, company, description, requirements, wage, deadline). After collection, generate payment QR with generate_solana_pay_qr.`,
        flow: 'paid_job_posting'
      };
    }
    
    case 'start_paid_task_posting': {
      return {
        success: true,
        message: `Acknowledged: ${args.userType === 'talent' ? 'Talent' : 'Employer'} wants to post a paid task. Begin collecting task details (title, company, description, link REQUIRED, pay, end date). After collection, generate payment QR with generate_solana_pay_qr.`,
        flow: 'paid_task_posting'
      };
    }
    
    case 'start_community_contribution': {
      return {
        success: true,
        message: `Acknowledged: Talent wants to contribute a ${args.submissionType}. Explain they'll earn 10 points and follow the same $5 payment flow. Begin collecting ${args.submissionType} details.`,
        flow: 'community_contribution',
        submissionType: args.submissionType
      };
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
        return { 
          error: 'Failed to extract data from URL',
          details: response.error 
        };
      }
      
      const { og_title, og_description, og_image, errorType } = response.data || {};
      
      // If we got an error type, provide specific guidance
      if (errorType) {
        let userMessage = '';
        switch (errorType) {
          case 'BLOCKED':
            userMessage = 'This site (likely LinkedIn or Indeed) blocks automated data extraction. Please manually enter the job details instead.';
            break;
          case 'TIMEOUT':
            userMessage = 'The page took too long to load. Please try again or enter details manually.';
            break;
          case 'NOT_FOUND':
            userMessage = "That URL doesn't seem to exist. Please check the link and try again.";
            break;
          default:
            userMessage = 'Could not extract data from that URL. Please enter the details manually.';
        }
        return { 
          error: userMessage,
          errorType: errorType 
        };
      }
      
      return {
        title: og_title || '',
        description: og_description || '',
        image: og_image || '',
        hasData: !!(og_title || og_description)
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
      
      // Fetch current SOL price in USD with retry logic
      console.log(`[generate_solana_pay_qr] Fetching SOL price for $${usdAmount} USD...`);
      let solPriceUsd = 0;
      const maxRetries = 3;
      const timeout = 10000; // 10 seconds
      const fallbackPrice = 100;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: CoinGecko request started`);
          const startTime = Date.now();
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const priceResponse = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
            { 
              headers: { 'Accept': 'application/json' },
              signal: controller.signal
            }
          );
          clearTimeout(timeoutId);
          
          const responseTime = Date.now() - startTime;
          
          if (!priceResponse.ok) {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Failed - HTTP ${priceResponse.status} ${priceResponse.statusText}`);
            
            if (priceResponse.status === 429) {
              console.log('[generate_solana_pay_qr] Rate limited by CoinGecko');
            } else if (priceResponse.status === 503 || priceResponse.status === 502) {
              console.log('[generate_solana_pay_qr] CoinGecko service unavailable');
            }
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            continue;
          }
          
          const priceData = await priceResponse.json();
          solPriceUsd = priceData?.solana?.usd || 0;
          
          if (solPriceUsd > 0 && solPriceUsd >= 10 && solPriceUsd <= 1000) {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Success - SOL price $${solPriceUsd} (response time: ${responseTime}ms)`);
            break;
          } else {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Invalid price data: ${solPriceUsd}`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Request timed out`);
          } else {
            console.log(`[generate_solana_pay_qr] Attempt ${attempt}/${maxRetries}: Network error - ${error.message}`);
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // Use fallback price if all retries failed
      if (solPriceUsd === 0 || solPriceUsd < 10 || solPriceUsd > 1000) {
        console.log(`[generate_solana_pay_qr] All retries exhausted. Using fallback price $${fallbackPrice}`);
        solPriceUsd = fallbackPrice;
      }
      
      const solAmount = usdAmount / solPriceUsd;
      console.log(`[generate_solana_pay_qr] Converted $${usdAmount} USD to ${solAmount} SOL${solPriceUsd === fallbackPrice ? ' (FALLBACK PRICE)' : ''}`)
      
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
