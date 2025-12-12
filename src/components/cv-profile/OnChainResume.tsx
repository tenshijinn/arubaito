import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Wallet, Link, Shield, Clock, Activity, HelpCircle, Trophy,
  ArrowLeftRight, TrendingUp, Image, Award, Send, Blocks, Vote, Droplets, Zap
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Activity icon mapping for significant on-chain activities
const activityIcons: Record<string, LucideIcon> = {
  swap: ArrowLeftRight,
  stake: TrendingUp,
  nft: Image,
  poap: Award,
  transfer: Send,
  protocol: Blocks,
  governance: Vote,
  liquidity: Droplets,
  default: Zap
};

// Chain display names and colors
const chainConfig: Record<string, { name: string; color: string }> = {
  Solana: { name: 'Solana', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  Ethereum: { name: 'Ethereum', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  Polygon: { name: 'Polygon', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  Arbitrum: { name: 'Arbitrum', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  Optimism: { name: 'Optimism', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  Base: { name: 'Base', color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  BSC: { name: 'BSC', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  Avalanche: { name: 'Avalanche', color: 'bg-red-600/20 text-red-300 border-red-600/30' },
  Fantom: { name: 'Fantom', color: 'bg-blue-400/20 text-blue-300 border-blue-400/30' },
  'zkSync Era': { name: 'zkSync', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  Scroll: { name: 'Scroll', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  Linea: { name: 'Linea', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  Blast: { name: 'Blast', color: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30' },
  Gnosis: { name: 'Gnosis', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  Sei: { name: 'Sei', color: 'bg-red-400/20 text-red-300 border-red-400/30' },
  LayerOneX: { name: 'L1X', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
};

interface BluechipVerification {
  chain: string;
  period: string;
  transactions: number;
  earliestDate: string;
}

interface SignificantActivity {
  type: string;
  description: string;
  experience: string;
  chain?: string;
  date?: string;
}

interface BluechipDetails {
  verifications?: BluechipVerification[];
  chains?: string[];
  ogStatus?: boolean;
  significantActivities?: SignificantActivity[];
  activitiesByChain?: Record<string, SignificantActivity[]>;
  solanaWalletAddress?: string;
  evmWalletAddress?: string;
  walletAddress?: string; // Legacy
}

interface OnChainResumeProps {
  walletAddress: string | null;
  bluechipVerified: boolean;
  bluechipScore: number;
  bluechipDetails: BluechipDetails | null;
}

export const OnChainResume = ({
  walletAddress,
  bluechipVerified,
  bluechipScore,
  bluechipDetails,
}: OnChainResumeProps) => {
  // Extract wallet addresses from bluechipDetails or fallback to walletAddress
  const solanaWallet = bluechipDetails?.solanaWalletAddress || 
    (walletAddress && !walletAddress.startsWith('0x') ? walletAddress : null);
  const evmWallet = bluechipDetails?.evmWalletAddress || 
    (walletAddress && walletAddress.startsWith('0x') ? walletAddress : null);
  
  const hasAnyWallet = solanaWallet || evmWallet;
  
  const truncateWallet = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const chains = bluechipDetails?.verifications?.map(v => v.chain) || 
                 bluechipDetails?.chains || [];
  const uniqueChains = [...new Set(chains)];

  const totalTransactions = bluechipDetails?.verifications?.reduce(
    (sum, v) => sum + (v.transactions || 0), 0
  ) || 0;

  // Group activities by chain - use new format if available, fall back to old format
  const getActivitiesByChain = (): Record<string, SignificantActivity[]> => {
    // New format: activitiesByChain already grouped
    if (bluechipDetails?.activitiesByChain && Object.keys(bluechipDetails.activitiesByChain).length > 0) {
      return bluechipDetails.activitiesByChain;
    }
    
    // Legacy format: significantActivities flat array - group by chain
    if (bluechipDetails?.significantActivities && bluechipDetails.significantActivities.length > 0) {
      const grouped: Record<string, SignificantActivity[]> = {};
      for (const activity of bluechipDetails.significantActivities) {
        const chain = activity.chain || 'Unknown';
        if (!grouped[chain]) {
          grouped[chain] = [];
        }
        if (grouped[chain].length < 5) {
          grouped[chain].push(activity);
        }
      }
      return grouped;
    }
    
    return {};
  };

  const activitiesByChain = getActivitiesByChain();
  const chainNames = Object.keys(activitiesByChain);

  const getChainConfig = (chain: string) => {
    return chainConfig[chain] || { name: chain, color: 'bg-muted/30 text-foreground border-border' };
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">On-Chain Resume</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">
                Provides proof of your on-chain activity in Web3. Shows verified interactions 
                with protocols, staking, swapping on DEXs, transferring funds, and other 
                blockchain transactions that demonstrate your experience.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Wallet Addresses - Show all connected wallets */}
      {hasAnyWallet ? (
        <div className="space-y-4">
          {/* Solana Wallet */}
          {solanaWallet && (
            <div className="p-3 bg-muted/30 rounded border border-border/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{truncateWallet(solanaWallet)}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Solana</Badge>
              </div>
            </div>
          )}
          
          {/* EVM Wallet */}
          {evmWallet && (
            <div className="p-3 bg-muted/30 rounded border border-border/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{truncateWallet(evmWallet)}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">EVM</Badge>
              </div>
            </div>
          )}

          {/* Bluechip Status */}
          {bluechipVerified ? (
            <div className="p-3 bg-primary/10 rounded border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Bluechip Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Score: {bluechipScore} points
              </p>
            </div>
          ) : (
            <div className="p-3 bg-muted/30 rounded border border-border/50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Not bluechip verified
                </span>
              </div>
            </div>
          )}

          {/* Chain Activity */}
          {uniqueChains.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Active Chains</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueChains.map((chain) => (
                  <Badge key={chain} variant="outline" className="text-xs">
                    {chain}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Count */}
          {totalTransactions > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Transactions</span>
              <span className="font-mono">{totalTransactions}</span>
            </div>
          )}

          {/* Early Activity */}
          {bluechipDetails?.verifications && bluechipDetails.verifications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Early Activity</span>
              </div>
              <div className="space-y-1">
                {bluechipDetails.verifications.map((v, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {v.chain}: {v.period} ({new Date(v.earliestDate).toLocaleDateString()})
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* OG Status */}
          {bluechipDetails?.ogStatus && (
            <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1.5">
              <Trophy className="h-3 w-3" />
              OG Status
            </Badge>
          )}

          {/* Chain Activity Carousel */}
          {chainNames.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Significant Activities</span>
                <Badge variant="outline" className="text-[10px]">{chainNames.length} chain{chainNames.length > 1 ? 's' : ''}</Badge>
              </div>
              
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {chainNames.map((chain) => {
                    const config = getChainConfig(chain);
                    const activities = activitiesByChain[chain] || [];
                    
                    return (
                      <CarouselItem key={chain}>
                        <div className={`p-4 rounded-lg border ${config.color}`}>
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`${config.color} border`}>
                              {config.name}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {activities.slice(0, 5).map((activity, i) => {
                              const IconComponent = activityIcons[activity.type] || activityIcons.default;
                              return (
                                <div key={i} className="flex items-start gap-2 p-2 bg-background/50 rounded border border-border/30">
                                  <IconComponent className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{activity.description}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{activity.experience}</p>
                                    {activity.date && (
                                      <span className="text-[9px] text-muted-foreground">
                                        {new Date(activity.date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                {chainNames.length > 1 && (
                  <>
                    <CarouselPrevious className="left-0 -translate-x-1/2" />
                    <CarouselNext className="right-0 translate-x-1/2" />
                  </>
                )}
              </Carousel>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No wallet declared
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This CV was analyzed without a wallet address
          </p>
        </div>
      )}
    </Card>
  );
};
