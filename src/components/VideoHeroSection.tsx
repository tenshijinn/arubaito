import { ChevronDown } from "lucide-react";

interface VideoHeroSectionProps {
  onScrollDown?: () => void;
}

export const VideoHeroSection = ({ onScrollDown }: VideoHeroSectionProps) => {
  return (
    <div className="h-screen w-full relative flex-shrink-0 snap-start overflow-hidden">
      {/* Video Background - 100% coverage */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ backgroundColor: "hsl(var(--landing-bg))" }}
      >
        <source src="/bg-arubaito-sact.webm" type="video/webm" />
      </video>
      
      {/* Down Arrow with text - bottom center */}
      <button
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 
                   text-white/70 hover:text-white transition-colors
                   animate-bounce flex flex-col items-center gap-1"
        aria-label="Scroll down"
      >
        <span className="text-sm md:text-base font-mono font-bold tracking-widest">What is Arubaito</span>
        <ChevronDown className="w-8 h-8" />
      </button>
    </div>
  );
};
