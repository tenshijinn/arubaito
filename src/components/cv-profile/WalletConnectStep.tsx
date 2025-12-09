import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Shield, CheckCircle2, ArrowRight, Link2, Sparkles, BadgeCheck } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface WalletConnectStepProps {
  onContinue: (walletAddress: string | null) => void;
  onSkip: () => void;
}

export const WalletConnectStep = ({ onContinue, onSkip }: WalletConnectStepProps) => {
  const { publicKey, connected, connecting } = useWallet();
  const walletAddress = publicKey?.toBase58() || null;

  const benefits = [
    {
      icon: Shield,
      title: "Proof of Talent",
      description: "On-chain activity verifies your Web3 experience claims"
    },
    {
      icon: BadgeCheck,
      title: "Bluechip Verification",
      description: "Interactions with top protocols boost your CV score"
    },
    {
      icon: Link2,
      title: "Cross-Reference Claims",
      description: "Projects you mention are validated against wallet history"
    },
    {
      icon: Sparkles,
      title: "OG Status Recognition",
      description: "Early activity on chains like Ethereum, Solana, BSC is recognized"
    }
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" 
             style={{ background: 'var(--gradient-primary)' }}>
          <Wallet className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Connect Your Wallet
        </h2>
        <p className="text-muted-foreground">
          Strengthen your CV with verifiable on-chain proof of your Web3 experience
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <Card key={index} className="p-4 bg-accent/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <benefit.icon className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        {connected && walletAddress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-500">Wallet Connected</p>
                <p className="text-sm font-mono text-muted-foreground truncate">
                  {walletAddress}
                </p>
              </div>
            </div>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">
                  Your wallet's on-chain history will be analyzed to verify any Web3 projects, 
                  protocols, or companies you mention in your CV. This creates <strong>verifiable proof</strong> of 
                  your experience and can significantly boost your CV score.
                </p>
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => onContinue(walletAddress)}
            >
              Continue with Wallet Verification
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Connect your Solana wallet to enable on-chain verification
            </p>
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !rounded-md !h-12 !px-6" />
            </div>
            {connecting && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Connecting to wallet...
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Skip Option */}
      {!connected && (
        <div className="text-center">
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Skip for now - continue without wallet verification
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            You can still create a CV profile, but on-chain verification won't be available
          </p>
        </div>
      )}
    </div>
  );
};