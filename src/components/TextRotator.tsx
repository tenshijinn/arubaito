import { useEffect, useState, useRef } from "react";

interface TextRotatorProps {
  words: string[];
  isActive: boolean;
  className?: string;
}

export const TextRotator = ({ words, isActive, className = "" }: TextRotatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !hasPlayed) {
      const currentWord = words[currentIndex];
      
      // Typing effect - play once
      let charIndex = 0;
      typingIntervalRef.current = setInterval(() => {
        if (charIndex <= currentWord.length) {
          setDisplayText(currentWord.slice(0, charIndex));
          charIndex++;
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
          setHasPlayed(true);
        }
      }, 80); // Typing speed
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [isActive, hasPlayed, words, currentIndex]);

  return (
    <span
      className={`inline-block font-mono ${className}`}
      style={{
        color: '#ED565A',
        minHeight: '1.2em',
        position: 'relative'
      }}
    >
      {displayText}
      <span 
        className="inline-block ml-1"
        style={{
          animation: 'blink 1s step-end infinite',
          color: '#f0e3c3'
        }}
      >
        _
      </span>
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
};
