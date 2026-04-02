import { useState } from 'react';
import { TypewriterText } from './TypewriterText';
import { ChevronDown } from 'lucide-react';
import reiHero from '@/assets/joinrei/rei-hero.png';
import ignyteAward from '@/assets/joinrei/awards2.png';
import reiSpeechBubble from '@/assets/joinrei/rei-speech-bubble.gif';

export const JoinReiHero = () => {
  const [headlineComplete, setHeadlineComplete] = useState(false);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#0a0a0a]">
      {/* Left Content Panel */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="pt-2">
          <h1 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-light text-primary leading-[1.15] tracking-tight whitespace-pre-line">
            <TypewriterText 
              text={`Many TaskOn Users, Just Farm and Leave.\nWe're Fixing That.\n`}
              speed={35}
              onComplete={() => setHeadlineComplete(true)}
            />
          </h1>

          <p className={`mt-6 text-base md:text-lg lg:text-xl text-primary/90 font-mono leading-relaxed transition-opacity duration-500 max-w-lg ${headlineComplete ? 'opacity-100' : 'opacity-0'}`}>
            Rei Matches your tasks only to Twitter Verified Users who have declared their Skills
          </p>
        </div>

        <div className={`space-y-6 transition-all duration-500 delay-300 ${headlineComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button 
            onClick={scrollToNext}
            className="flex items-center gap-2 text-primary/70 hover:text-primary font-mono text-sm underline underline-offset-4 transition-colors cursor-pointer"
          >
            <ChevronDown className="h-4 w-4" />
            <span>Learn More</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-6 flex-wrap">
            <button 
              className="btn-manga btn-manga-outline"
              onClick={() => window.location.href = '/rei'}
            >
              Post Now
            </button>
          </div>
        </div>
      </div>

      {/* Right Image Panel */}
      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full">
        <img src={reiHero} alt="Rei AI Agent" className="w-full h-full object-cover object-center" />
        <div className="absolute top-[28%] left-[35%]">
          <img src={reiSpeechBubble} alt="Rei typing" className="h-20 xl:h-24 w-auto" />
        </div>
        <div className="absolute bottom-8 right-8">
          <img src={ignyteAward} alt="IGNYTE Finalist - Build on Solana" className="h-10 xl:h-12 w-auto object-contain" />
        </div>
      </div>

      {/* Mobile background */}
      <div className="lg:hidden absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10" />
        <img src={reiHero} alt="Rei AI Agent" className="w-full h-full object-cover object-right-center opacity-50" />
      </div>

      <div className="lg:hidden absolute bottom-6 right-6 z-20">
        <img src={ignyteAward} alt="IGNYTE Finalist - Build on Solana" className="h-8 w-auto object-contain" />
      </div>
    </section>
  );
};
