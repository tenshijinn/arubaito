

## Implement SocialData.tools Follow Verification with Rate Limiting

### What we're building
Replace the broken Twitter API follow-check with SocialData.tools' "Verify User Following" endpoint, and add a 1-check-per-month rate limit per handle to control costs.

### Changes

#### 1. Database migration
Create a `guest_list_checks` table to track usage:
```sql
CREATE TABLE public.guest_list_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  result_found boolean NOT NULL DEFAULT false,
  followed_by text
);
ALTER TABLE public.guest_list_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage checks" ON public.guest_list_checks FOR ALL USING (auth.role() = 'service_role'::text);
```

Add `twitter_user_id` cache column to `twitter_whitelist`:
```sql
ALTER TABLE public.twitter_whitelist ADD COLUMN twitter_user_id text;
```

#### 2. Add `SOCIALDATA_API_KEY` secret
Request the API key from you before implementation proceeds.

#### 3. Rewrite `supabase/functions/check-guest-list-follows/index.ts`
- **Rate limit check**: Query `guest_list_checks` for the handle. If a check exists within the last 30 days, return the cached result immediately (zero API cost on repeat searches).
- **Resolve target user ID**: `GET https://api.socialdata.tools/twitter/user/{screen_name}` — get the searched user's numeric Twitter ID.
- **Fetch guest list with cached IDs**: Query `twitter_whitelist` for all handles + cached `twitter_user_id`. For any without a cached ID, resolve via SocialData and update the row.
- **Verify following**: Loop through guest-listed accounts calling `GET https://api.socialdata.tools/twitter/user/{guest_id}/following/{target_id}`. Stop at first match.
- **Log the check**: Insert result into `guest_list_checks`.
- **Auth**: `Authorization: Bearer {SOCIALDATA_API_KEY}` header on all SocialData calls.

#### 4. Update `src/pages/GuestList.tsx`
- Handle a new `rate_limited` response from the edge function — show a message like "You can only check once per month. Please try again after [date]."
- No other UI changes needed.

### Cost summary
| Scenario | API calls | Cost |
|----------|-----------|------|
| Repeat search (within 30 days) | 0 | $0 |
| Match on 1st guest account | 2 | ~$0.004 |
| Match on 20th guest account | 21 | ~$0.08 |
| No match (all ~100 checked) | 101 | ~$0.40 |

### Files changed
1. Database migration (new table + column)
2. `supabase/functions/check-guest-list-follows/index.ts` (full rewrite)
3. `src/pages/GuestList.tsx` (rate limit UI feedback)

