

## Prevent Registration Paths from Acting as Sign-In

### Problem
The "Blue Chip Twitter" and "Continue with CV Profile" buttons under "Apply for Membership" can also sign in existing users. This is because the OAuth callback tries `signInWithPassword` first (line 130), and if it succeeds, the user is silently logged in -- effectively turning registration paths into login paths.

### Fix

In `src/components/Auth.tsx`, update the OAuth callback logic for the **bluechip** and **cv_profile** paths (lines 126-165):

- After `signInWithPassword` succeeds (meaning the account already exists), do NOT proceed with login
- Instead, sign the user back out and show a toast: "You already have an account. Please use 'Sign in with X / Twitter' to log in."
- Only proceed with `signUp` for genuinely new users
- The bluechip whitelist check still runs before signup to gate new registrations

### Updated callback flow (pseudocode)

```text
if authIntent === "returning_user":
  signIn only, no signup (existing logic, unchanged)

else (bluechip or cv_profile):
  if authIntent !== "cv_profile" AND !bluechip_verified:
    block with "Access Denied" (existing logic, unchanged)

  try signInWithPassword:
    if SUCCESS (user exists):
      sign out immediately
      show toast "Account already exists. Use 'Sign in with X / Twitter' to log in."
      return (do NOT navigate)
    if FAILS (user does not exist):
      proceed with signUp (existing logic)
      navigate to /arubaito or /club as before
```

### Separate loading states (from prior plan)

Replace the single `twitterLoading` with `returningUserLoading` and `bluechipLoading` so only the clicked button shows "Authenticating...". Both buttons remain disabled when either is loading.

### Technical Details

**File: `src/components/Auth.tsx`**

1. Replace `useState` for `twitterLoading` with two states: `returningUserLoading` and `bluechipLoading`
2. "X / Twitter" button sets `returningUserLoading`; "Blue Chip Twitter" and "Continue with X" set `bluechipLoading`
3. In the callback (lines 128-158), when `signInWithPassword` succeeds for bluechip/cv_profile paths:
   - Call `supabase.auth.signOut()`
   - Show toast directing user to sign in via the top button
   - Clear loading states and return early
4. When `signInWithPassword` fails (new user), proceed with `signUp` as before
5. `finally` block clears both loading states

