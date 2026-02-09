
# Fix: Ikigai Card Export - Prevent Footer Cutoff on Long Statements

## Problem
The export card has a fixed height (932px) but the statement text font size is fixed at 22px. When the AI generates a longer statement, the text takes up too much vertical space, pushing the diagram and footer (QR code + logo) off the bottom edge.

## Solution
Make the statement font size dynamically scale down based on text length, and ensure the footer always has guaranteed space at the bottom.

### Changes to `src/components/ikigai/IkigaiCardExport.tsx`:

1. **Dynamic font sizing for the statement** -- Calculate font size based on character count:
   - Under 80 chars: 22px (current)
   - 80-120 chars: 19px
   - 120-160 chars: 17px  
   - Over 160 chars: 15px

2. **Shrink diagram slightly** -- Reduce from 370x370 to 340x340 to give more breathing room.

3. **Guarantee footer space** -- Change the footer from `marginTop: '20px'` to `flexShrink: 0` with a fixed minimum height, ensuring QR and logo are never clipped.

4. **Reduce statement bottom margin** -- From 30px to 16px to reclaim vertical space.

These changes ensure the card content always fits within the 932px height regardless of statement length, without distortion or overlap.
