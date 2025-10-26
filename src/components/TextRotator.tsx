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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      const currentWord = words[currentIndex];
      
      if (isTyping) {
        // Typing effect
        let charIndex = 0;
        typingIntervalRef.current = setInterval(() => {
          if (charIndex <= currentWord.length) {
            setDisplayText(currentWord.slice(0, charIndex));
            charIndex++;
          } else {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
            }
            // Wait before starting to delete
            setTimeout(() => {
              setIsTyping(false);
            }, 2000);
          }
        }, 80); // Typing speed
      } else {
        // Deleting effect
        let charIndex = currentWord.length;
        typingIntervalRef.current = setInterval(() => {
          if (charIndex >= 0) {
            setDisplayText(currentWord.slice(0, charIndex));
            charIndex--;
          } else {
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
            }
            // Move to next word
            setCurrentIndex((prev) => (prev + 1) % words.length);
            setIsTyping(true);
          }
        }, 50); // Deleting speed (faster)
      }
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [isActive, currentIndex, isTyping, words]);

  return (
    <span
      className={`inline-block font-mono ${className}`}
      style={{
        color: '#ED565A',
        textShadow: '0 0 10px rgba(237, 86, 90, 0.5)',
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
