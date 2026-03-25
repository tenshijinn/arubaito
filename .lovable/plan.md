

## Plan: Twitter Verified Check + Fix Points Aggregation

### Problem 1: Allow only verified Twitter accounts to register
Currently any Twitter account can register with Rei. We need to block unverified accounts (no checkmark) during signup.

### Problem 2: Points showing 0
The `user_points` table has both `wallet_address` and `x_user_id` columns, but:
- The `increment_user_points` database function only inserts/updates by `wallet_address` — it never sets `x_user_id`
- The `ReiEarningsHub` fetches wallets from `rei_registry` by `x_user_id`, then queries `user_points` by those wallet addresses
- If the wallet used for points earning differs from the registration wallet, or `x_user_id` is never populated on `user_points`, the aggregation may miss records

### Changes

#### 1. Block unverified Twitter accounts (frontend)
**File: `src/pages/Rei.tsx`**
- After `handleTwitterCallback` receives the user data, check `data.user.verified`
- If `verified === false` and mode is `signup`, show an error toast ("Only verified X accounts can register") and clear the Twitter state
- Allow sign-in for existing accounts regardless of verification (they already registered)

#### 2. Block unverified accounts (edge function — server-side enforcement)
**File: `supabase/functions/submit-rei-registration/index.ts`**
- Add a check at the top: if `verified` is falsy, return a 403 error ("Only verified X (Twitter) accounts can register with Rei")
- This prevents bypassing the frontend check

#### 3. Request `verified` field from Twitter API properly
**File: `supabase/functions/twitter-oauth/index.ts`**
- The current API call already requests `user.fields=verified` — good
- Note: Twitter API v2 returns `verified` as the legacy blue checkmark. For the paid checkmark (Twitter Blue / X Premium), the field may be `verified_type` or part of `public_metrics`. We should also request the `verified_type` field to check for the blue subscription checkmark
- Update the user fields request to include `verified_type` if available

#### 4. Fix points aggregation — update `increment_user_points` to also set `x_user_id`
**Database migration:**
```sql
CREATE OR REPLACE FUNCTION public.increment_user_points(
  p_wallet_address text, 
  p_points integer, 
  p_x_user_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO user_points (wallet_address, total_points, x_user_id)
  VALUES (p_wallet_address, p_points, p_x_user_id)
  ON CONFLICT (wallet_address) DO UPDATE
  SET total_points = user_points.total_points + p_points,
      x_user_id = COALESCE(EXCLUDED.x_user_id, user_points.x_user_id),
      updated_at = now();
END;
$$;
```

#### 5. Update edge functions that call `increment_user_points` to pass `x_user_id`
- `award-payment-points/index.ts` — look up `x_user_id` from `rei_registry` by wallet and pass it
- `track-referral-click/index.ts` — pass `x_user_id` from referral code lookup
- `track-referral-conversion/index.ts` — pass `x_user_id` similarly

#### 6. Update `ReiEarningsHub` to also query `user_points` by `x_user_id` directly
**File: `src/components/ReiEarningsHub.tsx`**
- In addition to querying by wallet addresses, also query `user_points` where `x_user_id` matches
- This catches any points records that were created with `x_user_id` set but with wallets not in `rei_registry`
- Deduplicate by combining both result sets

### Summary
- Frontend + backend enforcement of Twitter verified-only registration
- Database function updated to track `x_user_id` on points records
- Points aggregation improved to query by both wallet addresses and `x_user_id`

