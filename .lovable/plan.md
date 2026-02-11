

# Add "Find Meaningful Work" Parallax Section to Home Page

## What will be added
A new full-screen snap-scroll section on the right column of the home page, positioned between the "3 Ways to Join The Club" section and the "Arubaito Apps" section. It will feature the uploaded image centered, with a CTA button below linking to `/meaning`.

## Layout (matching the reference screenshot)
- Full-height snap section with dark background (#181818)
- The uploaded "find meaningful work" image centered, sized to match the iframe/ASCII block dimensions used in the section above (same `max-w-md aspect-square` pattern)
- A "Discover Ikigai" button below the image, styled with the coral border (#ed565a), linking to `/meaning`

## Technical Details

### File: Copy uploaded image to project
- Copy `user-uploads://meaningful-bg-final.png` to `src/assets/meaningful-bg-final.png`

### File: `src/pages/Index.tsx`
1. Import the new image asset
2. Insert a new snap section (Section 1.5) between the current "3 Ways to Join The Club" (Section 1) and "Arubaito Apps" (Section 2)
3. The section structure:
   - `h-screen snap-start` container, centered flex layout
   - Image rendered at the same dimensions as the ASCII iframe above (`max-w-md aspect-square`)
   - Button below styled consistently with the "Join Waitlist" button (outline, coral border, links to `/meaning`)
