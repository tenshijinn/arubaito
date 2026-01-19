import { useState } from 'react';
import { TypewriterText } from './TypewriterText';
import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { ChevronDown, Eye } from 'lucide-react';
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
    <section className="min-h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250,241,225,0.1) 2px, rgba(250,241,225,0.1) 4px)'
        }} />
      </div>

      <div className="container mx-auto px-8 lg:px-16 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary leading-[1.1] font-mono tracking-tight">
            <TypewriterText 
              text="Find Skilled Task Workers Who Care."
              speed={35}
              onComplete={() => setHeadlineComplete(true)}
            />
          </h1>

          <p className={`text-lg md:text-xl text-cream/90 font-mono leading-relaxed transition-opacity duration-500 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            Rei is an AI Agent who{' '}
            <span className="text-primary underline decoration-primary decoration-2 underline-offset-4">Promotes</span> and{' '}
            <span className="text-primary underline decoration-primary decoration-2 underline-offset-4">Matches</span> Your Tasks to Users with the Right Skills
          </p>

          <div className={`flex flex-wrap gap-4 pt-4 transition-all duration-500 delay-200 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button 
              variant="outline" 
              size="lg"
              onClick={scrollToNext}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-background font-mono text-base px-6 h-12 rounded-full"
            >
              Learn More
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg"
              className="bg-primary text-background hover:bg-primary/90 font-mono text-base px-6 h-12 rounded-full"
              onClick={() => window.location.href = '/rei'}
            >
              <Eye className="mr-2 h-5 w-5" />
              Post Now
            </Button>
          </div>

          {/* IGNYTE Award Badge */}
          <div className={`pt-6 transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            <img 
              src={ignyteAward} 
              alt="IGNYTE Finalist - Build on Solana" 
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>

          {/* Payment methods */}
          <div className={`pt-2 transition-all duration-500 delay-400 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            <img 
              src={solanaBadges} 
              alt="Solana Pay & x402" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Right: Hero Image with speech bubble */}
        <ScrollFadeIn delay={300} className="hidden lg:block">
          <div className="relative">
            <img 
              src={reiHero} 
              alt="Rei AI Agent" 
              className="w-full max-w-xl mx-auto rounded-2xl"
            />
            {/* Animated speech bubble overlay */}
            <div className="absolute -bottom-8 -left-8">
              <img 
                src={reiSpeechBubble} 
                alt="Rei typing" 
                className="h-24 w-auto"
              />
            </div>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-primary/60" />
      </div>
    </section>
  );
};
