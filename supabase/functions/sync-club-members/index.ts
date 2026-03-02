import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Replace Twitter _normal suffix with _400x400 for high-res images */
function fixImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/_normal\./, "_400x400.");
}

/** Use Lovable AI to generate a concise job title from CV/profile text */
async function generateJobTitle(text: string): Promise<string | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || !text || text.trim().length < 20) return null;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You generate professional job titles. Return ONLY a 2-4 word job title (e.g. 'Full Stack Developer', 'DeFi Researcher', 'Smart Contract Engineer'). No explanation, no punctuation, no quotes.",
          },
          {
            role: "user",
            content: `Based on this profile information, generate a concise professional job title:\n\n${text.slice(0, 800)}`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      console.error("AI job title error:", resp.status);
      return null;
    }

    const data = await resp.json();
    const title = data.choices?.[0]?.message?.content?.trim();
    return title && title.length < 60 ? title : null;
  } catch (e) {
    console.error("AI job title error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const members: Map<
      string,
      {
        twitter_handle: string;
        profile_image_url: string | null;
        membership_type: string;
        cv_score: number | null;
        top_activities: unknown[];
        job_title: string | null;
        _feedback_text: string | null;
      }
    > = new Map();

    // ── Step 1: Approved whitelist members ─────────────────────────────
    const { data: approvedSubmissions } = await supabase
      .from("twitter_whitelist_submissions")
      .select("twitter_handle, profile_image_url, display_name, x_user_id")
      .eq("status", "approved");

    if (approvedSubmissions) {
      for (const sub of approvedSubmissions) {
        const handle = sub.twitter_handle.replace(/^@/, "").toLowerCase();

        const { data: onWhitelist } = await supabase
          .from("twitter_whitelist")
          .select("twitter_handle")
          .ilike("twitter_handle", handle)
          .limit(1)
          .maybeSingle();

        if (!onWhitelist) continue;

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: fixImageUrl(sub.profile_image_url),
          membership_type: "whitelist",
          cv_score: null,
          top_activities: [],
          job_title: null,
          _feedback_text: null,
        });
      }
    }

    // ── Step 2: CV Score 80+ members (entry via CV alone) ──────────────
    const { data: cvMembers } = await supabase
      .from("cv_analyses")
      .select("user_id, overall_score, bluechip_details, wallet_address, feedback")
      .gte("overall_score", 80);

    if (cvMembers) {
      for (const cv of cvMembers) {
        const { data: userData } = await supabase.auth.admin.getUserById(cv.user_id);
        if (!userData?.user) continue;

        const meta = userData.user.user_metadata;
        const handle = (meta?.preferred_username || meta?.user_name || "").toLowerCase();
        if (!handle) continue;

        const avatarUrl = fixImageUrl(meta?.avatar_url || meta?.picture || null);

        let topActivities: unknown[] = [];
        if (cv.bluechip_details) {
          const details = cv.bluechip_details as Record<string, unknown>;
          const activities = (details.significantActivities || []) as Array<{ description?: string; chain?: string }>;
          topActivities = activities.slice(0, 3).map((a) => ({
            description: a.description || "",
            chain: a.chain || "",
          }));
        }

        const existing = members.get(handle);
        const bestScore = existing?.cv_score ? Math.max(Number(cv.overall_score), Number(existing.cv_score)) : cv.overall_score;

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: avatarUrl || existing?.profile_image_url || null,
          membership_type: existing ? existing.membership_type + ",cv_score" : "cv_score",
          cv_score: bestScore,
          top_activities: topActivities.length > 0 ? topActivities : existing?.top_activities || [],
          job_title: existing?.job_title || null,
          _feedback_text: cv.feedback || existing?._feedback_text || null,
        });
      }
    }

    // ── Step 3: NS Quiz passers ────────────────────────────────────────
    const { data: nsPassers } = await supabase
      .from("ns_quiz_attempts")
      .select("twitter_handle, x_user_id, score, profile_image_url")
      .eq("passed", true)
      .not("twitter_handle", "is", null);

    if (nsPassers) {
      for (const ns of nsPassers) {
        if (!ns.twitter_handle) continue;
        const handle = ns.twitter_handle.replace(/^@/, "").toLowerCase();
        const existing = members.get(handle);

        // Profile image: quiz attempt (new column) → whitelist submissions → existing
        let profileImage = existing?.profile_image_url || null;
        if (!profileImage && ns.profile_image_url) {
          profileImage = fixImageUrl(ns.profile_image_url);
        }
        if (!profileImage && ns.x_user_id) {
          const { data: sub } = await supabase
            .from("twitter_whitelist_submissions")
            .select("profile_image_url")
            .eq("x_user_id", ns.x_user_id)
            .limit(1)
            .maybeSingle();
          if (sub?.profile_image_url) profileImage = fixImageUrl(sub.profile_image_url);
        }

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: profileImage,
          membership_type: existing ? existing.membership_type + ",ns_member" : "ns_member",
          cv_score: existing?.cv_score || null,
          top_activities: existing?.top_activities || [],
          job_title: existing?.job_title || null,
          _feedback_text: existing?._feedback_text || null,
        });
      }
    }

    // ── Step 4: Cross-reference CV data for ALL existing members ───────
    // For every member missing cv_score or top_activities, look up their CV
    // by matching x_user_id → auth.users → cv_analyses
    let crossRefCount = 0;

    // Build a lookup of handle → x_user_id from whitelist submissions
    const handleToXUserId: Map<string, string> = new Map();
    if (approvedSubmissions) {
      for (const sub of approvedSubmissions) {
        if (sub.x_user_id) {
          const handle = sub.twitter_handle.replace(/^@/, "").toLowerCase();
          handleToXUserId.set(handle, sub.x_user_id);
        }
      }
    }
    // Also add from NS passers
    if (nsPassers) {
      for (const ns of nsPassers) {
        if (ns.x_user_id && ns.twitter_handle) {
          const handle = ns.twitter_handle.replace(/^@/, "").toLowerCase();
          if (!handleToXUserId.has(handle)) {
            handleToXUserId.set(handle, ns.x_user_id);
          }
        }
      }
    }

    // Fetch all auth users once for cross-referencing
    const { data: allUsersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const allAuthUsers = allUsersData?.users || [];

    for (const [handle, member] of members) {
      // Skip members who already have CV data
      if (member.cv_score && member.top_activities.length > 0) continue;

      const xUserId = handleToXUserId.get(handle);

      // Try multiple matching strategies to find the auth user:
      // 1. provider_id matches x_user_id
      // 2. email matches {handle}@twitter.oauth (custom twitter auth pattern)
      let authUser = null;
      if (xUserId) {
        authUser = allAuthUsers.find((u) => {
          const providerId = u.user_metadata?.provider_id || u.user_metadata?.sub;
          return providerId === xUserId;
        });
      }
      if (!authUser) {
        const twitterEmail = `${handle}@twitter.oauth`;
        authUser = allAuthUsers.find((u) => u.email === twitterEmail);
      }

      if (!authUser) continue;

      // Get best CV analysis for this user
      const { data: cvData } = await supabase
        .from("cv_analyses")
        .select("overall_score, bluechip_details, feedback")
        .eq("user_id", authUser.id)
        .order("overall_score", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cvData) continue;

      crossRefCount++;

      // Attach score
      if (!member.cv_score) {
        member.cv_score = cvData.overall_score;
      }

      // Attach activities
      if (member.top_activities.length === 0 && cvData.bluechip_details) {
        const details = cvData.bluechip_details as Record<string, unknown>;
        const activities = (details.significantActivities || []) as Array<{ description?: string; chain?: string }>;
        if (activities.length > 0) {
          member.top_activities = activities.slice(0, 3).map((a) => ({
            description: a.description || "",
            chain: a.chain || "",
          }));
        }
      }

      // Attach feedback for AI job title generation
      if (!member._feedback_text && cvData.feedback) {
        member._feedback_text = cvData.feedback;
      }
    }

    // ── Step 5: Generate AI job titles ─────────────────────────────────
    const titlePromises: Promise<void>[] = [];
    for (const [handle, member] of members) {
      if (!member.job_title && member._feedback_text) {
        titlePromises.push(
          generateJobTitle(member._feedback_text).then((title) => {
            if (title) member.job_title = title;
          })
        );
      }
    }
    for (let i = 0; i < titlePromises.length; i += 3) {
      await Promise.all(titlePromises.slice(i, i + 3));
      if (i + 3 < titlePromises.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // ── Upsert to showcase table ──────────────────────────────────────
    const upsertData = Array.from(members.values()).map(({ _feedback_text, ...rest }) => rest);

    if (upsertData.length > 0) {
      await supabase.from("club_member_showcase").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const { error: insertError } = await supabase
        .from("club_member_showcase")
        .insert(upsertData);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        members_synced: upsertData.length,
        sources: {
          whitelist_claimed: approvedSubmissions?.length || 0,
          cv_80_plus: cvMembers?.length || 0,
          ns_passers: nsPassers?.length || 0,
          cross_referenced: crossRefCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
