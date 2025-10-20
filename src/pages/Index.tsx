import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--landing-bg))' }}>
      <div className="flex flex-col gap-6">
        <Button
          onClick={() => navigate('/rei')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 hover:bg-white/10"
          style={{ borderColor: 'hsl(var(--landing-border))' }}
        >
          Rei
        </Button>
        <Button
          onClick={() => navigate('/arubaito')}
          variant="outline"
          size="lg"
          className="text-xl px-12 py-8 bg-transparent border-2 hover:bg-white/10"
          style={{ borderColor: 'hsl(var(--landing-border))' }}
        >
          Arubaito
        </Button>
      </div>
    </div>
  );
};

export default Index;
