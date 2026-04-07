

## Copy Rei Backend to Rei Project

### What needs to happen

The [Rei](/projects/8b5b53d8-b948-4884-8330-b2755ac1bf84) project has its frontend ready but its `supabase/` folder is empty — no edge functions, no database tables. We need to copy everything from this Arubaito project.

### Step 1: Create database tables via migration

A single migration in the Rei project to create all required tables:

| Table | Purpose |
|-------|---------|
| `rei_registry` | Core contributor profiles |
| `chat_conversations` | Rei chatbot conversations |
| `chat_messages` | Chat message history |
| `user_points` | Points/earnings tracking |
| `payment_references` | Solana Pay references |
| `jobs` | Job postings |
| `tasks` | Task postings |
| `rei_treasury_wallet` | Treasury config |
| `talent_views` | Employer talent views |

Plus the `contributor_role` enum, RLS policies, indexes, and the `increment_user_points` function. I'll consolidate the relevant parts from Arubaito's 19+ migrations into one clean migration.

### Step 2: Copy 12 edge functions

These are the functions Rei's frontend actually calls:

1. `rei-chat` — AI chatbot
2. `check-rei-registration` — Check if user is registered
3. `submit-rei-registration` — Submit/update registration
4. `analyze-rei-profile` — AI profile analysis
5. `twitter-oauth` — Twitter auth flow
6. `verify-solana-pay` — Verify Solana payments
7. `award-payment-points` — Award points after payment
8. `x402-create-payment` — Create x402 payment tx
9. `x402-verify-payment` — Verify x402 payment
10. `generate-referral-code` — Generate referral codes
11. `track-referral-click` — Track referral clicks
12. `transcribe-video` — Audio/video transcription

I'll also copy the `_shared/` email templates folder if any functions reference it.

### Step 3: Create storage bucket

Rei needs the `rei-contributor-files` storage bucket for audio uploads.

### Step 4: Configure secrets in Rei project

Rei needs the same API keys. Since you confirmed using the same keys, I'll add these secrets to the Rei project:

- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `HELIUS_API_KEY`
- `COVALENT_API_KEY`
- `MORALIS_API_KEY`
- `SOCIALDATA_API_KEY`

You'll be prompted to paste the same values.

### Step 5: Prompt you to delete Rei files from Arubaito

After confirming Rei's backend works, I'll list everything to remove from this project:
- Edge functions: all 12 listed above
- Tables: `rei_registry`, `chat_conversations`, `chat_messages`, etc.
- Components: `ReiChatbot`, `PostToRei`, `ReiEarningsHub`, `AudioRecorder`, etc.
- Pages: `Rei.tsx`, `ReferralRedirect.tsx`

### Execution order

**Message 1 (next):** Steps 1–4 in the Rei project — create migration, copy all edge functions, configure secrets.

**Message 2 (after confirmation):** Step 5 — clean Arubaito of all Rei files.

### Important note

This work needs to happen **in the Rei project**, not here. I can copy the edge function files using cross-project tools, but the database migration and secret configuration must be done in the Rei project's context. I'll switch context to work there.

