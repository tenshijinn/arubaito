import { ScrollFadeIn } from './ScrollFadeIn';
import shareGraphic from '@/assets/joinrei/share-graphic.png';

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
            <img 
              src={shareGraphic} 
              alt="Share and earn Solana" 
              className="h-40 w-auto object-contain"
            />
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
