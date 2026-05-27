import { ChevronDown } from "lucide-react";

const INK = "#181818";
const CREAM = "#faf1e1";
const SANS = "'Consolas', 'IBM Plex Mono', monospace";

interface Props {
  onScrollDown?: () => void;
}

export const VideoHeroAesthetic = ({ onScrollDown }: Props) => {
  return (
    <div className="h-screen w-full relative flex-shrink-0 snap-start overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bg-arubaito-sact.webm" type="video/webm" />
      </video>
      <button
        onClick={onScrollDown}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
        aria-label="Scroll down"
      >
        <span
          className="uppercase tracking-[0.18em] px-4 py-2 rounded-full"
          style={{ background: CREAM, color: INK, fontFamily: SANS, fontSize: 11 }}
        >
          What is Arubaito
        </span>
        <ChevronDown className="w-6 h-6 animate-bounce" style={{ color: CREAM }} />
      </button>
    </div>
  );
};
