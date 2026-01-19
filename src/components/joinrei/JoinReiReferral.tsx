import { ScrollFadeIn } from './ScrollFadeIn';
import solanaIcon from '@/assets/solana-icon.png';

export const JoinReiReferral = () => {
  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#1a1a1a]">
      {/* Left Content Panel */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
        {/* Top: Title */}
        <div className="pt-8 lg:pt-16">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl lg:text-[3rem] xl:text-[3.5rem] font-bold leading-[1.2] font-mono">
              <span className="text-cream">Users Earn </span>
              <span className="text-primary">Solana</span>
              <span className="text-cream"> for Referring </span>
              <span className="text-primary">Your Tasks</span>
            </h2>
          </ScrollFadeIn>
        </div>

        {/* Bottom: Share graphic - matching reference exactly */}
        <ScrollFadeIn delay={200}>
          <div className="pb-16 lg:pb-24">
            <div className="flex items-end">
              {/* Custom share graphic matching reference */}
              <svg width="200" height="140" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background person (left) */}
                <circle cx="45" cy="25" r="18" fill="hsl(var(--primary))" />
                <path d="M25 75 Q25 50 45 50 Q65 50 65 75 L65 90 L25 90 Z" fill="hsl(var(--primary))" />
                
                {/* Foreground person (center) with share arrow */}
                <circle cx="85" cy="35" r="22" fill="hsl(var(--primary))" />
                <path d="M55 95 Q55 65 85 65 Q115 65 115 95 L115 115 L55 115 Z" fill="hsl(var(--primary))" />
                
                {/* Share arrow */}
                <path d="M45 85 L30 70 M30 70 L30 85 M30 70 L45 70" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Right person */}
                <circle cx="130" cy="45" r="16" fill="hsl(var(--primary))" />
                <path d="M110 95 Q110 70 130 70 Q150 70 150 95 L150 110 L110 110 Z" fill="hsl(var(--primary))" />
                
                {/* Solana icon circle (top right) */}
                <circle cx="155" cy="25" r="22" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                {/* Solana logo placeholder - 3 lines */}
                <line x1="145" y1="20" x2="165" y2="20" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                <line x1="145" y1="25" x2="165" y2="25" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                <line x1="145" y1="30" x2="165" y2="30" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
              </svg>
              
              {/* Share text */}
              <span className="text-primary font-mono text-2xl font-bold -ml-2 mb-8">Share</span>
            </div>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Right Video Panel */}
      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full p-8">
        {/* Terminal markers */}
        <div className="absolute left-0 top-1/4 space-y-2 font-mono text-sm z-10">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-primary">&gt;</span>
              <span className="text-primary">x</span>
            </div>
          ))}
        </div>

        {/* Video container with blue glow and rounded corners */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          {/* Blue gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-blue-500/30 to-blue-800/40" />
          
          {/* Video */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover mix-blend-screen"
          >
            <source src="/joinrei/terminal-video.mp4" type="video/mp4" />
          </video>
          
          {/* Red/orange glow at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-orange-500/30 via-primary/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="lg:hidden absolute inset-0 -z-10 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-primary/20" />
      </div>
    </section>
  );
};
