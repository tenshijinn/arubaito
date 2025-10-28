import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextRotator } from "@/components/TextRotator";

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
    <div className="min-h-screen relative font-mono" style={getBackgroundStyle()}>
      {/* Text rotators - positioned absolutely */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-8 max-w-4xl w-full">
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-6 mt-8">
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
          Ask Rei
        </Button>
      </div>
    </div>
  );
};

export default Index;
