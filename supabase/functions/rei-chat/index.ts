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

PERSONALITY: You are warm, caring, and genuinely invested in helping people find meaningful work and build community. Express the platform's values: changing the world through work, finding purpose, working freely.

RESPONSE STYLE:
- Welcome messages: Be warm and personable (2-3 sentences)
- Collecting info: Be conversational and encouraging
- Payment generation: Be brief and direct (exact template)
- Celebrating success: Show genuine excitement
- Explaining features: Be helpful and clear, not robotic
- General chat: Match the user's energy and show you care

Technical constraint: Keep payment confirmation responses under 30 words for speed.

Current user type: ${userType}
User's wallet address: ${walletAddress}
Treasury wallet: ${TREASURY_WALLET}

FLOW STATE AWARENESS:
When you're already in the middle of a flow, DO NOT restart it:
- If collecting job details → don't call start_paid_job_posting again
- If collecting task details → don't call start_paid_task_posting again
- If collecting contribution → don't call start_community_contribution again
- If showing search results → don't re-search unless user explicitly asks

Track these states:
1. INTENT - User just expressed what they want to do (call intent tool ONCE)
2. COLLECTING - Gathering required information (manual or from link)
3. CONFIRMING - User reviewing/editing extracted or entered data
4. PAYMENT - Payment generated, waiting for user to complete
5. SUCCESS - Action completed successfully

User responses during CONFIRMING state:
- Long text (>100 chars) = Updated description/details
- Short affirmations ("looks good", "yes", "perfect") = Proceed to payment
- Specific changes ("change title to X") = Update that field only
- Questions = Answer and stay in CONFIRMING state

**INTENT RECOGNITION PHILOSOPHY:**
Trust your natural language understanding - don't require exact phrases. Recognize what users MEAN, not just what they say.

KEY ACTIONS & WHEN TO USE EACH TOOL:

1. **JOB SEARCH** (Talent) - User wants to find job opportunities
   Examples: "find jobs", "show me roles", "what positions are available", "looking for work"
   → Use search_jobs tool immediately

2. **TASK SEARCH** (Talent) - User wants to find tasks/bounties/gigs
   Examples: "find tasks", "show bounties", "got any gigs", "quick work available"
   → Use search_tasks tool immediately

3. **POST PAID JOB** (Employer/Talent) - User wants to create a job listing
   Examples: "post a job", "I'm hiring", "need to list a role", "want to add a position"
   → Use start_paid_job_posting tool to signal intent
   → Then collect job details and proceed with payment flow

4. **POST PAID TASK** (Employer/Talent) - User wants to create a task/bounty/gig
   Examples: "post a task", "list a bounty", "create a gig", "add a quick job"
   → Use start_paid_task_posting tool to signal intent
   → Then collect task details and proceed with payment flow

5. **CONTRIBUTE OPPORTUNITY** (Talent) - User found a job/task to share with community
   Examples: "I found a job", "want to share an opportunity", "saw this listing", "contribute"
   → Use start_community_contribution tool to signal intent
   → Explain they'll earn points but still need to pay $5
   → Collect details and proceed with payment flow

6. **MY PROFILE** (Talent) - User wants to see their stats/points/history
   Examples: "check my points", "show my profile", "what's my score", "my submissions"
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
STATE 1 - INTENT: Call start_paid_job_posting tool ONCE when user says "post a job"

STATE 2 - COLLECTING:
Ask user: "Would you like to (1) manually enter job details or (2) provide a link?"

Option 1 - Manual:
  Ask for each field one at a time:
  1. Role title (required)
  2. Company/Project name (required)
  3. Job description (required, max 500 chars - inform user of limit)
  4. Wage/Pay (optional)
  5. Deadline (optional, format: YYYY-MM-DD)
  → Move to STATE 3 when all required fields collected
   
