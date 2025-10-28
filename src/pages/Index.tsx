import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextRotator } from "@/components/TextRotator";
import { AsciiBackground } from "@/components/AsciiBackground";

const Index = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const tasksWords = ["Jobs", "Tasks", "Gigs", "Bounties"];
  const humansWords = ["AI", "Humans"];
  const web3Companies = [
    "Arbitrum", "Ethereum", "Aave", "Solana", "Polygon", "Uniswap", "Cardano", 
    "Optimism", "Chainlink", "MakerDAO", "Starknet", "Cosmos", "Zora", 
    "Lens Protocol", "Avalanche", "Base", "DeGods", "Lido", "NEAR Protocol", 
    "The Graph", "Tezos", "SushiSwap", "Dogecoin", "VitaDAO", "Celestia", 
    "Filecoin", "Arweave", "GMX", "Azuki", "World of Women", "Balancer", 
    "Curve", "dYdX", "Synthetix", "ENS", "Hedera", "VeChain", "IOTA", 
    "Farcaster", "Zilliqa", "Shiba Inu", "DeSciWorld", "Floki", "Molecule", 
    "Yuga Labs", "Tron", "Algorand", "MultiversX", "Compound"
  ];

  const getBackgroundStyle = () => {
    if (hoveredButton === 'rei') {
      return {
        backgroundColor: '#181818',
        backgroundImage: 'url(/rei-hover.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.3s ease'
      };
    }
    if (hoveredButton === 'arubaito') {
      return {
        backgroundColor: '#181818',
        backgroundImage: 'url(/arubaito-hover.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.3s ease'
      };
    }
    return { 
      backgroundColor: '#181818',
      transition: 'background-image 0.3s ease'
    };
  };

  return (
    <div className="min-h-screen relative font-mono" style={getBackgroundStyle()}>
      <AsciiBackground />
      
      {/* Text rotators - positioned absolutely */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-8 max-w-4xl w-full" style={{ zIndex: 10 }}>
        {hoveredButton === 'rei' && (
          <h1 
            className="text-base md:text-xl font-semibold leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}
          >
            Aggregating Web3 <TextRotator words={tasksWords} isActive={true} /> to <TextRotator words={humansWords} isActive={true} /> hiring <TextRotator words={humansWords} isActive={true} />
          </h1>
        )}
        
        {hoveredButton === 'arubaito' && (
          <h1 
            className="text-base md:text-xl font-semibold leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}
          >
            Connecting Ex-<TextRotator words={web3Companies} isActive={true} /> Talent to <TextRotator words={web3Companies} isActive={true} />
          </h1>
        )}
      </div>

      {/* Buttons - fixed in center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row gap-6" style={{ zIndex: 10 }}>
        <Button
          onClick={() => navigate('/rei')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 transition-shadow duration-300 hover:bg-transparent font-mono"
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
          Rei
        </Button>
        <Button
          onClick={() => navigate('/arubaito')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 transition-shadow duration-300 hover:bg-transparent font-mono"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))',
            fontFamily: 'Consolas, monospace'
          }}
          onMouseEnter={(e) => {
            setHoveredButton('arubaito');
            e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--landing-border) / 0.6), inset 0 0 15px hsl(var(--landing-border) / 0.3)';
          }}
          onMouseLeave={(e) => {
            setHoveredButton(null);
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Arubaito
        </Button>
      </div>
    </div>
  );
};

export default Index;
