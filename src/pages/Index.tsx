import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--landing-bg))' }}>
      <div className="flex flex-row gap-6">
        <Button
          onClick={() => navigate('/rei')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 transition-all duration-300 hover:bg-transparent overflow-hidden relative"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--landing-border) / 0.6), inset 0 0 15px hsl(var(--landing-border) / 0.3)';
            e.currentTarget.style.backgroundImage = 'url(/rei-hover.webp)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundImage = 'none';
          }}
        >
          <span className="relative z-10">Rei</span>
        </Button>
        <Button
          onClick={() => navigate('/arubaito')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 transition-all duration-300 hover:bg-transparent overflow-hidden relative"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--landing-border) / 0.6), inset 0 0 15px hsl(var(--landing-border) / 0.3)';
            e.currentTarget.style.backgroundImage = 'url(/arubaito-hover.webp)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundImage = 'none';
          }}
        >
          <span className="relative z-10">Arubaito</span>
        </Button>
      </div>
    </div>
  );
};

export default Index;
