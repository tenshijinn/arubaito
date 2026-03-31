

## Plan: Block Clock UI Improvements + Reminder Email System

### Summary

Three changes: (1) move the progress percentage to the right of the bar chart, (2) reclaim vertical space by tightening layout, (3) add a "Send Reminder" button with inline email form that also triggers automatic reminder emails when the signup window opens.

---

### 1. Move % to the right of the progress bar

**BlockClockDisplay.tsx** — Replace the separate percentage section and bar section with a single flex row:
- Left: the 36 progress bars (flex: 1)
- Right: the `{progress}%` number, fixed width (~60px to fit "100%"), vertically centered

Remove the standalone percentage `<div>` that currently sits above the bars. Move the combined pill (blocks remaining | time) up into the space freed.

### 2. Tighten vertical spacing

With the percentage no longer above the bars, shift the pill and other elements upward so spacing is even between: header → divider → pill → bar+% → reminder button.

### 3. "Send Reminder" button + dropdown

**BlockClockDisplay.tsx**:
- Add a new prop `onReminderSubmit?: (email: string) => Promise<void>` and `reminderSubmitted?: boolean`
- Below the bar chart, render a "Send Reminder" button styled in the coral theme
- On click, toggle an inline dropdown (within the card) showing an email input + "Send" button
- On submit, call `onReminderSubmit`

**Auth.tsx**:
- Pass `onReminderSubmit={handleReminderSubmit}` and `reminderSubmitted` to `BlockClockDisplay`
- The existing `handleReminderSubmit` already inserts into `block_clock_reminders`

### 4. Automatic reminder emails when signup opens

**Database**: The `block_clock_reminders` table already has email + notified columns — no schema changes needed.

**Edge function** `send-block-clock-reminders/index.ts`:
- Query `block_clock_reminders` where `notified = false`
- Cross-reference against `twitter_whitelist` (existing members) — skip any email that belongs to a member
- For each non-member reminder, send an email via Resend (already configured) notifying them the signup window is open
- Mark `notified = true` after sending
- Called by the `check-block-clock` edge function when state transitions to "open"

**Modify `check-block-clock/index.ts`**:
- When the block clock state transitions to "open", invoke `send-block-clock-reminders` to trigger the batch notification

---

### Technical Details

**Files to create:**
- `supabase/functions/send-block-clock-reminders/index.ts`

**Files to modify:**
- `src/components/BlockClockDisplay.tsx` — layout restructure + reminder UI
- `src/components/Auth.tsx` — pass reminder props
- `supabase/functions/check-block-clock/index.ts` — trigger reminders on state change

**No database migrations needed** — `block_clock_reminders` table with `notified` column already exists.

