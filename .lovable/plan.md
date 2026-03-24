## SocialData.tools Follow Verification with Rate Limiting — IMPLEMENTED

### What was built
Replaced the broken Twitter API follow-check with SocialData.tools' "Verify User Following" endpoint, with a 1-check-per-month rate limit per handle.

### Changes made
1. **Database**: Added `guest_list_checks` table + `twitter_user_id` column on `twitter_whitelist`
2. **Edge function**: `check-guest-list-follows` rewritten to use SocialData.tools API
3. **UI**: `GuestList.tsx` handles `rate_limited` responses
4. **Secret**: `SOCIALDATA_API_KEY` added
