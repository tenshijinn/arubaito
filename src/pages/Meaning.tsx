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
    <div className="h-screen bg-[#181818] flex items-center justify-center overflow-hidden">
      <main className="w-full max-w-5xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          {/* Left Column - Video with Copy */}
          <div className="flex-1 flex flex-col items-start">
            {/* Headline - aligned with video left edge */}
            <h1 
              className="text-xl md:text-2xl lg:text-3xl font-bold text-primary leading-tight mb-3"
              style={{ fontFamily: 'Consolas, monospace' }}
            >
              You're productive, but it feels hollow
            </h1>
            
            {/* Video Box - constrained height */}
            <div className="w-full max-w-[500px]" style={{ maxHeight: '50vh' }}>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover aspect-square"
                style={{ maxHeight: '50vh' }}
              >
                <source src="/ikigai-bg.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Rotating Text - aligned with video left edge */}
            <div 
              className="mt-3 text-base md:text-lg text-primary/80 h-[1.5em]"
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
          <div className="flex flex-col items-center gap-4 lg:self-end lg:pb-4">
            {/* Ikigai Diagram SVG */}
            <svg 
              viewBox="0 0 400 400" 
              className="w-40 h-40 md:w-48 md:h-48"
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
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 text-sm rounded-lg"
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
