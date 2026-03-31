

## Plan: Solana Block Clock Countdown & Gated Signup Window

### Overview
Replace the static "Club Member Waitlist" countdown with a Solana blockchain-based "Block Clock" system. The countdown tracks remaining blocks until a target block is reached, then opens a 1-hour signup window. This affects the global WaitlistCountdown widget (used on 6 pages) and the Auth component on /arubaito.

### Database Changes

**New table: `block_clock_config`** (single-row config)
- `id` (int, default 1, primary key)
- `start_block` (bigint) — the Solana block when counting started
- `target_blocks` (bigint, default 1000000) — number of blocks to count
- `start_timestamp` (timestamptz) — UTC time when start_block was observed
- `signup_window_minutes` (int, default 60)
- `is_unlocked` (boolean, default false) — set true when target reached
- `unlocked_at` (timestamptz, nullable) — when unlock was triggered
- `created_at`, `updated_at`

RLS: SELECT for anon/authenticated, UPDATE/INSERT for admin only.

**New table: `block_clock_reminders`**
- `id` (uuid, primary key)
- `email` (text, not null)
- `created_at` (timestamptz)
- `notified` (boolean, default false)

RLS: INSERT for anon/authenticated, SELECT/UPDATE for admin.

### Edge Function: `check-block-clock`
- Calls Solana RPC (`getSlot`) to get current block height
- Compares against `start_block + target_blocks` from config
- If target reached and not yet unlocked: sets `is_unlocked = true`, `unlocked_at = now()`
- Returns `{ currentBlock, targetBlock, isUnlocked, unlockedAt, startBlock, targetBlocks, startTimestamp }`
- Called sparingly from client (on page load, then every 60s)
- When unlock triggers, also sends reminder emails to `block_clock_reminders` entries

### Frontend Changes

**1. New hook: `src/hooks/useBlockClock.ts`**
- Fetches block clock state from `block_clock_config` table on mount
- Calls `check-block-clock` edge function every 60s to get fresh Solana block
- Calculates time remaining: `(targetBlock - currentBlock) * 0.4s`
- Determines state: `"countdown"` | `"open"` | `"closed"`
- During open window: tracks 1-hour countdown from `unlocked_at`
- Exports: `{ state, timeRemaining, blocksRemaining, currentBlock, targetBlock, progress }`

**2. `src/components/WaitlistCountdown.tsx` — Rewrite**
- Rename label from "Club Member Waitlist" to "Club Waitlist"
- Uses `useBlockClock` hook
- **Countdown state**: Shows terminal-style progress bar with block count, label "Next club signup opens in:", time remaining
- **Open state**: Shows terminal-style clock icon with "Club signup closes in:" and 1-hour countdown. For logged-out users: small "Signup" button linking to /arubaito
- **Closed state**: Shows "Signup closed" static text

**3. `src/components/Auth.tsx` — Block Clock Gate**
- Import `useBlockClock`
- When state is `"countdown"`: Replace signup form with Block Clock display showing blocks remaining, progress bar, and an email reminder input field ("Get notified when signup opens")
- When state is `"open"`: Show current signup UI with visible 1-hour countdown timer at top
- When state is `"closed"`: Show "Signup window closed" message

**4. `src/components/BlockClockDisplay.tsx` — New shared component**
- Terminal-style block progress bar (ASCII-inspired, monospace)
- Shows: current block / target block, estimated time, visual progress
- Reused in both WaitlistCountdown and Auth

**5. `src/components/BlockClockTimer.tsx` — New component**
- Terminal-style clock for the 1-hour open window
- Monospace digits, blinking colon separator

### Technical Details

- **Solana block time**: ~400ms per block. 1,000,000 blocks ≈ 4d 15h
- **Block calculation**: `remainingBlocks = (startBlock + targetBlocks) - currentBlock`. Time = `remainingBlocks * 0.4` seconds
- **Approximate mode**: If edge function fails, fall back to `startTimestamp + (targetBlocks * 0.4s)` as a UTC target date
- **Solana RPC**: Use public endpoint `https://api.mainnet-beta.solana.com` with `getSlot` method (free, no key needed)
- **Polling strategy**: Check every 60s on client, edge function caches result for 30s to reduce RPC calls

### Files to Create/Modify
| File | Action |
|------|--------|
| Migration SQL | Create `block_clock_config` and `block_clock_reminders` tables |
| `supabase/functions/check-block-clock/index.ts` | New edge function |
| `src/hooks/useBlockClock.ts` | New hook |
| `src/components/BlockClockDisplay.tsx` | New terminal-style progress component |
| `src/components/BlockClockTimer.tsx` | New terminal-style clock component |
| `src/components/WaitlistCountdown.tsx` | Rewrite with block clock |
| `src/components/Auth.tsx` | Add block clock gating + email reminder |
| `src/components/CountdownTimer.tsx` | Keep (used elsewhere), no changes |

