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
        _feedback_text: string | null; // internal: used for AI job title generation
      }
    > = new Map();

    // 1. Twitter Bluechip Whitelist members — ONLY those with approved submissions
    const { data: approvedSubmissions } = await supabase
      .from("twitter_whitelist_submissions")
      .select("twitter_handle, profile_image_url, display_name")
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

    // 2. NFT Membership Holders from rei_registry
    const { data: nftHolders } = await supabase
      .from("rei_registry")
      .select("handle, profile_image_url, wallet_address, role_tags, profile_analysis, profile_score, analysis_summary")
      .eq("nft_minted", true)
      .not("handle", "is", null);

    if (nftHolders) {
      for (const nft of nftHolders) {
        if (!nft.handle) continue;
        const handle = nft.handle.replace(/^@/, "").toLowerCase();
        const existing = members.get(handle);

        // Extract on-chain activities from profile_analysis
        let activities: unknown[] = existing?.top_activities || [];
        if (nft.profile_analysis) {
          const analysis = nft.profile_analysis as Record<string, unknown>;
          const onChain = (analysis.onChainActivities || analysis.significantActivities || []) as Array<{ description?: string; chain?: string }>;
          if (onChain.length > 0 && activities.length === 0) {
            activities = onChain.slice(0, 3).map((a) => ({
              description: a.description || "",
              chain: a.chain || "",
            }));
          }
        }

        const score = nft.profile_score || existing?.cv_score || null;
        const feedbackText = nft.analysis_summary || existing?._feedback_text || null;

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: fixImageUrl(nft.profile_image_url) || existing?.profile_image_url || null,
          membership_type: existing ? existing.membership_type + ",nft" : "nft",
          cv_score: score && existing?.cv_score ? Math.max(Number(score), Number(existing.cv_score)) : (score || existing?.cv_score || null),
          top_activities: activities,
          job_title: existing?.job_title || null,
          _feedback_text: feedbackText,
        });
      }
    }

    // 3. CV Score 80+ members
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

    // 4. NS Quiz passers
    const { data: nsPassers } = await supabase
      .from("ns_quiz_attempts")
      .select("twitter_handle, x_user_id, score")
      .eq("passed", true)
      .not("twitter_handle", "is", null);

    if (nsPassers) {
      for (const ns of nsPassers) {
        if (!ns.twitter_handle) continue;
        const handle = ns.twitter_handle.replace(/^@/, "").toLowerCase();
        const existing = members.get(handle);

        // Try to get profile image from multiple sources
        let profileImage = existing?.profile_image_url || null;
        if (!profileImage) {
          // Check whitelist submissions
          if (ns.x_user_id) {
            const { data: sub } = await supabase
              .from("twitter_whitelist_submissions")
              .select("profile_image_url")
              .eq("x_user_id", ns.x_user_id)
              .limit(1)
              .maybeSingle();
            if (sub?.profile_image_url) profileImage = fixImageUrl(sub.profile_image_url);
          }
          // Check rei_registry by handle
          if (!profileImage) {
            const { data: reiProfile } = await supabase
              .from("rei_registry")
              .select("profile_image_url, profile_score, analysis_summary")
              .ilike("handle", handle)
              .limit(1)
              .maybeSingle();
            if (reiProfile?.profile_image_url) profileImage = fixImageUrl(reiProfile.profile_image_url);
            // Also grab score and summary from rei_registry if available
            if (reiProfile?.profile_score && !existing?.cv_score) {
              // Will be set below
            }
          }
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

    // 5. For members missing profile images, do a final check in rei_registry by handle
    for (const [handle, member] of members) {
      if (!member.profile_image_url) {
        const { data: reiProfile } = await supabase
          .from("rei_registry")
          .select("profile_image_url, profile_score, analysis_summary, profile_analysis")
          .ilike("handle", handle)
          .limit(1)
          .maybeSingle();

        if (reiProfile) {
          if (reiProfile.profile_image_url) {
            member.profile_image_url = fixImageUrl(reiProfile.profile_image_url);
          }
          if (reiProfile.profile_score && !member.cv_score) {
            member.cv_score = reiProfile.profile_score;
          }
          if (reiProfile.analysis_summary && !member._feedback_text) {
            member._feedback_text = reiProfile.analysis_summary;
          }
          // Extract activities
          if (member.top_activities.length === 0 && reiProfile.profile_analysis) {
            const analysis = reiProfile.profile_analysis as Record<string, unknown>;
            const onChain = (analysis.onChainActivities || analysis.significantActivities || []) as Array<{ description?: string; chain?: string }>;
            if (onChain.length > 0) {
              member.top_activities = onChain.slice(0, 3).map((a) => ({
                description: a.description || "",
                chain: a.chain || "",
              }));
            }
          }
        }
      }
    }

    // 6. Generate AI job titles for members who have feedback text but no job title
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
    // Process in batches of 3 to avoid rate limiting
    for (let i = 0; i < titlePromises.length; i += 3) {
      await Promise.all(titlePromises.slice(i, i + 3));
      if (i + 3 < titlePromises.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Prepare upsert data (strip internal _feedback_text field)
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
          nft_holders: nftHolders?.length || 0,
          cv_80_plus: cvMembers?.length || 0,
          ns_passers: nsPassers?.length || 0,
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
