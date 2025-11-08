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
        
        {/* Text rotators - positioned absolutely */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-8 max-w-4xl w-full z-10">
          {hoveredButton === 'rei' ? (
            <>
              <h1 
                className="text-base md:text-xl font-semibold leading-relaxed"
                style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}
              >
                Aggregating Web3 <TextRotator key="rei-tasks" words={tasksWords} isActive={true} /> for <TextRotator key="rei-humans-1" words={humansWords} isActive={true} delay={0} />{' '}
                <span style={{ color: '#ed565a' }}>hiring</span>{' '}
                <TextRotator key="rei-humans-2" words={humansWords} isActive={true} delay={1300} />
              </h1>
              <div className="mt-4 font-mono text-sm md:text-base" style={{ fontFamily: 'Consolas, monospace', color: '#faf6f4' }}>
                <p>Rei will find you anything from Zealy Tasks to C-Level Roles. [ALaaAA]</p>
              </div>
            </>
          ) : hoveredButton === null && (
            <>
              <h1 
                className="text-base md:text-xl font-semibold leading-relaxed"
                style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}
              >
                <span style={{ color: '#ed565a' }}>Connecting</span> <TextRotator key="default-companies-1" words={companies} isActive={true} delay={0} color="#faf6f4" startIndex={0} /> <span style={{ color: '#ed565a' }}>to</span>
                <br />
                <span style={{ color: '#ed565a' }}>Ex-</span><TextRotator key="default-companies-2" words={companies} isActive={true} delay={800} color="#faf6f4" startIndex={10} />{' '}
                <TextRotator key="default-jobs" words={jobTitles} isActive={true} delay={1600} color="#ed565a" />
              </h1>
              <div className="mt-4 font-mono text-sm md:text-base" style={{ fontFamily: 'Consolas, monospace', color: '#faf6f4' }}>
                <p>Private Member Club for Buildrs in Web3</p>
              </div>
            </>
          )}
        </div>

        {/* Buttons - fixed in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-6 mt-8 z-10">
          <Button
            onClick={() => navigate('/arubaito')}
            variant="outline"
            size="default"
            className="text-base px-8 py-4 bg-transparent border-2 font-mono"
            style={{ 
              borderColor: 'hsl(var(--landing-border))',
              color: 'hsl(var(--landing-border))',
              fontFamily: 'Consolas, monospace'
            }}
          >
            Enter Club
          </Button>
          <Button
            onClick={() => navigate('/rei')}
            variant="outline"
            size="default"
            className="text-base px-8 py-4 bg-transparent border-2 transition-shadow duration-300 hover:bg-transparent font-mono"
            style={{ 
              borderColor: 'hsl(var(--landing-border))',
              color: 'hsl(var(--landing-border))',
              fontFamily: 'Consolas, monospace'
            }}
            onMouseEnter={(e) => {
              setHoveredButton('rei');
              e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--landing-border) / 0.6), inset 0 0 15px hsl(var(--landing-border) / 0.3)';
            }}
            onMouseLeave={(e) => {
              setHoveredButton(null);
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            @AskRei
          </Button>
        </div>

        {/* Treasury and Waitlist - repositioned for left column */}
        <div className="absolute bottom-6 left-4 md:left-6 z-40 hidden lg:block">
          <TreasuryDisplay />
        </div>
        <div className="absolute bottom-6 right-4 md:right-6 z-50 hidden lg:block">
          <WaitlistCountdown />
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
            
            {/* Arubaito ASCII Art Block */}
            <iframe 
              src="/ascii/arubaito.html"
              className="w-full max-w-md aspect-square mx-auto mt-8 border-0"
              style={{ backgroundColor: 'transparent' }}
              title="Arubaito ASCII Art"
            />
          </div>
        </div>

        {/* Section 3 - How Rei Works */}
        <div className="min-h-screen flex items-center justify-center px-8 md:px-12 lg:px-16 py-16 snap-start">
          <div className="max-w-xl text-center">
            <h2 className="text-3xl font-bold mb-6 font-mono" style={{ color: '#ed565a' }}>
              How Rei Works
            </h2>
            
            <div className="space-y-6 font-mono leading-relaxed" style={{ color: '#faf6f4' }}>
              <p className="text-sm" style={{ color: '#d0d0d0' }}>
                Rei is your open AI Agent that's open to anyone. Instead of browsing for crypto tasks, bounties and tasks, you just ask her tasks are suitable for you.
              </p>
              
              <p className="text-sm" style={{ color: '#d0d0d0' }}>
                Rei searches across major Web3 job and task platforms — Layer3, Galxe, 
                TaskOn, Zealy — and filters verified, paying opportunities that fit your skills.
              </p>
              
              <div className="space-y-3">
                <p className="text-sm font-semibold" style={{ color: '#faf6f4' }}>
                  Examples:
                </p>
                <ul className="space-y-2 text-sm" style={{ color: '#a0a0a0' }}>
                  <li>"Marketing tasks paying in SOL"</li>
                  <li>"DAO ops roles this week"</li>
                  <li>"Rust bounties under Galxe"</li>
                </ul>
              </div>
              
              <p className="text-sm" style={{ color: '#d0d0d0' }}>
                Rei learns from your work, tracks your on-chain reputation, and curates 
                better matches over time.
              </p>
            </div>
            
            {/* Rei ASCII Art Block */}
            <iframe 
              src="/ascii/rei.html"
              className="w-full max-w-md aspect-square mx-auto mt-8 border-0"
              style={{ backgroundColor: 'transparent' }}
              title="Rei ASCII Art"
            />
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
