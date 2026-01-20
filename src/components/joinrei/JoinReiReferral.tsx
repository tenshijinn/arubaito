import { ScrollFadeIn } from './ScrollFadeIn';
import shareGraphic from '@/assets/joinrei/share-graphic.png';

export const JoinReiReferral = () => {
  return (
    <section className="h-screen snap-start relative flex overflow-hidden bg-[#1a1a1a]">
      {/* Left Content Panel - icon dead center */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-center items-center p-8 lg:p-12 xl:p-16 relative z-10">
        <ScrollFadeIn>
          <h2 className="text-[2rem] md:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem] font-bold leading-[1.2] font-display text-center mb-12">
            <span className="text-cream">Users Earn </span>
            <span className="text-primary">Solana</span>
            <span className="text-cream"> for Referring </span>
            <span className="text-primary">Your Tasks</span>
          </h2>
        </ScrollFadeIn>

        {/* Share graphic - centered */}
        <ScrollFadeIn delay={200}>
          <img 
            src={shareGraphic} 
            alt="Share and earn Solana" 
            className="h-40 w-auto object-contain"
          />
        </ScrollFadeIn>
      </div>

      {/* Right Video Panel - no markers, no color overlay */}
      <div className="hidden lg:block absolute right-0 top-0 w-[55%] h-full p-8">
        {/* Video container with rounded corners */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black">
          {/* Video - normal colors, no mix-blend */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/joinrei/terminal-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="lg:hidden absolute inset-0 -z-10 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-primary/20" />
      </div>
    </section>
  );
};
