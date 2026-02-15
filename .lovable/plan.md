

## Fix Sign Out Wallet Trigger + Restructure Login for Returning Users

### Issue 1: Sign Out Triggers Solana Wallet

**Root Cause:** `Auth.tsx` still imports `useWallet()` and has a `useEffect` (lines 237-349) that auto-authenticates whenever a Solana wallet is detected as connected. When the user signs out, `Auth.tsx` re-renders, and if Phantom's adapter still reports `connected=true` from a prior session, the effect fires and opens the wallet popup.

**Fix:** Remove all wallet authentication logic from `Auth.tsx` since wallet connection is no longer part of the initial auth flow (it moved to the post-qualification step in `WalletConnectStep`). Specifically:
- Remove `useWallet` import and hook usage (lines 7, 32-39)
- Remove `bs58` import (line 10)
- Remove the entire `authenticateWallet` useEffect (lines 237-349)
- Remove `WalletMultiButton` import (line 8)

### Issue 2: Returning User Login

Currently the auth page has:
- "Blue Chip Twitter" (top, sign-in)
- "Member NFT" (disabled, coming soon)
- "Apply for Membership" label
- "Continue with CV Profile" (register flow)

**Proposed restructure:**

```text
Sign in with
  [X / Twitter]           <-- universal login for ALL returning users
  [Member NFT]            <-- disabled, "Free Mint Soon"

Apply for Membership
  [Blue Chip Twitter]     <-- moved here, initiates bluechip whitelist check
  [Continue with CV Profile]  <-- existing register flow
```

**How it works:**
- **"X / Twitter" button (top):** A general sign-in that uses Twitter OAuth. For returning users, it simply signs them in (no whitelist check, no cv_profile intent). It tries `signInWithPassword` first; if the user exists, they're logged in and routed based on their history (check if they have cv_analyses -> `/arubaito`, otherwise `/club`).
- **"Blue Chip Twitter" (under Apply):** Keeps the existing bluechip whitelist flow -- sets no `auth_intent` (or `"bluechip"`), so the callback checks the whitelist and routes to `/club`.
- **"Continue with CV Profile":** Keeps the existing register flow -- sets `auth_intent = "cv_profile"`, skips whitelist, routes to `/arubaito`.

### Technical Details

**Auth.tsx changes:**

1. Remove wallet-related imports and hooks (`useWallet`, `bs58`, `WalletMultiButton`, wallet useEffect)

2. Restructure the `mode === "main"` UI:
   - Top section "Sign in with":
     - "X / Twitter" button -- calls `handleTwitterAuth()` with `sessionStorage.setItem("auth_intent", "returning_user")`
     - "Member NFT" button (disabled, unchanged)
   - "Apply for Membership" section:
     - "Blue Chip Twitter" button -- calls `handleTwitterAuth()` with no auth_intent (or `"bluechip"`)
     - "Continue with CV Profile" button -- unchanged (sets mode to `"register"`)

3. Update Twitter OAuth callback to handle the new `"returning_user"` intent:
   - If `auth_intent === "returning_user"`: skip bluechip check, try sign-in only (no signup). If user doesn't exist, show error "No account found. Please apply for membership first." Route to `/arubaito` if they have cv_analyses, otherwise `/club`.
   - If `auth_intent === "cv_profile"`: existing behavior (skip whitelist, allow signup, route to `/arubaito`)
   - If no intent (bluechip path): existing behavior (check whitelist, route to `/club`)

