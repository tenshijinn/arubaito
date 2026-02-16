import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IkigaiSuggestionsProps {
  icps: string[];
  arenas: string[];
  isDarkMode: boolean;
}

const SuggestionCarousel: React.FC<{
  label: string;
  items: string[];
  isDarkMode: boolean;
}> = ({ label, items, isDarkMode }) => {
  const [index, setIndex] = useState(0);

  if (!items.length) return null;

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  const borderColor = isDarkMode ? 'border-primary' : 'border-[#181818]';
  const textColor = isDarkMode ? 'text-white' : 'text-[#181818]';
  const arrowColor = isDarkMode ? 'text-white/50 hover:text-white' : 'text-[#181818]/50 hover:text-[#181818]';

  return (
    <div className="space-y-1.5">
      <div className={`relative flex flex-col border ${borderColor} rounded-md aspect-square p-4`}>
        <span
          className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold mb-auto"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          {label}
        </span>
        <div className="flex items-center justify-center flex-1">
          <button
            onClick={prev}
            className={`absolute left-2 ${arrowColor} transition-colors`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p
            className={`text-center text-sm leading-relaxed ${textColor} px-5`}
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            {items[index]}
          </p>
          <button
            onClick={next}
            className={`absolute right-2 ${arrowColor} transition-colors`}
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        {items.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === index ? 'bg-primary' : isDarkMode ? 'bg-white/20' : 'bg-[#181818]/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const IkigaiSuggestions: React.FC<IkigaiSuggestionsProps> = ({ icps, arenas, isDarkMode }) => {
  if (!icps.length && !arenas.length) return null;

  return (
    <div className="space-y-5">
      <SuggestionCarousel label="Your aligned ICPs" items={icps} isDarkMode={isDarkMode} />
      <SuggestionCarousel label="Where this comes alive in Web3" items={arenas} isDarkMode={isDarkMode} />
    </div>
  );
};

export default IkigaiSuggestions;
