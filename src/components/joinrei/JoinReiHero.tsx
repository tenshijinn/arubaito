import { useState } from 'react';
import { TypewriterText } from './TypewriterText';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import reiHero from '@/assets/joinrei/rei-hero.png';
import solanaBadges from '@/assets/joinrei/solana-badges.png';
import ignyteAward from '@/assets/joinrei/ignyte-award.png';
import reiSpeechBubble from '@/assets/joinrei/rei-speech-bubble.gif';

export const JoinReiHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#1a1a1a]">
      {/* Left Content Panel - ~45% width */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        {/* Top: Headline & Subheadline - moved to very top */}
        <div className="pt-2">
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-bold text-primary leading-[1.15] font-display tracking-tight">
            <TypewriterText 
              text="Find Skilled Task Workers Who Care."
              speed={35}
              onComplete={() => setHeadlineComplete(true)}
            />
          </h1>

          <p className={`mt-6 text-base md:text-lg lg:text-xl text-primary/90 font-mono leading-relaxed transition-opacity duration-500 max-w-lg ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            Rei is an AI Agent who{' '}
            <span className="underline decoration-2 underline-offset-4">Promotes</span> and{' '}
            <span className="underline decoration-2 underline-offset-4">Matches</span>{' '}
            <span className="font-display font-bold">Your Tasks</span> to Users with the{' '}
            <span className="font-display font-bold">Right Skills</span>
          </p>
        </div>

        {/* Bottom: CTAs and Badges */}
        <div className={`space-y-6 transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Learn More link - clickable to scroll */}
          <button 
            onClick={scrollToNext}
            className="flex items-center gap-2 text-cream/80 hover:text-cream font-mono text-sm underline underline-offset-4 transition-colors cursor-pointer"
          >
            <ChevronDown className="h-4 w-4" />
            <span>Learn More</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Post Now button and payment badges row */}
          <div className="flex items-center gap-6 flex-wrap">
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-background font-mono text-base px-8 h-14 rounded-lg"
              onClick={() => window.location.href = '/rei'}
            >
              Post Now
            </Button>
            
            <img 
              src={solanaBadges} 
              alt="Solana Pay & x402" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Image Panel - ~55% width, full bleed */}
      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full">
        <img 
          src={reiHero} 
          alt="Rei AI Agent" 
          className="w-full h-full object-cover object-center"
        />
        
        {/* REI Speech Bubble - positioned to the right of her head */}
        <div className="absolute top-[28%] left-[42%]">
          <img 
            src={reiSpeechBubble} 
            alt="Rei typing" 
            className="h-20 xl:h-24 w-auto"
          />
        </div>

        {/* IGNYTE Award - bottom right corner */}
        <div className="absolute bottom-8 right-8">
          <img 
            src={ignyteAward} 
            alt="IGNYTE Finalist - Build on Solana" 
            className="h-14 xl:h-16 w-auto object-contain"
          />
        </div>
      </div>

      {/* Mobile: Show image below content */}
      <div className="lg:hidden absolute inset-0 -z-10">
        <img 
          src={reiHero} 
          alt="Rei AI Agent" 
          className="w-full h-full object-cover object-center opacity-30"
        />
      </div>
    </section>
  );
};
