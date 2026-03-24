

## Add Email Field to Guest List Submission + Notify Admin

### Problem
The `twitter_whitelist_submissions` table has no `contact_email` column. When a user isn't on the guest list and submits their handle for vetting, there's no way to contact them with the result. Also, no email notification is sent to rei@arubaito.app from this flow.

### Changes

#### 1. Database Migration
Add `contact_email` column to `twitter_whitelist_submissions`:
```sql
ALTER TABLE public.twitter_whitelist_submissions ADD COLUMN contact_email text;
```

#### 2. Update Edge Function: `submit-whitelist-request/index.ts`
- Add `contact_email` to the Zod schema (optional email string)
- Include `contact_email` in the database insert
- After successful insert, invoke `send-club-notification` with a new type `whitelist_request` (already exists) but also include the contact email in the notification HTML

#### 3. Update Edge Function: `send-club-notification/index.ts`
- Add `contact_email` to the `NotificationRequest` interface
- Include the contact email in the whitelist request notification HTML sent to rei@arubaito.app

#### 4. Update UI: `src/pages/GuestList.tsx`
In the "not_found" state, below the existing "not on the guest list" message and above the "Alternative Member Application Method" section:

- Add a horizontal separator
- Add text: "Think your Twitter should've been on the Guest List? Thought Leaders, OGs, KOLs — submit your account and we'll vet your profile and contact you if approved."
- Add an email input field (required)
- Add a "Submit for Review" button
- The handle is grabbed from the search field the user already typed into — no need to re-enter
- On submit: call `submit-whitelist-request` with `{ twitter_handle, contact_email }`, then call `send-club-notification` with type `whitelist_request`
- Show success/error feedback via toast

**Files changed:**
1. Database migration (add `contact_email`)
2. `supabase/functions/submit-whitelist-request/index.ts`
3. `supabase/functions/send-club-notification/index.ts`
4. `src/pages/GuestList.tsx`

