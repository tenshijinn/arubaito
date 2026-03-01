import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const roleTagToTitle: Record<string, string> = {
  dev: "Developer",
  product: "Product",
  research: "Researcher",
  community: "Community",
  design: "Designer",
  ops: "Operations",
};

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
      }
    > = new Map();

    // 1. Twitter Bluechip Whitelist members — ONLY those with approved submissions (actually claimed/logged in)
    const { data: approvedSubmissions } = await supabase
      .from("twitter_whitelist_submissions")
      .select("twitter_handle, profile_image_url, display_name")
      .eq("status", "approved");

    if (approvedSubmissions) {
      for (const sub of approvedSubmissions) {
        const handle = sub.twitter_handle.replace(/^@/, "").toLowerCase();

        // Verify they're actually on the whitelist
        const { data: onWhitelist } = await supabase
          .from("twitter_whitelist")
          .select("twitter_handle")
          .ilike("twitter_handle", handle)
          .limit(1)
          .maybeSingle();

        if (!onWhitelist) continue;

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: sub.profile_image_url || null,
          membership_type: "whitelist",
          cv_score: null,
          top_activities: [],
          job_title: null,
        });
      }
    }

    // 2. NFT Membership Holders from rei_registry
    const { data: nftHolders } = await supabase
      .from("rei_registry")
      .select("handle, profile_image_url, wallet_address, role_tags")
      .eq("nft_minted", true)
      .not("handle", "is", null);

    if (nftHolders) {
      for (const nft of nftHolders) {
        if (!nft.handle) continue;
        const handle = nft.handle.replace(/^@/, "").toLowerCase();
        const existing = members.get(handle);

        // Derive job title from role_tags
        let jobTitle: string | null = null;
        if (nft.role_tags && Array.isArray(nft.role_tags) && nft.role_tags.length > 0) {
          jobTitle = roleTagToTitle[nft.role_tags[0]] || nft.role_tags[0];
        }

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: nft.profile_image_url || existing?.profile_image_url || null,
          membership_type: existing ? existing.membership_type + ",nft" : "nft",
          cv_score: existing?.cv_score || null,
          top_activities: existing?.top_activities || [],
          job_title: jobTitle || existing?.job_title || null,
        });
      }
    }

    // 3. CV Score 80+ members
    const { data: cvMembers } = await supabase
      .from("cv_analyses")
      .select("user_id, overall_score, bluechip_details, wallet_address")
      .gte("overall_score", 80);

    if (cvMembers) {
      for (const cv of cvMembers) {
        const { data: userData } = await supabase.auth.admin.getUserById(cv.user_id);
        if (!userData?.user) continue;

        const meta = userData.user.user_metadata;
        const handle = (meta?.preferred_username || meta?.user_name || "").toLowerCase();
        if (!handle) continue;

        const avatarUrl = meta?.avatar_url || meta?.picture || null;

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
        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: avatarUrl || existing?.profile_image_url || null,
          membership_type: existing ? existing.membership_type + ",cv_score" : "cv_score",
          cv_score: cv.overall_score,
          top_activities: topActivities.length > 0 ? topActivities : existing?.top_activities || [],
          job_title: existing?.job_title || null,
        });
      }
    }

    // 4. NS Quiz passers (Network School alignment test)
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

        // Try to get profile image from submissions or auth
        let profileImage = existing?.profile_image_url || null;
        if (!profileImage && ns.x_user_id) {
          // Check whitelist submissions for avatar
          const { data: sub } = await supabase
            .from("twitter_whitelist_submissions")
            .select("profile_image_url")
            .eq("x_user_id", ns.x_user_id)
            .limit(1)
            .maybeSingle();
          if (sub?.profile_image_url) profileImage = sub.profile_image_url;
        }

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: profileImage,
          membership_type: existing ? existing.membership_type + ",ns_member" : "ns_member",
          cv_score: existing?.cv_score || null,
          top_activities: existing?.top_activities || [],
          job_title: existing?.job_title || null,
        });
      }
    }

    // Upsert all members into club_member_showcase
    const upsertData = Array.from(members.values());

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
