

## Fix Member Showcase Slider - Missing Details and Layout

### Issues to Fix

1. **Missing Proof of Talent pills** -- The on-chain activities aren't being populated for most members because only CV 80+ members have `bluechip_details`. The `rei_registry` also has `profile_analysis` with on-chain data. Need to pull from both sources.

2. **"NS Aligned" label** -- Change to "Network School Member"

3. **Remove member count** -- "X verified members" text at the bottom is anti-marketing with low numbers. Remove entirely.

4. **Missing CV Profile Score** -- Currently only populated for CV 80+ members. For rei_registry members, pull `profile_score`. For NS members, we could show their NS quiz score. Ensure the score is always shown when available.

5. **Job title from AI, not role_tags** -- Instead of mapping `role_tags` to static titles like "Developer", use AI (Lovable AI) to generate a concise job title from the CV feedback/analysis content during sync.

6. **Missing Twitter profile images** -- The `_normal` suffix on Twitter image URLs gives tiny 48x48 images. The whitelist submissions store `_normal` URLs. Need to replace `_normal` with `_400x400` in the sync function. Also, NS-only members have no image path -- need to also check `rei_registry` for their profile image.

7. **Layout alignment** -- Match the exact layout from the reference image: "CLUB MEMBER" large and bold at top, "CV Profile Score XX/100" directly below in smaller mono text, job title in coral italic below that, large circular avatar centered, handle below avatar, then "Proof of Talent" label and pills at bottom.

---

### Changes

#### 1. Update Edge Function: `supabase/functions/sync-club-members/index.ts`

**AI Job Title Generation:**
- After aggregating all members, for each member that has CV feedback text (from `cv_analyses`) or `profile_analysis` summary (from `rei_registry`), call Lovable AI to generate a 2-4 word job title (e.g. "Full Stack Developer", "DeFi Researcher", "Smart Contract Engineer").
- Use `LOVABLE_API_KEY` with `google/gemini-2.5-flash-lite` (cheapest/fastest) since this is a simple summarization task.

**Image URL fix:**
- Replace `_normal` with `_400x400` in all `profile_image_url` values before storing.

**Broader Proof of Talent sourcing:**
- For CV 80+ members: pull `bluechip_details.significantActivities` (top 3) -- already done.
- For rei_registry members: pull on-chain activities from `profile_analysis` if available.
- Deduplicate activities by description.

**Profile score sourcing:**
- CV 80+ members: use `overall_score` from `cv_analyses`.
- Rei registry members: use `profile_score` from `rei_registry`.
- Prefer the higher score when a member appears in multiple sources.

**NS members profile images:**
- Also check `rei_registry` by handle for profile images when not found elsewhere.

#### 2. Update Component: `src/components/MemberSlider.tsx`

**Layout changes to match reference exactly:**
- "CLUB MEMBER" -- large bold mono text, centered, at top (bigger than current `text-sm`, use `text-2xl` or similar)
- "CV Profile Score XX/100" -- smaller mono text in coral directly below, with score number bold. Always show if available.
- Job title -- coral colored, italic, large font below score
- Avatar -- large circle (w-36 h-36), grayscale, coral border ring, centered
- Chevron arrows -- larger, positioned at avatar vertical center, further out
- @handle -- white/cream text below avatar
- "Proof of Talent" label in coral mono, left-aligned
- Activity pills -- larger, in a row, coral background with rounded corners

**Remove:**
- Member count text at the bottom
- Membership type label ("Verified", "Network School Member" etc.) -- this was the anti-marketing text

#### 3. No database schema changes needed
The existing `club_member_showcase` table already has all required columns.

---

### Technical Details

**Edge function AI call for job titles:**
```
POST https://ai.gateway.lovable.dev/v1/chat/completions
Model: google/gemini-2.5-flash-lite
Prompt: "Based on this CV feedback, generate a 2-4 word professional job title. Return ONLY the job title, nothing else."
Input: The feedback text from cv_analyses or profile_analysis summary from rei_registry
```

This runs once during sync (not on every page load), so cost is minimal.

**Image URL normalization:**
All Twitter profile image URLs will have `_normal` replaced with `_400x400` to get high-resolution images.

**File changes:**
1. `supabase/functions/sync-club-members/index.ts` -- Major rewrite of sync logic
2. `src/components/MemberSlider.tsx` -- Layout overhaul to match reference image exactly
