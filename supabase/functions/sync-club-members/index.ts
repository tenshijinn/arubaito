import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      }
    > = new Map();

    // 1. Twitter Bluechip Whitelist members
    const { data: whitelistData } = await supabase
      .from("twitter_whitelist")
      .select("twitter_handle");

    if (whitelistData) {
      for (const wl of whitelistData) {
        const handle = wl.twitter_handle.replace(/^@/, "").toLowerCase();

        // Get profile image from submissions table
        const { data: submission } = await supabase
          .from("twitter_whitelist_submissions")
          .select("profile_image_url")
          .eq("twitter_handle", wl.twitter_handle)
          .limit(1)
          .single();

        members.set(handle, {
          twitter_handle: handle,
          profile_image_url: submission?.profile_image_url || null,
          membership_type: "whitelist",
          cv_score: null,
          top_activities: [],
        });
      }
    }

    // 2. NFT Membership Holders from rei_registry
    const { data: nftHolders } = await supabase
      .from("rei_registry")
      .select("handle, profile_image_url, wallet_address")
      .eq("nft_minted", true)
      .not("handle", "is", null);

    if (nftHolders) {
      for (const nft of nftHolders) {
        if (!nft.handle) continue;
        const handle = nft.handle.replace(/^@/, "").toLowerCase();
        const existing = members.get(handle);
        members.set(handle, {
          twitter_handle: handle,
          profile_image_url:
            nft.profile_image_url || existing?.profile_image_url || null,
          membership_type: existing ? existing.membership_type + ",nft" : "nft",
          cv_score: existing?.cv_score || null,
          top_activities: existing?.top_activities || [],
        });
      }
    }

    // 3. CV Score 80+ members
    const { data: cvMembers } = await supabase
      .from("cv_analyses")
      .select(
        "user_id, overall_score, bluechip_details, wallet_address"
      )
      .gte("overall_score", 80);

    if (cvMembers) {
      for (const cv of cvMembers) {
        // Get Twitter info from auth.users metadata
        const { data: userData } = await supabase.auth.admin.getUserById(
          cv.user_id
        );
        if (!userData?.user) continue;

        const meta = userData.user.user_metadata;
        const handle = (
          meta?.preferred_username ||
          meta?.user_name ||
          ""
        ).toLowerCase();
        if (!handle) continue;

        const avatarUrl =
          meta?.avatar_url || meta?.picture || null;

        // Extract top 3 on-chain activities from bluechip_details
        let topActivities: unknown[] = [];
        if (cv.bluechip_details) {
          const details = cv.bluechip_details as Record<string, unknown>;
          const activities = (details.significantActivities ||
            []) as Array<{ description?: string; chain?: string }>;
          topActivities = activities.slice(0, 3).map((a) => ({
            description: a.description || "",
            chain: a.chain || "",
          }));
        }

        const existing = members.get(handle);
        members.set(handle, {
          twitter_handle: handle,
          profile_image_url:
            avatarUrl || existing?.profile_image_url || null,
          membership_type: existing
            ? existing.membership_type + ",cv_score"
            : "cv_score",
          cv_score: cv.overall_score,
          top_activities:
            topActivities.length > 0
              ? topActivities
              : existing?.top_activities || [],
        });
      }
    }

    // Upsert all members into club_member_showcase
    const upsertData = Array.from(members.values());

    if (upsertData.length > 0) {
      // Clear old data and insert fresh
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
