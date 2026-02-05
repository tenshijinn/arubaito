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
    <div className="min-h-screen bg-[#181818] flex items-center justify-center">
      <main className="w-full max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column - Video with Copy */}
          <div className="flex-1 flex flex-col items-start">
            {/* Headline - aligned with video left edge */}
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary leading-tight mb-4"
              style={{ fontFamily: 'Consolas, monospace' }}
            >
              You're productive, but it feels hollow
            </h1>
            
            {/* Video Box */}
            <div className="w-full aspect-square max-w-[600px]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/ikigai-bg.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Rotating Text - aligned with video left edge */}
            <div 
              className="mt-4 text-lg md:text-xl text-primary/80 h-[1.5em]"
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

          {/* Right Column - Ikigai Diagram and Button */}
          <div className="flex flex-col items-center gap-6 lg:self-end lg:pb-8">
            {/* Ikigai Diagram SVG */}
            <svg 
              viewBox="0 0 400 400" 
              className="w-48 h-48 md:w-56 md:h-56"
            >
              {/* Outer circles - dotted */}
              <circle cx="200" cy="130" r="110" fill="none" stroke="#ed565a" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="270" cy="200" r="110" fill="none" stroke="#ed565a" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="200" cy="270" r="110" fill="none" stroke="#ed565a" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="130" cy="200" r="110" fill="none" stroke="#ed565a" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />

              {/* Labels */}
              <text x="155" y="105" fill="#ed565a" fontSize="12" fontFamily="Consolas, monospace" textAnchor="middle">PASSION</text>
              <text x="245" y="105" fill="#ed565a" fontSize="12" fontFamily="Consolas, monospace" textAnchor="middle">MISSION</text>
              <text x="145" y="310" fill="#ed565a" fontSize="12" fontFamily="Consolas, monospace" textAnchor="middle">PROFESSION</text>
              <text x="255" y="310" fill="#ed565a" fontSize="12" fontFamily="Consolas, monospace" textAnchor="middle">VOCATION</text>

              {/* Center star/diamond */}
              <g transform="translate(200, 200)">
                <path d="M0,-25 L5,-5 L25,0 L5,5 L0,25 L-5,5 L-25,0 L-5,-5 Z" fill="#ed565a" />
                <text y="45" fill="#ed565a" fontSize="11" fontFamily="Consolas, monospace" textAnchor="middle">ikigai</text>
              </g>

              {/* Connecting lines from star to edges */}
              <line x1="200" y1="175" x2="200" y2="130" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
              <line x1="225" y1="200" x2="270" y2="200" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
              <line x1="200" y1="225" x2="200" y2="270" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
              <line x1="175" y1="200" x2="130" y2="200" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
            </svg>

            {/* CTA Button */}
            <Link to="/ikigai">
              <Button 
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm rounded-lg"
                style={{ fontFamily: 'Consolas, monospace' }}
              >
                Start Ikigai Test
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Meaning;
