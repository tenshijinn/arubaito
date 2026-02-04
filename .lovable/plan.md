
# Ikigai Card Lead Magnet Implementation Plan

## Overview
Build an interactive identity articulation tool at `/meaning` that helps users discover their purpose and generates a shareable "Ikigai Card" with Telegram deep-linking and download capabilities.

---

## Architecture Summary

```text
+------------------+      +-------------------+      +------------------+
|   /meaning page  | ---> | generate-ikigai   | ---> | Lovable AI       |
|   (IkigaiCard)   |      | (Edge Function)   |      | (Gemini Flash)   |
+------------------+      +-------------------+      +------------------+
        |
        v
+------------------+
| QR Code + PNG    |
| Download         |
+------------------+
```

---

## Components to Create

### 1. Page: `src/pages/IkigaiCard.tsx`
Main page component with state management for:
- Form inputs (6 fields)
- Theme toggle (light/dark)
- Submission state
- AI-generated output
- Download/share state

### 2. Component: `src/components/ikigai/IkigaiDiagram.tsx`
SVG-based Ikigai Venn diagram with:
- 4 overlapping dotted circles (coral/red color)
- Central 4-pointed star
- Dynamic text binding for user inputs
- Static intersection labels (Passion, Mission, Vocation, Profession)
- Outer labels (Obsession, Problem, Offering, Skill)

### 3. Component: `src/components/ikigai/IkigaiForm.tsx`
Form with 6 input fields:
- Name (text, required)
- Telegram Handle (text, required, @username format)
- What you love (text, required)
- What the world needs (text, required)
- What you can be paid for (text, required)
- What you are good at (text, required)
- Submit button (disabled until all fields filled)

### 4. Component: `src/components/ikigai/IkigaiOutput.tsx`
AI-generated identity statement display with:
- Special styling: Name in white, key phrases in red
- Formatted per template: "I'm {Name}! I am a {role} that helps {mission}."

### 5. Component: `src/components/ikigai/IkigaiQRCode.tsx`
Telegram QR code with:
- Deep link to user's Telegram: `https://t.me/{handle}?text={encoded_statement}`
- "let's chat" label
- Coral/red QR color

### 6. Component: `src/components/ikigai/ThemeToggle.tsx`
Simple toggle switch for light/dark mode:
- Positioned top-right
- Label: "LIGHT/DARK MODE"
- Uses local state (not global theme)

### 7. Edge Function: `supabase/functions/generate-ikigai/index.ts`
AI processing using Lovable AI Gateway:
- Input: Form data (name, love, needs, paid for, good at)
- Output: Concise identity statement (1-2 sentences)
- Model: google/gemini-3-flash-preview
- Strict template adherence

### 8. Utility: `src/utils/ikigaiCardGenerator.ts`
PNG/PDF export using html2canvas:
- Captures the card layout (diagram + statement + QR)
- Includes Arubaito branding
- Respects current theme
- Excludes form fields

---

## Technical Details

### Ikigai Diagram Structure (SVG)
```text
                    OBSESSION
                        |
                   [what you love]
                        
            PASSION        MISSION
                 \        /
     SKILL --[good at]--★--[world needs]-- PROBLEM
                 /        \
          PROFESSION    VOCATION
                        
                   [paid for]
                        |
                    OFFERING
```

### Form Validation (using zod)
```typescript
const ikigaiSchema = z.object({
  name: z.string().trim().min(1).max(50),
  telegramHandle: z.string().trim().regex(/^@[a-zA-Z0-9_]{5,}$/),
  whatYouLove: z.string().trim().min(1).max(150),
  whatWorldNeeds: z.string().trim().min(1).max(150),
  whatPaidFor: z.string().trim().min(1).max(150),
  whatGoodAt: z.string().trim().min(1).max(150),
});
```

### AI Prompt Template
```text
Summarize this person's purpose into a single, confident identity statement.
Tone: calm, purposeful, human, non-corporate.

Template: I'm {Name}! I am a {what I can be paid for} that helps {what the world needs}.

Input:
- Name: {name}
- What they can be paid for: {paidFor}
- What the world needs: {worldNeeds}

Rules:
- Compress intelligently, not verbatim repetition
- Maximum 2 sentences
- Focus on value delivered
```

### Telegram Deep Link Format
```
https://t.me/{handle}?text={encodeURIComponent(statement)}
```

### Download Implementation
Uses html2canvas + jsPDF:
1. Hide form elements
2. Capture the card container
3. Generate PNG (primary) and optional PDF
4. Include branding footer

---

## State Flow

**State 1 (Initial):**
- Empty diagram with placeholder text
- Form visible and active
- No output statement
- No QR code
- Submit disabled

**State 2 (After Submit):**
- Diagram populated with user inputs
- AI statement displayed at bottom
- QR code appears with "let's chat"
- Download/Print buttons appear
- Arubaito branding visible on card

---

## File Structure
```
src/
├── pages/
│   └── IkigaiCard.tsx
├── components/
│   └── ikigai/
│       ├── IkigaiDiagram.tsx
│       ├── IkigaiForm.tsx
│       ├── IkigaiOutput.tsx
│       ├── IkigaiQRCode.tsx
│       ├── ThemeToggle.tsx
│       └── index.ts
├── utils/
│   └── ikigaiCardGenerator.ts
supabase/
├── functions/
│   └── generate-ikigai/
│       └── index.ts
└── config.toml (add new function)
```

---

## Route Addition
Add to `src/App.tsx`:
```typescript
import IkigaiCard from "./pages/IkigaiCard";
// ...
<Route path="/meaning" element={<IkigaiCard />} />
```

---

## Styling Guidelines

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | #ffffff | #181818 |
| Text (default) | #181818 | #ffffff |
| Accent (key phrases) | #ed565a | #ed565a |
| Diagram circles | #ed565a (dotted) | #ed565a (dotted) |
| Name in output | Text color | Text color (white) |
| Role/Mission | #ed565a | #ed565a |
| QR Code | #ed565a | #ed565a |

---

## Dependencies
All already installed:
- `qrcode` - QR code generation
- `html2canvas` - Screenshot for download
- `jspdf` - PDF generation
- `zod` - Form validation
- `react-hook-form` - Form handling

---

## Edge Cases to Handle

1. **Long text inputs**: Truncate in diagram, full text in card export
2. **Invalid Telegram handle**: Show validation error
3. **AI failure**: Show fallback template-based statement
4. **Mobile layout**: Stack form above diagram, responsive sizing
5. **Rate limiting**: Handle 429/402 errors from Lovable AI

---

## Analytics (Optional Enhancement)
Track via existing patterns:
- Page views
- Form submissions
- Downloads
- QR scans (if traceable via redirect)

---

## Implementation Order

1. Create edge function `generate-ikigai` with AI integration
2. Build IkigaiDiagram SVG component
3. Build IkigaiForm with validation
4. Create IkigaiOutput with styled statement
5. Add IkigaiQRCode component
6. Build ThemeToggle
7. Create main IkigaiCard page composing all components
8. Add download utility and functionality
9. Add route to App.tsx
10. Test end-to-end flow
