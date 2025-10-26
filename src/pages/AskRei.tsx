import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Navigation } from "@/components/Navigation";
import ReiChatbot from "@/components/ReiChatbot";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Briefcase, User } from "lucide-react";

const AskRei = () => {
  const { publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [userMode, setUserMode] = useState<'talent' | 'employer'>('talent');

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress('');
    }
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation userName={null} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-foreground">Ask Rei</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your AI assistant for Web3 talent matching
            </p>

            {publicKey && (
              <div className="flex items-center justify-center gap-3 mb-6">
                <User className={`w-5 h-5 ${userMode === 'talent' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="mode-toggle" className="text-sm font-medium">
                  {userMode === 'talent' ? 'Talent Mode' : 'Hiring Mode'}
                </Label>
                <Switch
                  id="mode-toggle"
                  checked={userMode === 'employer'}
                  onCheckedChange={(checked) => setUserMode(checked ? 'employer' : 'talent')}
                />
                <Briefcase className={`w-5 h-5 ${userMode === 'employer' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            )}
            
            {!publicKey && (
              <div className="mb-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your wallet to start chatting with Rei
                </p>
                <div className="flex justify-center">
                  <WalletMultiButton />
                </div>
              </div>
            )}
          </div>

          {publicKey ? (
            <ReiChatbot walletAddress={walletAddress} userMode={userMode} />
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">
                Please connect your Solana wallet to access Rei chatbot
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AskRei;