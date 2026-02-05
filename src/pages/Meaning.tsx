import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TextRotator } from '@/components/TextRotator';

const Meaning: React.FC = () => {
  const rotatingTexts = [
    "1. Ikigai clarifies your purpose",
    "2. Your purpose clarifies your offering",
    "3. Your offering finds you meaningful work"
  ];

  return (
    <div className="h-screen bg-[#181818] flex flex-col items-center justify-center px-6 py-12">
      {/* Headline - centered above video */}
      <h1 
        className="text-2xl md:text-3xl text-primary text-center mb-4"
        style={{ fontFamily: 'Consolas, monospace' }}
      >
        You're productive, but it feels hollow
      </h1>
      
      {/* Video Box with overlaid CTA */}
      <div className="relative w-full max-w-[500px] aspect-square">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/ikigai-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Centered CTA Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Link to="/ikigai">
            <Button 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-base"
              style={{ fontFamily: 'Consolas, monospace' }}
            >
              Start Ikigai Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Rotating Text - centered below video */}
      <div 
        className="mt-4 text-lg md:text-xl text-primary text-center h-[1.5em]"
        style={{ fontFamily: 'Consolas, monospace' }}
      >
        <TextRotator 
          words={rotatingTexts}
          isActive={true}
          color="#ed565a"
          startIndex={0}
        />
      </div>
    </div>
  );
};

export default Meaning;
