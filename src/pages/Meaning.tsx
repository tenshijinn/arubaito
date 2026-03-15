import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Meaning: React.FC = () => {
  const painPoints = [
    "No clear direction",
    "Uninspiring work",
    "Untapped potential",
  ];

  const usps = [
    "Find purpose in 3 mins",
    "Get your Ikigai Card",
    "Know your ideal arena",
    "Shareable proof of you",
  ];

  return (
    <div className="min-h-screen bg-[#181818] flex flex-col lg:flex-row">
      {/* Left side — Text content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 lg:py-0">
        <p
          className="text-xs tracking-[0.3em] uppercase text-primary mb-6"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          by Arubaito
        </p>

        <h1
          className="text-3xl md:text-4xl lg:text-5xl leading-tight mb-6"
          style={{ fontFamily: 'Styrene A Trial, sans-serif', color: '#ebe9e6' }}
        >
          Find work that<br />
          <span className="text-primary">actually matters</span><br />
          to you
        </h1>

        <p
          className="text-sm md:text-base text-muted-foreground mb-6 max-w-md leading-relaxed"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          Ikigai is the intersection of what you love, what you're great at,
          what the world needs, and what pays. Find yours.
        </p>

        <p
          className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          Sound familiar?
        </p>
        <p
          className="text-sm text-muted-foreground mb-8 max-w-md"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          No clear direction. Uninspiring work. Untapped potential.
        </p>

        <p
          className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          What you'll get
        </p>
        <p
          className="text-sm mb-10 max-w-md"
          style={{ fontFamily: 'Consolas, monospace', color: '#ebe9e6' }}
        >
          Your purpose in 3 mins. A shareable Ikigai Card. Clarity on where you belong.
        </p>

        {/* CTA */}
        <Link to="/ikigai">
          <Button
            className="bg-primary hover:bg-primary/90 text-white px-10 py-3 text-base w-fit"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            Start Ikigai Test
          </Button>
        </Link>
      </div>

      {/* Right side — Video */}
      <div className="w-full lg:w-1/2 relative min-h-[50vh] lg:min-h-screen">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/ikigai-bg.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default Meaning;
