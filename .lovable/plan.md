

## Plan: Add Manifesto Parallax Section

### What
Add a new full-screen snap-scroll section in the 2nd position of the right column (between Video Hero and Club Members Slider), with a black `#181818` background and the manifesto text centered, justified, with 'hope' and 'meaning' bolded, all text in `#ed565a`.

### Changes

**`src/pages/Index.tsx`** — Insert a new section between `VideoHeroSection` (line 299-301) and `MemberSlider` (line 304):

```tsx
{/* Section 0.25 - Manifesto */}
<div
  className="h-screen flex-shrink-0 flex items-center justify-center px-8 md:px-16 lg:px-20 snap-start"
  style={{ backgroundColor: '#181818' }}
>
  <div className="max-w-lg" style={{ color: '#ed565a', textAlign: 'justify' }}>
    <p className="font-mono text-xs md:text-sm leading-relaxed">
      Arubaito is a private members network club.
      <br /><br />
      We've built an environment for teams to do <strong>meaning</strong>ful work
      <br /><br />
      ...because crypto is <strong>hope</strong>.
      <br /><br />
      On the outside crypto looks like preposterous perps,
      <br /><br />
      memes with misdemeanours, prediction market moguls and
      <br /><br />
      rehypothicated token yield that makes 2008's MBS wrappers
      <br /><br />
      look like chewing gum wrappers..
      <br /><br />
      But the truth is, all the madness are merely expressions of freedom
      <br /><br />
      thanks to an economy born out of open blockchain finance.
      <br /><br />
      The <strong>hope</strong> for the daughter of a farmer in a remote Filipino village
      <br /><br />
      can access the same yield as a Quant in a NYC skyscraper.
      <br /><br />
      Crypto's immutable rules means we can finally build societies
      <br /><br />
      on unshifting standards immune from regime shifts, insiders or majority holders.
      <br /><br />
      Helping builders in the crypto industry is what gives us <strong>meaning</strong>.
      <br /><br />
      We built Arubaito to support teams who are doing <strong>meaning</strong>ful work.
    </p>
  </div>
</div>
```

Single file change, no new components needed.

