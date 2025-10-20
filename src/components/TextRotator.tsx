import { useEffect, useState, useRef } from "react";

interface TextRotatorProps {
  words: string[];
  isActive: boolean;
  className?: string;
}

export const TextRotator = ({ words, isActive, className = "" }: TextRotatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      const baseDelay = 1500;
      const randomOffset = Math.random() * 1000;
      const delay = baseDelay + randomOffset;

      intervalRef.current = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % words.length);
          setIsAnimating(false);
        }, 400);
      }, delay);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, words.length]);

  return (
    <span
      className={`inline transition-all duration-400 ${
        isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      } ${className}`}
      style={{
        color: '#f0e3c3',
        textShadow: isAnimating ? '0 0 8px rgba(240, 227, 195, 0.5)' : 'none'
      }}
    >
      {words[currentIndex]}
    </span>
  );
};
