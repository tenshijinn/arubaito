

## Reorder CV Flow: Wallet Scan Before CV Submission

### Problem

Currently the flow is: Select Method → Upload/Form CV → (conditionally) Wallet Connect. Per the user's diagram, the correct flow is:

1. **Select Wallet to Scan** (optional) — user connects wallet(s) before CV submission
2. **Select CV Method** (upload / form / LinkedIn)
3. **Submit** — CV + wallet data sent together to `analyze-cv`
4. **Combined Score** — CV-derived score + wallet-derived score = final CV Score

The wallet step should always appear first, not conditionally after analysis.

### Changes

**1. `src/pages/Arubaito.tsx` — Reorder flow states**

- Change `handleStartNewCV` to go to `"wallet"` instead of `"selecting"`
- `handleWalletContinue` saves wallets then moves to `"selecting"` (not `null`)
- `handleWalletSkip` moves to `"selecting"` (not `null`)
- Remove the conditional wallet redirect from `handleAnalysisComplete` — analysis complete goes straight to showing profile (`setFlowState(null)`)
- Remove the re-analysis logic from `handleWalletContinue` (wallet data is already sent with initial analysis)
- Update flow type comment to reflect new order: `null → wallet → selecting → form|upload|linkedin`

**2. `src/components/cv-profile/WalletConnectStep.tsx` — Rebrand as "Select Wallet to Scan"**

- Change heading from "Claim Your Membership" to "Select Wallet to Scan"
- Update description to explain: "Optionally connect your Solana or EVM wallet. Your on-chain transaction history will be scanned and combined with your CV to produce a comprehensive CV Score."
- Update benefits to focus on CV scoring (not NFT minting):
  - "On-Chain Activity Score" — Transaction history across 15+ chains contributes to your CV Score
  - "Cross-Chain Verification" — Solana + 14 EVM chains scanned for comprehensive credentials
  - "Developer Proof" — Testnet/devnet activity recognized as builder credentials
  - "Bluechip Detection" — Interactions with top protocols boost your score
- Change "Verify & Claim Membership" button to "Continue with Wallet"
- Change skip text to "Skip — continue without wallet scan"
- Remove NFT mint messaging and sparkles badge
- Remove membership-related copy entirely

**3. No backend changes**

The `analyze-cv` edge function already accepts `walletAddress` and `evmAddress` and performs on-chain analysis. The wallet data is already passed through from `CVUploader`, `ManualCVForm`, and `LinkedInImport`. We are only changing when the wallet gets connected in the UI flow.

### Resulting Flow

```text
User clicks "Upload New CV"
  → Step 1: "Select Wallet to Scan" (optional, skip available)
  → Step 2: Method selector (form / upload / LinkedIn)
  → Step 3: CV submission (wallet addresses sent along)
  → Result: Combined CV-derived + wallet-derived = CV Score
```

### Files Modified

- `src/pages/Arubaito.tsx` — flow reorder, simplify handlers
- `src/components/cv-profile/WalletConnectStep.tsx` — copy and UI updates

