

## Plan: Integrate Block Clock into Sign-In Card

### What Changes

Currently the BlockClockDisplay and BlockClockTimer appear **above** the Members card as separate elements. This plan moves them **inside** the card, replacing the sign-in buttons during countdown, and integrating the 1-hour timer with the signup buttons when open.

### Countdown State (inside Members card)

The card replaces buttons with a redesigned BlockClockDisplay matching the screenshot reference:
- **Header row**: "Club Waitlist" title (left) + large percentage number (right), separated by a vertical divider
- **Subtitle**: "Signup Opens after 1 Million Solana Blocks"
- **Pill badge**: blocks remaining count
- **Time estimate**: "≈ Xd Xh Xm until unlock"
- **Visual**: Vertical bar chart (CSS divs with gradient opacity, terminal aesthetic)
- **Footer**: Two columns — "CURRENT BLOCKTIME" and "TARGET BLOCKTIME" with formatted numbers
- Email reminder field stays **below** the card (unchanged)
- "Not a member yet? Apply to Join" link remains at card bottom

### Open State (inside Members card)

The card shows:
- **Top section**: BlockClockTimer (1-hour countdown) integrated into the card header area, with label "Club signup closes in:"
- **Below timer**: The normal sign-in buttons (Guest Listed Twitter, Member NFT) appear
- "Not a member yet? Apply to Join" link remains

### Closed State (inside Members card)

Card shows "Signup window has closed" message where buttons normally are.

### Files to Modify

**1. `src/components/BlockClockDisplay.tsx`** — Redesign full mode
- Replace ASCII progress bar with the rich layout from the screenshot
- Header: title + percentage with vertical divider
- Vertical bar visualization (20-30 CSS bars)
- Footer with current/target block numbers
- Keep compact mode unchanged for WaitlistCountdown widget

**2. `src/components/Auth.tsx`** — Restructure
- Remove the BlockClockDisplay/Timer/closed sections that currently sit **above** the card (lines 257-319)
- Move block clock states **inside** the Members card (lines 332-370):
  - Countdown: replace buttons div with BlockClockDisplay
  - Open: add BlockClockTimer above buttons
  - Closed: replace buttons with closed message
- Same restructuring for the "apply" card

