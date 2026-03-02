

## Cross-Reference CV Data for All Showcase Members + Remove rei_registry

### Problem
You're in the showcase via the approved whitelist, but your on-chain activities and CV score (79.52) never get attached because the sync only pulls CV data for 80+ scorers. The CV data exists and is rich (Ethereum, Solana Devnet, Base, Avalanche activity) -- it just needs to be linked.

### Changes

#### 1. Database Migration: Add `profile_image_url` to `ns_quiz_attempts`
```sql
ALTER TABLE public.ns_quiz_attempts ADD COLUMN profile_image_url text;
```

#### 2. `src/pages/NetworkSchool.tsx` -- Save avatar on quiz submit
Add `profile_image_url: twitterUser?.profile_image_url || null` to the insert in `finishQuiz`.

#### 3. `supabase/functions/sync-club-members/index.ts` -- Major rewrite

**Remove entirely:**
- Step 2 (NFT holders from `rei_registry`)
- Step 5 (final `rei_registry` fallback)
- All `rei_registry` references in Step 4

**Keep (modified):**
- Step 1: Approved whitelist members (unchanged)
- Step 3: CV 80+ members still add NEW members to the map, but the threshold is only for entry via CV alone
- Step 4: NS passers -- pull `profile_image_url` from `ns_quiz_attempts` directly (new column), fall back to `twitter_whitelist_submissions`

**Add new Step 5: Cross-reference CV data for all existing members**
After all sources are aggregated, for every member in the map that has no `cv_score` or empty `top_activities`:
1. Look up their `x_user_id` from `twitter_whitelist_submissions` (by handle)
2. Find the matching `auth.users` entry where `raw_user_meta_data->>'provider_id'` equals that `x_user_id`
3. Query `cv_analyses` for that `user_id`, ordered by `overall_score DESC`, limit 1
4. Attach `overall_score`, `bluechip_details.significantActivities` (top 3), and `feedback` text

This means your whitelist entry will get your 79.52 score, your WETH/Solana devnet/Base activities, and an AI-generated job title from your CV feedback.

**Data flow after changes (3 sources + cross-reference):**

```text
Source               | Entry Gate       | Image                  | Score/Activities
---------------------|------------------|------------------------|------------------
Whitelist (approved) | On whitelist     | submissions table      | Cross-ref from CV
CV 80+               | Score >= 80      | Auth user metadata     | Direct from CV
NS Passers           | Quiz passed      | ns_quiz_attempts (new) | Cross-ref from CV
```

#### Files changed:
1. Database migration (add `profile_image_url` to `ns_quiz_attempts`)
2. `src/pages/NetworkSchool.tsx` (save avatar)
3. `supabase/functions/sync-club-members/index.ts` (remove `rei_registry`, add cross-reference step)

