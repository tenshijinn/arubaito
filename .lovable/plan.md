

## Member Showcase Slider - Using Correct Club Member Data

### The Problem You Identified
The previous plan incorrectly used `rei_registry` as the data source. Club members come from three distinct pathways:
1. **Twitter Bluechip Whitelist** -- `twitter_whitelist` + `twitter_whitelist_submissions` tables
2. **NFT Membership Holders** -- `rei_registry` where `nft_minted = true`
3. **CV Score 80+** -- `cv_analyses` where `overall_score >= 80`

### Data Challenge
- Twitter whitelist has handles but profile images are only in `twitter_whitelist_submissions`
- CV analyses has scores/on-chain data but Twitter info lives in `auth.users` metadata (not queryable from client)
- No single table represents "club members"

### Solution: Edge Function + Public Cache Table

#### 1. New database table: `club_member_showcase`
A public-readable cache table that stores only the minimal, privacy-safe data needed for the slider:
- `id`, `twitter_handle`, `profile_image_url`, `membership_type` (whitelist/nft/cv_score), `cv_score` (nullable), `top_activities` (jsonb, top 3 on-chain activities), `created_at`

RLS: public SELECT, service_role-only INSERT/UPDATE/DELETE.

#### 2. New edge function: `sync-club-members`
Server-side function that can access all data sources including `auth.users` metadata. It:
- Queries `twitter_whitelist` joined with `twitter_whitelist_submissions` for handle + avatar
- Queries `cv_analyses` with score >= 80, joins auth.users for Twitter metadata
- Queries `rei_registry` for NFT holders
- Deduplicates by handle
- Upserts into `club_member_showcase`
- Can be called manually by admin or on a schedule

#### 3. New component: `src/components/MemberSlider.tsx`
- Fetches from `club_member_showcase` (public read, no auth needed)
- Uses `embla-carousel-react` with 5s auto-scroll
- Each card shows:
  - "CLUB MEMBER" heading
  - "CV Profile Score: XX/100" (if available, in red)
  - Twitter avatar (grayscale CSS filter, coral/red border ring)
  - @handle
  - "Proof of Talent" pills showing top 3 on-chain activities (if available)
  - Left/right chevron navigation
- If 0 members, section is hidden entirely

#### 4. Update: `src/pages/Index.tsx`
- Import and insert `MemberSlider` as a new `snap-start` section between Video Hero (Section 0) and "3 Ways to Join The Club" (Section 1)
- Full-height section with dark `#181818` background

### Technical Details

**Database migration:**
```sql
CREATE TABLE public.club_member_showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle text NOT NULL UNIQUE,
  profile_image_url text,
  membership_type text NOT NULL DEFAULT 'whitelist',
  cv_score numeric,
  top_activities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.club_member_showcase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view showcase" ON public.club_member_showcase FOR SELECT USING (true);
CREATE POLICY "Service role manages showcase" ON public.club_member_showcase FOR ALL USING (auth.role() = 'service_role');
```

**Edge function** (`sync-club-members`): Uses service role key to query all three sources, merge, and upsert. Will be called once initially and can be re-triggered by admins.

**Privacy:** Only publicly available Twitter handle + avatar shown. On-chain activity is opt-in (only if wallet was connected). No real names, emails, or wallet addresses exposed in the showcase.