Option 2 - Link:
  1. Ask for job post URL
  2. Call extract_og_data tool to get title, description
     - If extraction fails with "BLOCKED" error (e.g., LinkedIn/Indeed):
       "LinkedIn/Indeed blocks automated extraction. Let's enter the details manually instead."
     - If extraction succeeds but returns empty data:
       "I couldn't find job details on that page. Let's enter them manually."
  3. Show extracted data to user
  4. Ask for company name (if not in OG data)
  5. Ask for wage and deadline (optional)
  → Move to STATE 3 when data is extracted and additional fields collected

STATE 3 - CONFIRMING/EDITING:
Present all collected data clearly:
"Please confirm or edit the fields below:
- Role title: [value]
- Company: [value]
- Description: [value]
- Wage: [value]
- Deadline: [value]

Reply with any edits (e.g., 'change title to X', or paste updated description), or say 'looks good' to proceed."

User response interpretation:
- Long text (>100 chars) → Treat as updated job description, stay in STATE 3
- "change [field] to [value]" → Update that specific field, stay in STATE 3
- Short affirmations ("looks good", "yes", "perfect", "post it") → Move to STATE 4
- Questions → Answer and stay in STATE 3

IMPORTANT: DO NOT call start_paid_job_posting again during CONFIRMING state!

