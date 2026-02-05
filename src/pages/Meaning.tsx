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
    <div className="min-h-screen bg-[#181818]">
      <main className="min-h-screen flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left Column - Ikigai Diagram SVG */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <svg 
                viewBox="0 0 400 400" 
                className="w-full max-w-[400px] h-auto"
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
            </div>

            {/* Right Column - Content with Video Background */}
            <div className="w-full lg:w-1/2 relative flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Video Background */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              >
                <source src="/ikigai-bg.mp4" type="video/mp4" />
              </video>

              {/* Content on top */}
              <div className="relative z-10 py-8 px-4">
                <h1 
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight mb-6"
                  style={{ fontFamily: 'Consolas, monospace' }}
                >
                  You're productive,<br />
                  but it feels hollow
                </h1>
                
                <div 
                  className="text-lg md:text-xl text-primary/80 mb-8 h-[2em]"
                  style={{ fontFamily: 'Consolas, monospace' }}
                >
                  <TextRotator 
                    words={rotatingTexts}
                    isActive={true}
                    color="#ed565a"
                    startIndex={0}
                  />
                </div>

                <Link to="/ikigai">
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm rounded-lg"
                    style={{ fontFamily: 'Consolas, monospace' }}
                  >
                    Take Ikigai Test
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Meaning;