

## Remove rei_registry Dependency & Fix NS Profile Images

Since Rei will move to a separate website, all `rei_registry` lookups in the sync function need to be removed. To solve the missing profile images for NS-only members, we'll add a `profile_image_url` column to `ns_quiz_attempts` and save the Twitter avatar during quiz submission.

---

### Changes

#### 1. Database Migration: Add `profile_image_url` to `ns_quiz_attempts`

```sql
ALTER TABLE public.ns_quiz_attempts ADD COLUMN profile_image_url text;
```

This lets us capture the Twitter avatar at quiz time, same as `twitter_whitelist_submissions` does.

#### 2. Update NS Quiz Page: `src/pages/NetworkSchool.tsx`

In the `finishQuiz` function, include `profile_image_url` in the insert:

```typescript
await supabase.from("ns_quiz_attempts").insert({
  device_fingerprint: fingerprint,
  score,
  answers: finalAnswers,
  passed: didPass,
  x_user_id: twitterUser?.x_user_id || null,
  twitter_handle: twitterUser?.handle || null,
  profile_image_url: twitterUser?.profile_image_url || null,  // NEW
});
```

#### 3. Update Edge Function: `supabase/functions/sync-club-members/index.ts`

**Remove all `rei_registry` queries:**
- Remove Step 2 (NFT holders from `rei_registry`) entirely
- Remove the `rei_registry` fallback in Step 4 (NS members image lookup)
- Remove Step 5 (final `rei_registry` fallback for missing images)

**Update NS passers section (Step 4):**
- Pull `profile_image_url` directly from `ns_quiz_attempts` (newly added column)
- Fall back to `twitter_whitelist_submissions` by `x_user_id` if not available (for members who took the quiz before the column was added)

**Resulting data sources (3 only):**
1. Approved Twitter whitelist submissions (with `profile_image_url` from submissions)
2. CV Score 80+ members (with avatar from auth user metadata)
3. NS Quiz passers (with `profile_image_url` from quiz attempts or whitelist submissions)

**Scores:** Only `cv_analyses.overall_score` will be used (no more `rei_registry.profile_score`).

**Activities/Proof of Talent:** Only `cv_analyses.bluechip_details.significantActivities` will be used (no more `rei_registry.profile_analysis`).

**AI job titles:** Still generated from `cv_analyses.feedback` text. NS-only and whitelist-only members without CV feedback will not get AI-generated titles (no data to summarize).

---

### Technical Summary

| Source | Image | Score | Activities | Job Title Input |
|--------|-------|-------|------------|-----------------|
| Whitelist (approved) | `twitter_whitelist_submissions.profile_image_url` | -- | -- | -- |
| CV 80+ | Auth `user_metadata.avatar_url` | `cv_analyses.overall_score` | `bluechip_details.significantActivities` | `cv_analyses.feedback` |
| NS Passers | `ns_quiz_attempts.profile_image_url` (new) | -- | -- | -- |

**Files changed:**
1. Database migration -- add `profile_image_url` to `ns_quiz_attempts`
2. `src/pages/NetworkSchool.tsx` -- save avatar on quiz submit
3. `supabase/functions/sync-club-members/index.ts` -- remove all `rei_registry` references

