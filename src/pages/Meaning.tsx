import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Meaning: React.FC = () => {
  const painPoints = [
    "You're skilled, but unclear on your direction",
    "You apply to jobs that don't excite you",
    "You know you're capable of more — but more of what?",
  ];

  const usps = [
    "Discover your Ikigai in under 3 minutes",
    "Get a personalised purpose statement",
    "Find your ideal customer & work arena",
    "Download a shareable Ikigai Card",
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
          className="text-sm md:text-base text-muted-foreground mb-8 max-w-md leading-relaxed"
          style={{ fontFamily: 'Consolas, monospace' }}
        >
          Ikigai is a Japanese framework for finding your purpose — the
          intersection of what you love, what you're good at, what the
          world needs, and what you can be paid for. This tool helps you
          find yours.
        </p>

        {/* Pain points */}
        <div className="mb-8">
          <p
            className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            Sound familiar?
          </p>
          <ul className="space-y-2">
            {painPoints.map((point, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground flex items-start gap-2"
                style={{ fontFamily: 'Consolas, monospace' }}
              >
                <span className="text-primary mt-0.5">—</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* USPs */}
        <div className="mb-10">
          <p
            className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            What you'll get
          </p>
          <ul className="space-y-2">
            {usps.map((usp, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2"
                style={{ fontFamily: 'Consolas, monospace', color: '#ebe9e6' }}
              >
                <span className="text-primary mt-0.5">+</span>
                {usp}
              </li>
            ))}
          </ul>
        </div>

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
