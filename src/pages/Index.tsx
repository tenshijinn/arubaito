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
          className="text-xl px-12 py-8 bg-transparent border-2 transition-shadow duration-300"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--landing-border) / 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Rei
        </Button>
        <Button
          onClick={() => navigate('/arubaito')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 transition-shadow duration-300"
          style={{ 
            borderColor: 'hsl(var(--landing-border))',
            color: 'hsl(var(--landing-border))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--landing-border) / 0.6)';
          }}
          onMouseLeave={(e) => {
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
