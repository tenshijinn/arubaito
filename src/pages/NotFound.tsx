import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center border border-primary p-12 max-w-2xl w-full">
        <h1 className="mb-6 text-6xl font-bold tracking-wider">404</h1>
        <p className="mb-8 text-xl tracking-wide">PAGE NOT FOUND</p>
        <a 
          href="/" 
          className="inline-block border border-primary px-8 py-3 text-sm font-bold tracking-wider hover:bg-primary/10 transition-colors"
        >
          RETURN TO HOME
        </a>
      </div>

      <WaitlistCountdown />
    </div>
  );
};

export default NotFound;
