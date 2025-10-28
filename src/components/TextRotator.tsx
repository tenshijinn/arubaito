import { useEffect, useState, useRef } from "react";

interface TextRotatorProps {
  words: string[];
  isActive: boolean;
  className?: string;
}

export const TextRotator = ({ words, isActive, className = "" }: TextRotatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      setDisplayText("");
      return;
    }

    const currentWord = words[currentIndex];
    let charIndex = 0;
    
    // Type out the current word
    typingIntervalRef.current = setInterval(() => {
      if (charIndex <= currentWord.length) {
        setDisplayText(currentWord.slice(0, charIndex));
        charIndex++;
      } else {
        // Done typing, clear interval and pause before next word
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        
        // Pause for 1.5 seconds, then move to next word
        pauseTimeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % words.length);
        }, 1500);
      }
    }, 80); // Typing speed

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [isActive, words, currentIndex]);

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
