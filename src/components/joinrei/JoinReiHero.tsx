import { useState } from 'react';
import { TypewriterText } from './TypewriterText';
import { ScrollFadeIn } from './ScrollFadeIn';
import { Button } from '@/components/ui/button';
import { ChevronDown, Eye } from 'lucide-react';
import reiLogo from '@/assets/rei-logo.png';
import solanaIcon from '@/assets/solana-icon.png';

export const JoinReiHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="h-screen snap-start relative flex items-center justify-center overflow-hidden bg-background">
      {/* Terminal scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(250,241,225,0.03) 2px, rgba(250,241,225,0.03) 4px)'
        }} />
      </div>

      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: Content */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <img src={reiLogo} alt="Rei" className="h-10 w-auto" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-cream leading-tight font-mono">
            <TypewriterText 
              text="Find Skilled Task Workers Who Care."
              speed={40}
              onComplete={() => setHeadlineComplete(true)}
            />
          </h1>

          <p className={`text-lg md:text-xl text-cream/80 font-mono transition-opacity duration-500 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            Rei is an AI Agent who{' '}
            <span className="text-primary underline decoration-primary underline-offset-4">Promotes</span> and{' '}
            <span className="text-primary underline decoration-primary underline-offset-4">Matches</span> Your Tasks to Users with the Right Skills
          </p>

          <div className={`flex flex-wrap gap-4 transition-all duration-500 delay-200 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button 
              variant="outline" 
              size="lg"
              onClick={scrollToNext}
              className="border-primary text-primary hover:bg-primary hover:text-background font-mono"
            >
              Learn More
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg"
              className="bg-primary text-background hover:bg-primary/90 font-mono"
              onClick={() => window.location.href = '/rei'}
            >
              <Eye className="mr-2 h-4 w-4" />
              Post Now
            </Button>
          </div>

          {/* Badges */}
          <div className={`flex flex-wrap items-center gap-4 pt-4 transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-cream/20 rounded-full">
              <img src={solanaIcon} alt="Solana" className="h-4 w-4" />
              <span className="text-xs text-cream/70 font-mono">Build on Solana</span>
            </div>
            <div className="px-3 py-1.5 border border-primary/50 rounded-full">
              <span className="text-xs text-primary font-mono">1 of 15 Finalists • IGNYTE DIFC</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className={`flex items-center gap-6 transition-all duration-500 delay-400 ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-xs text-cream/50 font-mono uppercase tracking-wider">Payments:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={solanaIcon} alt="Solana Pay" className="h-5 w-5" />
                <span className="text-sm text-cream/70 font-mono">Solana Pay</span>
              </div>
              <div className="text-sm text-cream/70 font-mono">x402</div>
            </div>
          </div>
        </div>

        {/* Right: Visual placeholder (to be replaced with actual image) */}
        <ScrollFadeIn delay={500} className="hidden lg:block">
          <div className="relative">
            <div className="aspect-square rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Eye className="h-24 w-24 text-primary mx-auto animate-pulse" />
                <p className="text-cream/50 font-mono text-sm">[Hero image placeholder]</p>
                <p className="text-cream/30 font-mono text-xs">Telephone operator with Rei overlay</p>
              </div>
            </div>
            {/* Floating chat bubble */}
            <div className="absolute -bottom-4 -left-4 bg-background border border-primary rounded-lg px-4 py-2 shadow-lg shadow-primary/20">
              <p className="text-sm text-cream font-mono">"I found 12 matches for your task."</p>
            </div>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-8 w-8 text-primary/50" />
      </div>
    </section>
  );
};
