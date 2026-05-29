## Problem

When opening any CV profile from the list, `CVProfileDisplay` auto-redirects to `/club`. The effect at `src/components/cv-profile/CVProfileDisplay.tsx:116-166` runs every time the component mounts: if the profile qualifies (score ≥ 80 or bluechip) and a `club_verifications` row already exists as verified, it shows a "Welcome back" toast and navigates to `/club` after 2s. If not yet verified, it upserts a verification row and redirects after 3s.

This made sense as a one-time post-analysis verification step, but it now fires on every revisit — so viewing a profile = bounce to /club.

## Fix

Decouple the club-verification side effect from the profile view:

1. **Remove the auto-redirect** from `CVProfileDisplay`. Viewing a profile should just render the profile.
2. **Preserve the verification upsert** (so qualifying users still get recorded in `club_verifications`) but:
   - Run it silently (no toast, no `navigate('/club')`).
   - Only run when the current viewer is the owner (`isOwner`) — verification is about the logged-in member, not about anyone viewing someone else's CV.
   - Skip if a verified row already exists (no-op).
3. Keep the explicit "Enter Club" / navigation paths that already exist elsewhere (nav menu, completion flow) as the way users reach `/club`.

## Files

- `src/components/cv-profile/CVProfileDisplay.tsx` — rewrite the `checkAndVerify` effect: drop both `setTimeout(... navigate('/club') ...)` calls and both toasts; keep only the idempotent `club_verifications` upsert gated on `isOwner`.

No other components, routes, or backend changes needed.