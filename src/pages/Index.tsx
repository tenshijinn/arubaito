import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TextRotator } from "@/components/TextRotator";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";

const Index = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const tasksWords = ["Jobs", "Tasks", "Gigs", "Bounties"];
  const humansWords = ["AI", "Humans"];
  const companies = [
    "Binance", "Coinbase", "ConsenSys", "Chainlink", "Uniswap", "Aave", "Jupiter", 
    "Magic Eden", "Phantom", "Marinade Finance", "Polygon", "Avalanche", "Near Protocol", 
    "Arbitrum", "Optimism", "StarkWare", "Circle", "Ledger", "OpenSea", "Animoca Brands", 
    "Messari", "The Graph", "dYdX", "Helium", "Drift Protocol", "Mad Lads", "Tensor", 
    "Saga Phone", "Bonk", "Myro", "Pudgy Penguins", "Azuki", "Book of Meme", "Pepe", "Doodles"
  ];
  const jobTitles = [
    "Smart Contract Developers", "Blockchain Engineers", "Frontend Developers", "Backend Developers", 
    "Full Stack Developers", "Solidity Developers", "Rust Developers", "Protocol Engineers", 
    "Security Auditors", "DevOps Engineers", "Product Managers", "Community Managers", 
    "Partnerships Managers", "Growth Leads", "Marketing Managers", "UI/UX Designers", 
    "Governance Leads", "DAO Coordinators", "Research Analysts", "Content Creators"
  ];

  const getBackgroundStyle = () => {
    if (hoveredButton === 'rei') {
      return {
        backgroundColor: 'hsl(var(--landing-bg))',
        backgroundImage: 'url(/rei-hover.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.3s ease'
      };
    }
    return { 
      backgroundColor: 'hsl(var(--landing-bg))',
      transition: 'background-image 0.3s ease'
    };
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-mono" style={{ backgroundColor: 'hsl(var(--landing-bg))' }}>
      {/* LEFT COLUMN - Static */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-screen lg:sticky lg:top-0 relative flex items-center justify-center overflow-hidden">
        {/* Background video for default state */}
        {hoveredButton === null && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          >
            <source src="/arubaito-home.webm" type="video/webm" />
          </video>
        )}

        {/* Background image for hover state */}
        {hoveredButton === 'rei' && (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: 'url(/rei-hover.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {/* Treasury - top left corner */}
        <div className="absolute top-3 left-3 z-50 hidden lg:block">
          <TreasuryDisplay />
        </div>

        {/* Waitlist - top right corner */}
        <div className="absolute top-3 right-3 z-50 hidden lg:block">
          <WaitlistCountdown />
        </div>

        {/* Logo, text, and buttons - bottom left corner */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-4 z-10 w-full max-w-md px-0">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}>
              ARUBAITO.
            </h1>
          </div>

          {/* Left aligned text with rotating words */}
          <div className="w-full text-left">
            {hoveredButton === 'rei' ? (
              <p 
                className="text-sm md:text-base font-mono leading-relaxed"
                style={{ fontFamily: 'Consolas, monospace', color: '#faf6f4' }}
              >
                Aggregating Web3 <span className="underline"><TextRotator key="rei-tasks" words={tasksWords} isActive={true} /></span> for <span className="underline"><TextRotator key="rei-humans-1" words={humansWords} isActive={true} delay={0} /></span>{' '}
                <span style={{ color: '#ed565a' }}>hiring</span>{' '}
                <span className="underline"><TextRotator key="rei-humans-2" words={humansWords} isActive={true} delay={1300} /></span>
                <br />
                <span className="text-xs mt-2 block">Rei will find you anything from Zealy Tasks to C-Level Roles. [ALaaAA]</span>
              </p>
            ) : hoveredButton === null && (
              <p 
                className="text-sm md:text-base font-mono leading-relaxed"
                style={{ fontFamily: 'Consolas, monospace', color: '#faf6f4' }}
              >
                <span style={{ color: '#ed565a' }}>Connecting</span> <span className="underline"><TextRotator key="default-companies-1" words={companies} isActive={true} delay={0} color="#faf6f4" startIndex={0} /></span> <span style={{ color: '#ed565a' }}>to</span>
                <br />
                <span style={{ color: '#ed565a' }}>Ex-</span><span className="underline"><TextRotator key="default-companies-2" words={companies} isActive={true} delay={800} color="#faf6f4" startIndex={10} /></span>{' '}
                <span className="underline"><TextRotator key="default-jobs" words={jobTitles} isActive={true} delay={1600} color="#ed565a" /></span>
                <br />
                <span className="text-xs mt-2 block">Private Member Club for Buildrs in Web3</span>
              </p>
            )}
          </div>

          {/* Buttons side by side */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              onClick={() => navigate('/arubaito')}
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-3 py-2 border font-mono transition-all duration-300"
              style={{ 
                backgroundColor: '#ed565a',
                borderColor: '#ed565a',
                color: '#181818',
                fontFamily: 'Consolas, monospace'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ed565a';
                e.currentTarget.style.borderColor = '#ed565a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ed565a';
                e.currentTarget.style.color = '#181818';
                e.currentTarget.style.borderColor = '#ed565a';
              }}
            >
              Enter Club
            </Button>
            <Button
              onClick={() => navigate('/rei')}
              variant="outline"
              size="sm"
              className="flex-1 text-xs px-3 py-2 bg-transparent border font-mono transition-all duration-300"
              style={{ 
                borderColor: 'hsl(var(--landing-border))',
                color: 'hsl(var(--landing-border))',
                fontFamily: 'Consolas, monospace'
              }}
              onMouseEnter={(e) => {
                setHoveredButton('rei');
                e.currentTarget.style.backgroundColor = '#ed565a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#ed565a';
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'hsl(var(--landing-border))';
                e.currentTarget.style.borderColor = 'hsl(var(--landing-border))';
              }}
            >
              @AskRei
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Scrollable */}
      <div className="w-full lg:w-1/2 min-h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory" style={{ backgroundColor: '#181818' }}>
        {/* Section 1 - Above the Fold */}
        <div className="min-h-screen flex flex-col items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start">
          {/* x402 ASCII Art Block */}
          <iframe 
            src="/ascii/x402.html"
            className="w-full max-w-md aspect-square mb-8 border-0"
            style={{ backgroundColor: 'transparent' }}
            title="x402 Payment ASCII Art"
          />
          
          {/* Payment Info */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
              <p className="font-mono text-sm" style={{ color: '#faf6f4' }}>
                Post & Pay with x402 or SolanaPay
              </p>
            </div>
            <button 
              className="mt-4 text-xs font-mono flex items-center gap-1 mx-auto hover:opacity-80 transition-opacity"
              style={{ color: '#ed565a' }}
              onClick={() => document.getElementById('how-club-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How Arubaito Works ↓
            </button>
          </div>
        </div>

        {/* Section 2 - How the Club Works */}
        <div id="how-club-works" className="min-h-screen flex items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start">
          <div className="max-w-xl text-center">
            {/* Arubaito ASCII Art Block - Moved above title */}
            <iframe 
              src="/ascii/arubaito.html"
              className="w-full max-w-md aspect-square mx-auto mb-8 border-0"
              style={{ backgroundColor: 'transparent' }}
              title="Arubaito ASCII Art"
            />
            
            <h2 className="text-3xl font-bold mb-6 font-mono" style={{ color: '#ed565a' }}>
              How the Club Works
            </h2>
            
            <div className="space-y-6 font-mono leading-relaxed" style={{ color: '#faf6f4' }}>
              <p className="text-lg font-semibold">
                Private. Verified. Token-gated.
              </p>
              
              <p className="text-sm" style={{ color: '#d0d0d0' }}>
                Arubaito is a members-only network for verified builders.
                Your access pass is a Member NFT — proof of entry to a curated space 
                where top talent meets trusted projects.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 - How Rei Works */}
        <div className="min-h-screen flex items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start">
          <div className="max-w-xl text-center">
            {/* Rei ASCII Art Block - Moved above title */}
            <iframe 
              src="/ascii/rei.html"
              className="w-full max-w-md aspect-square mx-auto mb-8 border-0"
              style={{ backgroundColor: 'transparent' }}
              title="Rei ASCII Art"
            />
            
            <h2 className="text-3xl font-bold mb-6 font-mono" style={{ color: '#ed565a' }}>
              How Rei Works
            </h2>
            
            <div className="space-y-6 font-mono leading-relaxed" style={{ color: '#faf6f4' }}>
              <p className="text-sm" style={{ color: '#d0d0d0' }}>
                Rei is your open AI Agent that's open to anyone. Instead of browsing for crypto tasks, bounties and tasks, you just ask her tasks are suitable for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Show Treasury and Waitlist at bottom on mobile */}
      <div className="lg:hidden">
        <div className="fixed bottom-6 left-4 md:left-6 z-40">
          <TreasuryDisplay />
        </div>
        <div className="fixed bottom-6 right-4 md:right-6 z-50">
          <WaitlistCountdown />
        </div>
      </div>
    </div>
  );
};

export default Index;
