import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center" style={getBackgroundStyle()}>
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