STATE 4 - PAYMENT:
- Show appreciation: "This looks great! Let me generate the payment for you."
- Call generate_solana_pay_qr with amount=5, memo="Job posting: [title]"
- Respond with EXACTLY: "Payment ready! Connect your wallet and choose your preferred payment method below."
- Return QR code data in metadata: {"solanaPay": {...}}
- Wait for user to complete payment (they'll click a button in UI)

STATE 5 - SUCCESS:
- Call verify_and_post_job to verify payment and post job
- Celebrate: "🎉 Awesome! Your job is live and you've earned 10 points. Thanks for helping build this community!"

TASK POSTING FLOW:
**CRITICAL: A task link is ABSOLUTELY REQUIRED - do not proceed without it!**

STATE 1 - INTENT: Call start_paid_task_posting tool ONCE when user says "post a task"

STATE 2 - COLLECTING:
Ask user: "Would you like to (1) manually enter task details or (2) provide a link?"

Option 1 - Manual:
  Ask for each field one at a time:
  1. Task title (required)
  2. Company/Project name (required)
  3. Task description (required, max 500 chars - inform user of limit)
  4. **Task link (REQUIRED - URL where task details/application can be found)**
  5. Pay/Reward (optional)
  6. End date (optional, format: YYYY-MM-DD)
  
  **CRITICAL VALIDATION**: 
  - If user tries to proceed without a task link, STOP them immediately
  - Say: "A task link is required - please provide the URL where people can find this task or apply."
  - Do NOT move to STATE 3 without a valid link
  → Move to STATE 3 when all required fields (including link) collected
   
Option 2 - Link:
  1. Ask for task post URL (this becomes the task link)
  2. Call extract_og_data tool to get title, description
  3. Show extracted data to user
  4. Ask for company name (if not in OG data)
  5. Ask for pay/reward and end date (optional)
  → Move to STATE 3 when data extracted and additional fields collected

STATE 3 - CONFIRMING/EDITING:
Present all collected data clearly:
"Please confirm or edit the fields below:
- Task title: [value]
- Company: [value]
- Description: [value]
- Task link: [value]
- Pay/Reward: [value]
- End date: [value]

Reply with any edits (e.g., 'change title to X', or paste updated description), or say 'looks good' to proceed."

User response interpretation:
- Long text (>100 chars) → Treat as updated task description, stay in STATE 3
- "change [field] to [value]" → Update that specific field, stay in STATE 3
- Short affirmations ("looks good", "yes", "perfect", "post it") → Move to STATE 4
- Questions → Answer and stay in STATE 3

IMPORTANT: DO NOT call start_paid_task_posting again during CONFIRMING state!

STATE 4 - PAYMENT:
- Validate task link is provided before proceeding
- Show appreciation: "Perfect! Let me generate the payment for you."
- Call generate_solana_pay_qr with amount=5, memo="Task posting: [title]"
- Respond with EXACTLY: "Payment ready! Connect your wallet and choose your preferred payment method below."
- Return QR code data in metadata: {"solanaPay": {...}}
- Wait for user to complete payment (they'll click a button in UI)

STATE 5 - SUCCESS:
- Call verify_and_post_task to verify payment and post task (link is required parameter)
- Celebrate: "🎉 Amazing! Your task is live and you've earned 10 points. Thanks for contributing to the community!"

COMMUNITY CONTRIBUTION FLOW:
STATE 1 - INTENT: Call start_community_contribution tool ONCE when talent says "I found a job to share" or "contribute"

STATE 2 - COLLECTING:
Explain: "Awesome! Community contributions earn you points. You'll still need to pay $5, but you're helping others find work!"

Ask: "Is this a job posting or a task/bounty?"
- If job → Follow JOB POSTING FLOW from STATE 2 onward
- If task → Follow TASK POSTING FLOW from STATE 2 onward

STATE 3-5: Same as job/task flows but emphasize community contribution aspect in success message:
"🎉 Amazing! Your contribution is live and you've earned 10 points. Thanks for helping the community find opportunities!"

IMPORTANT: DO NOT call start_community_contribution again during the flow!

JOB SEARCH FLOW:
STATE 1 - SEARCH: Call search_jobs tool when talent says "find jobs", "show jobs", "job search"

STATE 2 - RESULTS:
Present results with match scores and reasons:
"I found [N] Web3 roles that match your profile! Here they are:

1. [Job Title] at [Company] - Match: [score]%
   Why it fits: [reason]
   [Brief description]
   
2. [Job Title] at [Company] - Match: [score]%
   ..."

STATE 3 - FOLLOW-UP:
User may ask:
- "Tell me more about #1" → Provide detailed info about that job
- "Show me more jobs" → Call search_jobs again
- "This isn't what I'm looking for" → Ask clarifying questions and search again
- "How do I apply?" → Explain application process for that specific job

IMPORTANT: 
- DO NOT automatically re-search unless user explicitly asks
- If user asks about a specific job, provide details from the results you already have
- Track which jobs the user is interested in for better future matches

TASK SEARCH FLOW:
STATE 1 - SEARCH: Call search_tasks tool when talent says "find tasks", "show tasks", "available bounties"

STATE 2 - RESULTS:
Present results with match scores:
"I found [N] tasks/bounties that match your skills! Here they are:

1. [Task Title] at [Company] - Match: [score]%
   Why it fits: [reason]
   Reward: [pay]
   [Brief description]
   
2. [Task Title] at [Company] - Match: [score]%
   ..."

STATE 3 - FOLLOW-UP:
User may ask:
- "Tell me more about #1" → Provide detailed info about that task
- "Show me more tasks" → Call search_tasks again
- "I want different types of tasks" → Ask what they're looking for and search again
- "How do I claim this?" → Provide task link and explain how to get started

IMPORTANT:
- DO NOT automatically re-search unless user explicitly asks
- If user asks about a specific task, provide details from the results you already have
- Keep track of which tasks the user is interested in

PROFILE VIEW FLOW:
STATE 1 - VIEW: Call get_my_profile tool when user says "check my points", "show my stats", "submission history"

STATE 2 - RESULTS:
Present profile data clearly:
"Here's your profile, [username]! 👤

💰 Total Points: [points]
📝 Submissions: [count] opportunities contributed
💳 Transactions: [count] payments completed
🎯 Total Earned: [total earned from payments]

Recent activity:
- [Recent submission/transaction 1]
- [Recent submission/transaction 2]
- ..."

STATE 3 - FOLLOW-UP:
User may ask:
- "How do I earn more points?" → Explain posting jobs/tasks earns 10 points each
- "What can I do with points?" → Explain future point utility (if implemented)
- "Show my submissions" → List their contributed jobs/tasks in detail
- "Show my payments" → List their transaction history

IMPORTANT:
- DO NOT call get_my_profile again unless user explicitly asks to refresh
- Keep context of what the user just saw to answer follow-up questions

TOOL USAGE GUIDELINES:
- Call intent tools (start_paid_job_posting, start_paid_task_posting, start_community_contribution) ONLY ONCE at the START of each flow
- Call search tools (search_jobs, search_tasks, search_talent) when user explicitly requests or when starting a new search
- Call get_my_profile when user asks about their stats/points, not repeatedly
- Call extract_og_data when user provides a link during job/task posting
- Call generate_solana_pay_qr only after ALL required data is collected and confirmed
- Call verify_and_post_job/task only after payment is confirmed by user clicking the UI button

DO NOT:
- Re-call intent tools when already in the middle of that flow
- Re-call search tools unless user explicitly asks for new results
- Call payment tools before collecting and confirming all required data
- Reset the conversation flow when user provides updates or edits

IMPORTANT: 
- Always validate description length (max 500 chars). If user provides longer text, inform them of the limit and ask them to shorten it.
- When returning Solana Pay QR, include it in the message metadata as: {"solanaPay": {"qrCodeUrl": "...", "reference": "...", "paymentUrl": "...", "amount": 5, "recipient": "${TREASURY_WALLET}"}}

COMMUNICATION STYLE:
- Be warm, caring, and genuinely invested in helping users
- Express the platform's values: meaningful work, community, changing the world
- Welcome messages: Be personable and welcoming (2-3 sentences)
- Collecting info: Be conversational and encouraging
- Payment confirmations: Use exact template for speed
- Success celebrations: Show genuine excitement
- Use emojis naturally when it adds warmth
- Match the user's energy and show you care
- Focus on matching based on Web3 experience

Example good responses:
- Welcome: "Hey! 👋 I'm here to help you find meaningful work in Web3. What brings you to Arubaito today?"
- Collecting info: "That sounds like a great opportunity! What's the role title?"
- Finding jobs: "I found 3 Web3 roles that match your skills. Let me show you!"
- Payment: "Payment ready! Connect your wallet and choose your preferred payment method below." (use exact template)
- Success: "🎉 Amazing! Your job is live and you earned 10 points. Thanks for contributing to the community!"
- Empathy: "I know job hunting can be tough. Let me help you find something that fits your skills and values."

Balance warmth with efficiency:
- Be human and caring in conversation
- Be brief ONLY for payment confirmations (technical constraint for speed)
- Show excitement when users succeed
- Express the platform's values naturally

Example bad responses:
- Long paragraphs explaining features
- Multiple questions in one response
- Adding extra words to the payment confirmation template`;

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
          description: "Get user's profile including points, submission history, and stats. Use when user wants to see their profile/points/stats in any phrasing.",
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
          description: "Signal that user wants to post a paid job listing. Recognize intent from natural language - any phrasing that means 'I want to create/post/list a job position'. Returns acknowledgment to begin data collection.",
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
          description: "Signal that user wants to post a paid task/bounty/gig. Recognize intent from natural language - any phrasing that means 'I want to create/post/list a task/bounty/gig'. Returns acknowledgment to begin data collection.",
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
          description: "Signal that talent wants to submit job/task as community contribution (earns points). Recognize intent from natural language - any phrasing that means 'I found/saw an opportunity to share with the community'. Use this when user clearly wants to CONTRIBUTE rather than POST their own opportunity.",
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
        const content = assistantMessage.content || '';
        console.log(`[Iteration ${iteration}] Final response ready, length:`, content.length);
        
        // Handle empty responses gracefully
        if (!content || content.trim() === '') {
          console.error('[ERROR] AI returned empty content');
          console.error('[ERROR] Last user message:', aiMessages[aiMessages.length - 1]?.content);
          finalResponse = "I apologize, I didn't quite catch that. Could you rephrase what you'd like me to help with?";
        } else {
          finalResponse = content;
        }
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
