

## Decouple Rei from Arubaito

### Problem
Arubaito code directly reads/writes to `rei_registry` in 4 places, creating tight coupling that must be broken before separation.

### Coupling Points Found

| File | What it does with `rei_registry` | Severity |
|------|--------------------------------|----------|
| `CVProfileDisplay.tsx` | Upserts into `rei_registry` when CV score ≥ 80 | **Critical** — Arubaito writing to Rei data |
| `CVAnalysis.tsx` | Same upsert logic (duplicate) | **Critical** |
| `Club.tsx` | Reads `rei_registry` for NFT holder check + profile data | **High** — Arubaito reading Rei data |
| `AdminReiRegistrySection.tsx` | Full CRUD on `rei_registry` | **Medium** — Admin panel, will move with Rei |

### Plan

**1. Remove `rei_registry` writes from CV flow**

In both `CVProfileDisplay.tsx` and `CVAnalysis.tsx`:
- Remove the entire `rei_registry` upsert block
- Keep the club qualification check but use a new Arubaito-owned table `club_verifications` instead
- Create `club_verifications` table: `id, wallet_address (unique), user_id, display_name, verified, cv_score, bluechip_verified, created_at, updated_at`
- Write to `club_verifications` instead of `rei_registry`

**2. Decouple Club.tsx from `rei_registry`**

- Replace the NFT holder check (which queries `rei_registry`) with a check against `club_verifications`
- For the twitter whitelist path, stop fetching supplementary data from `rei_registry` — use session metadata instead
- Club membership becomes: twitter_whitelist OR club_verifications entry

**3. Create `club_verifications` migration**

```sql
CREATE TABLE public.club_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  verified boolean DEFAULT true,
  cv_score numeric,
  bluechip_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.club_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification" ON club_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification" ON club_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON club_verifications
  FOR ALL USING (auth.role() = 'service_role');
```

**4. Identify Rei-only files** (no changes needed now, just catalogued for the physical move later)

- Pages: `Rei.tsx`, `JoinRei.tsx`
- Components: `ReiChatbot.tsx`, `PostToRei.tsx`, `ReiEarningsHub.tsx`, `ReiPointsCard.tsx`, `components/joinrei/*`
- Admin: `AdminReiRegistrySection.tsx` (moves with Rei)
- Edge functions: `rei-chat`, `submit-rei-registration`, `check-rei-registration`, `analyze-rei-profile`, `match-jobs-to-talent`, `match-talent-to-jobs`, `search-jobs`, `oracle-tweet-tracker`
- Tables: `rei_registry`, `rei_treasury_wallet`, `chat_conversations`, `chat_messages`, `jobs`, `job_drafts`, `job_sources`, `tasks`, `task_drafts`, `talent_views`, `skill_categories`, `community_submissions`

### Summary

3 files edited, 1 new table created, 0 Rei files touched. After this, Arubaito has zero references to `rei_registry` and the two apps are data-independent.

