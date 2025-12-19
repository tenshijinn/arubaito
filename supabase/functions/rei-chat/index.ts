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

    // Build system prompt - condensed for speed
    const systemPrompt = `You are Rei, a warm, caring AI assistant for the Rei Proof-Of-Talent Portal. You connect Web3 talent with opportunities.

Current user type: ${userType}
User's wallet address: ${walletAddress}
Treasury wallet: ${TREASURY_WALLET}

CORE RULES:
1. Be warm and personable, but keep responses concise
2. Payment confirmations: EXACTLY say "Payment ready! Connect your wallet and choose your preferred payment method below."
3. NEVER restart a flow you're already in - track your state
4. Call save_draft after EACH field collected
5. Trust natural language - recognize what users MEAN

FLOW STATES: INTENT → COLLECTING → CONFIRMING → PAYMENT → SUCCESS

KEY ACTIONS:
- "find jobs/roles" → search_jobs immediately
- "find tasks/bounties" → search_tasks immediately  
- "post a job" → check_my_drafts FIRST, then collect: title, company, description (max 500 chars), wage (opt), deadline (opt)
- "post a task" → check_my_drafts FIRST, then collect: title, company, description, link (REQUIRED), pay (opt), end date (opt)
- "check my points/profile" → get_my_profile immediately

JOB/TASK POSTING:
- Drafts exist? Show with emojis (1️⃣, 2️⃣) in metadata.drafts format
- After confirming all details → generate_solana_pay_qr
- After payment confirmed → verify_and_post_job/task → complete_draft
- Tasks REQUIRE a link - don't proceed without it

CONFIRMING STATE:
- Long text (>100 chars) = Updated description
- "looks good/yes/perfect" = Proceed to payment
- "change X to Y" = Update that field

FOR TALENT:
- Wallet connected (${walletAddress}) - never ask again
- If search returns "profile not found": Include {"action":"register","link":"/rei"}

PAYMENT: $5 in SOL/SPL tokens → ${TREASURY_WALLET}, earns 10 points

RESTRICTIONS:
- NO alerts/notifications feature
- NO scraping job boards
- DON'T suggest unimplemented features

COMMUNICATION: Be warm and human. Match user energy. Celebrate successes. Keep payment messages exact and brief.`;

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
      
      // === DRAFT MANAGEMENT TOOLS ===
      {
        type: "function",
        function: {
          name: "check_my_drafts",
          description: "Check if user has any in-progress job or task drafts. Use when user says 'post a job' or 'post a task' to see if they have existing drafts to continue.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "User's wallet address" }
            },
            required: ["walletAddress"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "load_draft",
          description: "Load a specific draft by ID to continue working on it",
          parameters: {
            type: "object",
            properties: {
              draftId: { type: "string", description: "Draft ID (UUID)" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft to load" }
            },
            required: ["draftId", "draftType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "save_draft",
          description: "Save or update draft progress to database. Call after each field is collected or updated.",
          parameters: {
            type: "object",
            properties: {
              walletAddress: { type: "string", description: "User's wallet address" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft" },
              draftId: { type: "string", description: "Draft ID (UUID) if updating existing draft, omit if creating new" },
              data: {
                type: "object",
                description: "Draft data fields to save/update",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  company_name: { type: "string" },
                  compensation: { type: "string" },
                  link: { type: "string" },
                  requirements: { type: "string" },
                  deadline: { type: "string" },
                  end_date: { type: "string" },
                  role_tags: { type: "array", items: { type: "string" } },
                  og_image: { type: "string" },
                  status: { type: "string", enum: ["draft", "confirming", "payment_pending"] }
                }
              }
            },
            required: ["walletAddress", "draftType", "data"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "delete_draft",
          description: "Delete a draft permanently. Use when user says 'delete draft' or 'forget it'.",
          parameters: {
            type: "object",
            properties: {
              draftId: { type: "string", description: "Draft ID (UUID)" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft" }
            },
            required: ["draftId", "draftType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "complete_draft",
          description: "Delete draft after successful payment and job/task posting. Use after verify_and_post_job or verify_and_post_task succeeds.",
          parameters: {
            type: "object",
            properties: {
              draftId: { type: "string", description: "Draft ID (UUID)" },
              draftType: { type: "string", enum: ["job", "task"], description: "Type of draft" }
            },
            required: ["draftId", "draftType"]
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

    // Call Lovable AI with tool calling - using faster model
    let aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    let maxIterations = 3; // Reduced from 5 for speed
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
          model: 'google/gemini-2.5-flash', // Faster model for improved response time
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
        // Execute tool calls in parallel for speed
        const toolCalls = assistantMessage.tool_calls;
        console.log(`Executing ${toolCalls.length} tool(s) in parallel...`);
        
        const toolPromises = toolCalls.map(async (toolCall: any) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          console.log('Executing tool:', toolName);
          
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
          
          return {
            role: "tool" as any,
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(toolResult)
          };
        });
        
        // Wait for all tools to complete in parallel
        const toolResults = await Promise.all(toolPromises);
        
        // Add all tool results to messages
        for (const result of toolResults) {
          aiMessages.push(result as any);
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

    // Check if response contains metadata (e.g., Solana Pay QR, drafts, actions)
    let metadata: any = null;
    try {
      // Try to extract JSON metadata from response - look for various metadata patterns
      
      // Pattern 1: solanaPay metadata
      const solanaPayRegex = /\{\s*["']solanaPay["']\s*:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*\}/;
      const solanaPayMatch = finalResponse.match(solanaPayRegex);
      if (solanaPayMatch) {
        metadata = { ...metadata, ...JSON.parse(solanaPayMatch[0]) };
        finalResponse = finalResponse.replace(solanaPayMatch[0], '').trim();
      }
      
      // Pattern 2: drafts metadata - {"drafts":[...]}
      const draftsRegex = /\{\s*["']drafts["']\s*:\s*\[[^\]]*\]\s*\}/g;
      const draftsMatch = finalResponse.match(draftsRegex);
      if (draftsMatch) {
        const draftsData = JSON.parse(draftsMatch[0]);
        metadata = { ...metadata, ...draftsData };
        finalResponse = finalResponse.replace(draftsMatch[0], '').trim();
      }
      
      // Pattern 3: "Metadata: {...}" format that AI sometimes uses
      const metadataLabelRegex = /Metadata:\s*(\{[\s\S]*?\})\s*$/i;
      const metadataLabelMatch = finalResponse.match(metadataLabelRegex);
      if (metadataLabelMatch) {
        try {
          const extractedData = JSON.parse(metadataLabelMatch[1]);
          metadata = { ...metadata, ...extractedData };
          finalResponse = finalResponse.replace(metadataLabelMatch[0], '').trim();
        } catch (parseError) {
          // If parsing fails, just remove the metadata label text
          finalResponse = finalResponse.replace(metadataLabelRegex, '').trim();
        }
      }
      
      // Pattern 4: Generic action metadata
      const actionRegex = /\{\s*["']action["']\s*:\s*["'][^"']+["']\s*,\s*["']link["']\s*:\s*["'][^"']+["']\s*\}/;
      const actionMatch = finalResponse.match(actionRegex);
      if (actionMatch) {
        const actionData = JSON.parse(actionMatch[0]);
        metadata = { ...metadata, ...actionData };
        finalResponse = finalResponse.replace(actionMatch[0], '').trim();
      }
      
      // Clean up any remaining "Metadata:" labels without valid JSON
      finalResponse = finalResponse.replace(/\n*Metadata:\s*$/i, '').trim();
      
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
    
    case 'check_my_drafts': {
      // Get all job drafts for user
      const { data: jobDrafts } = await supabase
        .from('job_drafts')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .order('created_at', { ascending: false });
      
      // Get all task drafts for user
      const { data: taskDrafts } = await supabase
        .from('task_drafts')
        .select('*')
        .eq('wallet_address', args.walletAddress)
        .order('created_at', { ascending: false });
      
      const allDrafts = [
        ...(jobDrafts || []).map((d: any) => ({ ...d, type: 'job' })),
        ...(taskDrafts || []).map((d: any) => ({ ...d, type: 'task' }))
      ];
      
      if (allDrafts.length === 0) {
        return { drafts: [], hasDrafts: false };
      }
      
      // Sort by created_at descending
      allDrafts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Add emoji indicators
      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const draftsWithEmoji = allDrafts.map((draft: any, idx: number) => ({
        id: draft.id,
        type: draft.type,
        title: draft.title || `Untitled ${draft.type}`,
        status: draft.status,
        emoji: emojis[idx] || '➕',
        created_at: draft.created_at
      }));
      
      return {
        drafts: draftsWithEmoji,
        hasDrafts: true,
        message: `Found ${allDrafts.length} draft(s). Return them in metadata.drafts format for UI rendering.`
      };
    }
    
    case 'load_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      const { data: draft, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', args.draftId)
        .single();
      
      if (error || !draft) {
        return { error: 'Draft not found' };
      }
      
      return {
        success: true,
        draft: draft,
        message: `Loaded ${args.draftType} draft: ${draft.title || 'Untitled'}. Current status: ${draft.status}`
      };
    }
    
    case 'save_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      if (args.draftId) {
        // Update existing draft
        const { data: updated, error } = await supabase
          .from(tableName)
          .update({
            ...args.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', args.draftId)
          .select()
          .single();
        
        if (error) {
          return { error: error.message };
        }
        
        return {
          success: true,
          draftId: args.draftId,
          message: `Draft updated successfully`
        };
      } else {
        // Create new draft
        const { data: created, error } = await supabase
          .from(tableName)
          .insert({
            wallet_address: args.walletAddress,
            ...args.data
          })
          .select()
          .single();
        
        if (error) {
          return { error: error.message };
        }
        
        return {
          success: true,
          draftId: created.id,
          message: `New draft created successfully. Draft ID: ${created.id}`
        };
      }
    }
    
    case 'delete_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', args.draftId);
      
      if (error) {
        return { error: error.message };
      }
      
      return {
        success: true,
        message: `Draft deleted successfully`
      };
    }
    
    case 'complete_draft': {
      const tableName = args.draftType === 'job' ? 'job_drafts' : 'task_drafts';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', args.draftId);
      
      if (error) {
        console.log(`[complete_draft] Error deleting draft: ${error.message}`);
        // Don't fail if draft deletion fails - the posting was successful
      }
      
      return {
        success: true,
        message: `Draft completed and removed from database`
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

      // Insert job (unique constraint will prevent duplicates)
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
        // Handle unique constraint violation (23505) - payment already used
        if (error.code === '23505') {
          return { error: 'Payment already used for another job posting' };
        }
        return { error: error.message };
      }

      // Award points (will also handle race condition via unique constraint)
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

      // Insert task (unique constraint will prevent duplicates)
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
        // Handle unique constraint violation (23505) - payment already used
        if (error.code === '23505') {
          return { error: 'Payment already used for another task posting' };
        }
        return { error: error.message };
      }

      // Award points (will also handle race condition via unique constraint)
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
