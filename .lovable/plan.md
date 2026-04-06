

## Periodic Block Clock Reset

Confirmed: after the signup window closes, the system will snapshot the **current Solana slot** at that moment and count 1,000,000 blocks forward from there. Each cycle is fresh — no relation to the old start block.

### Flow

```text
[Countdown from current block] → +1M blocks → [Open 1hr] → window expires →
  reset start_block = current Solana slot → [Countdown +1M blocks] → ...
```

### Changes

**1. Edge function `supabase/functions/check-block-clock/index.ts`**

After the existing block that checks `isOpen`, add auto-reset logic:

- If `config.is_unlocked === true` AND `isOpen === false` (window expired):
  - Update `block_clock_config` row:
    - `start_block = currentBlock` (live Solana slot)
    - `start_timestamp = now()`
    - `is_unlocked = false`
    - `unlocked_at = NULL`
  - Recalculate `targetBlock = currentBlock + target_blocks`
  - Return countdown state with fresh values

**2. One-time data fix via insert tool**

Reset the currently stuck config row so it immediately enters a new countdown cycle:

```sql
UPDATE block_clock_config
SET is_unlocked = false,
    unlocked_at = NULL,
    start_block = 411442269,
    start_timestamp = now(),
    updated_at = now()
WHERE id = 1;
```

(Uses approximate current Solana slot; the edge function will correct it on next call.)

**3. No frontend changes needed**

The `useBlockClock` hook already handles the countdown state correctly when the edge function returns `isUnlocked = false` with blocks remaining.

