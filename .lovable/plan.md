
## Tighter Ikigai Statement + ICP & Arena Suggestions

### 1. Shorten the Ikigai Statement (Edge Function)

**File: `supabase/functions/generate-ikigai/index.ts`**

Update the system prompt to enforce brevity. The current prompt allows long, verbose output. New rules:
- Hard cap: 1 sentence, max 20 words after "I'm {Name}!"
- Structure: "I am a {role} that helps {ICP} {outcome}."
- No filler words, no compound clauses
- Increase `max_tokens` slightly to accommodate the new ICP/arena output

### 2. Add ICP + Arena Generation (Edge Function)

Expand the edge function to also return `icps` (3 items) and `arenas` (3 items) alongside the statement, using tool calling for structured output.

**Updated response shape:**
```json
{
  "statement": "I'm Name! I am a ... that helps ...",
  "icps": [
    "Burned-out protocol founders seeking clarity",
    "First-time DAO contributors finding direction",
    "Solo builders scaling beyond themselves"
  ],
  "arenas": [
    "Early-stage protocol growth teams",
    "DAO ecosystem coordination pods",
    "Network-state education collectives"
  ]
}
```

The AI prompt will instruct the model to derive these from the user's inputs (not the statement), focusing on:
- Psychographic archetypes (not demographics) for ICPs
- Web3-native environments (not job titles) for arenas
- Max 12 words per line

### 3. ICP/Arena Carousel Component

**New file: `src/components/ikigai/IkigaiSuggestions.tsx`**

A simple carousel widget that sits in the left column (replacing the Download/Create Another buttons area when submitted). Features:
- Two sections with headers: "Your aligned ICPs" and "Where this comes alive in Web3"
- Arrow navigation (left/right) to cycle through items one at a time
- Each "slide" shows one ICP or one arena inside a bordered card (matching the screenshot mockup)
- Section header ("ICP" label) styled in primary/accent color
- Respects dark/light mode (border color, text color)
- Consolas monospace font throughout

**Layout per the screenshot reference:**
- Card with border (primary color in dark mode, dark in light mode)
- "ICP" or "ARENA" label top-left in accent
- Centered text for the suggestion
- Left/right chevron arrows on card sides

### 4. Wire Into IkigaiCard.tsx

**File: `src/pages/IkigaiCard.tsx`**

- Store `icps` and `arenas` in state (from edge function response)
- In the left column post-submission area, render: IkigaiSuggestions carousel, then Download Card button, then Create Another link
- Pass `isDarkMode` to the suggestions component
- Reset `icps`/`arenas` on "Create Another"

### 5. Update IkigaiOutput.tsx

No structural changes needed -- the shorter statement will naturally fit better in the right column. The existing dynamic font sizing and parsing logic handles varying lengths.

### Technical Details

**Edge function prompt changes (`generate-ikigai/index.ts`):**
- Use tool calling to extract structured output (statement + icps + arenas) in a single API call
- Tool schema enforces: statement (string), icps (array of 3 strings), arenas (array of 3 strings)
- System prompt updated with strict brevity rules and ICP/arena generation instructions
- Fallback: if tool call fails, use the statement-only path with template fallback

**Carousel state:**
- `currentIcpIndex` and `currentArenaIndex` as local state in the component
- Arrows wrap around (index modulo 3)
- Smooth fade or no transition (keep it snappy)

**Color handling:**
- Dark mode: primary (#ed565a) borders and labels, white text
- Light mode: #181818 borders and labels, #181818 text
