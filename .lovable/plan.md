

## Plan: Rebrand /joinrei to Match Rei's Manga Dark Theme

### What Changes
The /joinrei landing page currently uses the old Arubaito style (coral red #ed565a, bold fonts, thick borders). The /rei page uses the refined "Manga Dark" theme (AMOLED black #0a0a0a, warm peach #e8c4b8, thin 0.5px borders, light-weight SF Pro Display headings, pill buttons). This plan aligns /joinrei with that aesthetic.

### Changes by File

**1. `src/pages/JoinRei.tsx`**
- Wrap the entire page in `rei-theme` class so all CSS variables and overrides apply automatically
- Change background from `bg-background` to `bg-[#0a0a0a]`

**2. `src/components/joinrei/JoinReiHero.tsx`**
- Background: `#1a1a1a` → `#0a0a0a`
- Headline font: remove `font-bold`, use `font-light` + `font-display` replaced with SF Pro style (handled by .rei-theme h1 override)
- Accent color references: `text-primary` will now resolve to peach via rei-theme CSS vars
- Button: swap to `btn-manga btn-manga-outline` pill style
- Gradient overlay on mobile: update from `#1a1a1a` to `#0a0a0a`
- "Learn More" text: use peach accent instead of cream

**3. `src/components/joinrei/JoinReiValueProp.tsx`**
- Background: `#1a1a1a` → `#0a0a0a`
- Heading weight: `font-bold` → `font-light`
- Border/card styles: use `rei-surface` class or 0.5px borders
- Text colors: `text-cream` references stay (foreground maps correctly)

**4. `src/components/joinrei/JoinReiAggregation.tsx`**
- Background: `bg-background` (will inherit from rei-theme)
- Heading weight: `font-bold` → `font-light`

**5. `src/components/joinrei/JoinReiHowItWorks.tsx`**
- Cards: `border-2 border-primary/40 rounded-3xl` → `border-[0.5px] border-white/10 rounded-2xl` with `bg-[#141414]`
- Heading weight: `font-bold` → `font-light`

**6. `src/components/joinrei/JoinReiDemoSection.tsx`**
- Video borders: `border-primary/40` → `border-white/10 border-[0.5px]`
- Title color: inherits peach from rei-theme primary

**7. `src/components/joinrei/JoinReiChatDemo.tsx`**
- Replace the custom terminal markup with `rei-terminal` CSS classes for consistency
- Chat labels: use `btn-manga` pill styles
- CTA button: pill-shaped, peach accent

**8. `src/components/joinrei/JoinReiReferral.tsx`**
- Background: `#1a1a1a` → `#0a0a0a`
- Heading weight: light

**9. `src/components/joinrei/JoinReiPricing.tsx`**
- Card borders: 2px → 0.5px, use `rei-surface` styling
- Default tier accent: peach instead of coral red
- Buttons: pill-shaped (`rounded-full` stays, but use peach bg)
- Premium tier: amber stays as a differentiation
- Heading weight: light

### Visual Summary
```text
BEFORE (old style)              AFTER (Manga Dark)
─────────────────               ──────────────────
Background: #1a1a1a             Background: #0a0a0a
Accent: #ed565a (coral)         Accent: #e8c4b8 (peach)
Borders: 2px solid              Borders: 0.5px solid
Font weight: 700 (bold)         Font weight: 300 (light)
Font: Styrene A Trial           Font: SF Pro Display (headings)
Border radius: 24px             Border radius: 14-20px
```

### What Stays the Same
- Snap-scroll section structure
- All images and videos
- Content/copy
- ScrollFadeIn and ParallaxWrapper animations
- Overall layout (split panels, grids)

