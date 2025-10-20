import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TextRotator } from "@/components/TextRotator";

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
        backgroundColor: 'hsl(var(--landing-bg))',
        backgroundImage: 'url(/rei-hover.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.3s ease'
      };
    }
    if (hoveredButton === 'arubaito') {
      return {
        backgroundColor: 'hsl(var(--landing-bg))',
        backgroundImage: 'url(/arubaito-hover.webp)',
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-16" style={getBackgroundStyle()}>
      <div className="text-center space-y-8 px-8 max-w-4xl">
        {hoveredButton === 'rei' && (
          <h1 
            className="text-2xl md:text-3xl font-semibold leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}
          >
            Aggregating Web3{' '}
            <TextRotator words={tasksWords} isActive={true} className="mx-2" />
            {' '}to{' '}
            <TextRotator words={humansWords} isActive={true} className="mx-2" />
            {' '}hiring{' '}
            <TextRotator words={humansWords} isActive={true} className="mx-2" />
          </h1>
        )}
        
        {hoveredButton === 'arubaito' && (
          <h1 
            className="text-2xl md:text-3xl font-semibold leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', color: '#ed565a' }}
          >
            Connecting Ex-
            <TextRotator words={web3Companies} isActive={true} className="mx-2" />
            {' '}Talent to{' '}
            <TextRotator words={web3Companies} isActive={true} className="mx-2" />
          </h1>
        )}
      </div>

      <div className="flex flex-row gap-6">
        <Button
          onClick={() => navigate('/rei')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 transition-shadow duration-300 hover:bg-transparent"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))'
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
          className="text-xl px-12 py-8 bg-transparent border-2 transition-shadow duration-300 hover:bg-transparent"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))'
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
