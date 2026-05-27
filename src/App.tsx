import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/components/WalletProvider";
import { EVMWalletProvider } from "@/components/EVMWalletProvider";
import Index from "./pages/Index";
import Arubaito from "./pages/Arubaito";
import Club from "./pages/Club";
import Admin from "./pages/Admin";
import Community from "./pages/Community";
import IkigaiCard from "./pages/IkigaiCard";
import TelegramRedirect from "./pages/TelegramRedirect";
import Meaning from "./pages/Meaning";
import NetworkSchool from "./pages/NetworkSchool";
import GuestList from "./pages/GuestList";
import Careers from "./pages/Careers";
import Unsubscribe from "./pages/Unsubscribe";
import Aesthetics from "./pages/Aesthetics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <EVMWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/arubaito" element={<Arubaito />} />
              <Route path="/club" element={<Club />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/community" element={<Community />} />
              <Route path="/meaning" element={<Meaning />} />
              <Route path="/ikigai" element={<IkigaiCard />} />
              <Route path="/ikigai/tg" element={<TelegramRedirect />} />
              <Route path="/ns" element={<NetworkSchool />} />
              <Route path="/guestlist" element={<GuestList />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/aesthetics" element={<Aesthetics />} />
              <Route path="/aethetics" element={<Aesthetics />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </EVMWalletProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
