import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Shield, CheckCircle2, ArrowRight, Link2, Search, Blocks, X, Activity, Gem } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export interface WalletAddresses {
  solana: string | null;
  evm: string | null;
}

interface WalletConnectStepProps {
  onContinue: (wallets: WalletAddresses) => void;
  onSkip: () => void;
}

export const WalletConnectStep = ({ onContinue, onSkip }: WalletConnectStepProps) => {
  const { publicKey, connected: solanaConnected, disconnect: disconnectSolana } = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  
  const solanaAddress = publicKey?.toBase58() || null;
  const hasAnyWallet = solanaConnected || evmConnected;

  const benefits = [
    {
      icon: Activity,
      title: "On-Chain Activity Score",
      description: "Transaction history across 15+ chains contributes to your CV Score"
    },
    {
      icon: Link2,
      title: "Cross-Chain Verification",
      description: "Solana + 14 EVM chains scanned for comprehensive credentials"
    },
    {
      icon: Blocks,
      title: "Developer Proof",
      description: "Testnet/devnet activity recognized as builder credentials"
    },
    {
      icon: Gem,
      title: "Bluechip Detection",
      description: "Interactions with top protocols boost your score"
    }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" 
             style={{ background: 'var(--gradient-primary)' }}>
          <Search className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Select Wallet to Scan
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Optionally connect your Solana or EVM wallet. Your on-chain transaction history will be scanned and combined with your CV to produce a comprehensive CV Score.
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

      {/* Dual Wallet Connection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solana Wallet Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SOL</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Solana Wallet</h3>
                <p className="text-xs text-muted-foreground">Phantom, Solflare, etc.</p>
              </div>
            </div>
            
            {solanaConnected && solanaAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-500">Connected</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {solanaAddress}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => disconnectSolana()}
                  className="w-full text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !rounded-md !h-10 !px-4 !text-sm" />
              </div>
            )}
          </div>
        </Card>

        {/* EVM Wallet Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">EVM</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">EVM Wallet</h3>
                <p className="text-xs text-muted-foreground">MetaMask, Rainbow, etc.</p>
              </div>
            </div>
            
            {evmConnected && evmAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-500">Connected</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {evmAddress}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => disconnectEvm()}
                  className="w-full text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button onClick={openConnectModal} className="w-full">
                      Connect EVM Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Continue Section */}
      {hasAnyWallet && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Your wallet activity will be scanned and combined with your CV data to produce your final CV Score.
          </p>
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => onContinue({
              solana: solanaAddress,
              evm: evmAddress || null
            })}
          >
            Continue with Wallet
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      )}

      {/* Skip Option */}
      <div className="text-center">
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Skip — continue without wallet scan
        </Button>
      </div>
    </div>
  );
};
