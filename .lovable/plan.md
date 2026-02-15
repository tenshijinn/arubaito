

## Reorder CV Profile Onboarding: X First, Wallet After Qualification

### Current Problem
When a user clicks "Continue with CV Profile", they're immediately asked to connect a Solana wallet. The wallet should not be a bottleneck for onboarding. Instead, users should authenticate with X (Twitter) first, then upload their CV, and only see the wallet connection step after they qualify (score 80+ or bluechip verified) -- because the wallet is where their free member NFT will be minted.

### New Flow

```text
[Auth Page]
  "Continue with CV Profile"
        |
        v
  Sign up with X (Twitter)
  (no bluechip whitelist check)
        |
        v
  [/arubaito - CV Profile Manager]
  Upload / Manual / LinkedIn
        |
        v
  CV Analysis Complete
        |
        v
  Score >= 80 or Bluechip Verified?
     YES --> Wallet Connect Step
             (Solana + EVM for on-chain
              verification + future NFT mint)
     NO  --> Show profile directly
             (can still improve and retry)
```

### Changes

**1. Auth.tsx -- "register" mode uses Twitter/X instead of wallet**

- Replace the wallet connect UI in `mode === "register"` with a Twitter OAuth button (reuse `handleTwitterAuth`)
- Before initiating Twitter OAuth, store `sessionStorage.setItem("auth_intent", "cv_profile")` so the callback knows to skip the bluechip whitelist check
- Update heading from "Connect Wallet to Continue" to "Sign up with X to Continue"
- Remove the wallet-specific messaging (OG status, on-chain verification copy)

**2. Auth.tsx -- Twitter OAuth callback handles CV profile path**

- In the callback handler, read `sessionStorage.getItem("auth_intent")`
- If `"cv_profile"`: skip the `data.bluechip_verified` check, create/sign-in user normally, navigate to `/arubaito` instead of `/club`
- If absent (default bluechip path): keep existing behavior (check whitelist, navigate to `/club`)
- Clean up `auth_intent` from sessionStorage after use

**3. Arubaito.tsx -- Wallet step moves to post-analysis, gated by qualification**

- Flow changes from `wallet -> selecting -> form/upload` to `selecting -> form/upload -> wallet (conditional)`
- `handleStartNewCV`: go directly to `"selecting"` (method selector)
- `handleAnalysisComplete`: check if the new analysis has score >= 80 or bluechip_verified; if yes, transition to `"wallet"` step; if no, show the profile directly
- Add state to hold the pending analysis ID during the wallet step
- "Back to Wallet" button on method selector becomes "Back to Profiles"
- Wallet addresses are still passed through to the CV analysis forms (Solana + EVM) when connected at the post-analysis wallet step

**4. WalletConnectStep.tsx -- Reframe as NFT mint + verification step**

- Update hero messaging: "Connect Your Wallet" becomes "Claim Your Membership"
- New description: "You've qualified for Arubaito Club! Connect your wallet to verify on-chain credentials and receive your free Member NFT (coming soon)."
- Update benefits grid to emphasize:
  - Free Member NFT mint (coming soon)
  - On-chain verification boosts CV score further
  - Wallet becomes your membership identity
  - Cross-chain support (Solana + 14 EVM chains)
- Add visual element/badge indicating NFT benefit (e.g., sparkle icon with "Free NFT Mint Coming Soon" badge)
- Keep the skip option but reword: "Skip for now -- you can connect your wallet later from your profile"
- Keep both Solana and EVM wallet connection cards fully functional

**5. Re-analysis with wallet data**

- After wallet connection post-qualification, trigger a re-analysis of the CV with the wallet addresses attached so on-chain data enriches the score
- This preserves the existing feature where wallet connection improves CV score via the `analyze-cv` edge function

### Technical Details

**Flow state update in Arubaito.tsx:**
```text
// Old: null -> 'wallet' -> 'selecting' -> 'form'|'upload'|'linkedin'
// New: null -> 'selecting' -> 'form'|'upload'|'linkedin' -> 'wallet' (if qualified)
```

**Auth intent in sessionStorage:**
- Set before Twitter OAuth: `sessionStorage.setItem("auth_intent", "cv_profile")`
- Read in callback: determines navigation target and whether to check whitelist
- Cleaned up after use to prevent stale state

**Qualification check in handleAnalysisComplete:**
- Fetch the completed analysis record
- If `overall_score >= 80` or `bluechip_verified === true`: show wallet step
- Otherwise: show profile directly (user can still view their score and improve)

