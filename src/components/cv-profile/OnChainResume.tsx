import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, Link, Shield, Clock, Activity, HelpCircle, Trophy, ArrowLeftRight, TrendingUp, Image, Award, Send, Blocks, Vote, Droplets, Zap } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

const activityIcons: Record<string, LucideIcon> = {
  swap: ArrowLeftRight, stake: TrendingUp, nft: Image, poap: Award, transfer: Send,
  protocol: Blocks, governance: Vote, liquidity: Droplets, default: Zap,
};

interface BluechipVerification { chain: string; period: string; transactions: number; earliestDate: string }
interface SignificantActivity { type: string; description: string; experience: string; chain?: string; date?: string }
interface BluechipDetails {
  verifications?: BluechipVerification[];
  chains?: string[];
  ogStatus?: boolean;
  significantActivities?: SignificantActivity[];
  activitiesByChain?: Record<string, SignificantActivity[]>;
  solanaWalletAddress?: string;
  evmWalletAddress?: string;
  walletAddress?: string;
}
interface OnChainResumeProps {
  walletAddress: string | null;
  bluechipVerified: boolean;
  bluechipScore: number;
  bluechipDetails: BluechipDetails | null;
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded-full inline-flex items-center" style={{ border: `1px solid ${BORDER}`, fontFamily: MONO, fontSize: 10, color: INK }}>
    {children}
  </span>
);

const InsetRow = ({ children }: { children: React.ReactNode }) => (
  <div className="p-3 rounded-[12px]" style={{ border: `1px solid ${BORDER}` }}>{children}</div>
);

export const OnChainResume = ({ walletAddress, bluechipVerified, bluechipScore, bluechipDetails }: OnChainResumeProps) => {
  const solanaWallet = bluechipDetails?.solanaWalletAddress || (walletAddress && !walletAddress.startsWith('0x') ? walletAddress : null);
  const evmWallet = bluechipDetails?.evmWalletAddress || (walletAddress && walletAddress.startsWith('0x') ? walletAddress : null);
  const hasAnyWallet = solanaWallet || evmWallet;
  const truncateWallet = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const chains = bluechipDetails?.verifications?.map(v => v.chain) || bluechipDetails?.chains || [];
  const uniqueChains = [...new Set(chains)];
  const totalTransactions = bluechipDetails?.verifications?.reduce((sum, v) => sum + (v.transactions || 0), 0) || 0;

  const getActivitiesByChain = (): Record<string, SignificantActivity[]> => {
    if (bluechipDetails?.activitiesByChain && Object.keys(bluechipDetails.activitiesByChain).length > 0) return bluechipDetails.activitiesByChain;
    if (bluechipDetails?.significantActivities?.length) {
      const grouped: Record<string, SignificantActivity[]> = {};
      for (const a of bluechipDetails.significantActivities) {
        const chain = a.chain || 'Unknown';
        if (!grouped[chain]) grouped[chain] = [];
        if (grouped[chain].length < 5) grouped[chain].push(a);
      }
      return grouped;
    }
    return {};
  };
  const activitiesByChain = getActivitiesByChain();
  const chainNames = Object.keys(activitiesByChain);

  return (
    <div style={cardStyle()} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"04 / On-Chain"}</span>
        <span style={labelStyle()}>{"Resume"}</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-4 w-4" style={{ color: INK }} />
        <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>On-Chain Resume</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 cursor-help" style={{ color: MUTED }} /></TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">Provides proof of your on-chain activity in Web3.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {hasAnyWallet ? (
        <div className="space-y-4">
          {solanaWallet && (
            <InsetRow>
              <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 12 }}>
                <div className="flex items-center gap-2"><Link className="h-3.5 w-3.5" style={{ color: MUTED }} /><span style={{ color: INK }}>{truncateWallet(solanaWallet)}</span></div>
                <Pill>Solana</Pill>
              </div>
            </InsetRow>
          )}
          {evmWallet && (
            <InsetRow>
              <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 12 }}>
                <div className="flex items-center gap-2"><Link className="h-3.5 w-3.5" style={{ color: MUTED }} /><span style={{ color: INK }}>{truncateWallet(evmWallet)}</span></div>
                <Pill>EVM</Pill>
              </div>
            </InsetRow>
          )}

          {bluechipVerified ? (
            <div className="p-3 rounded-[12px]" style={{ background: INK, border: `1.5px solid ${INK}` }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5" style={{ color: CREAM }} />
                <span style={{ fontFamily: MONO, fontSize: 11, color: CREAM, letterSpacing: "0.12em", textTransform: "uppercase" }}>OG Verified</span>
              </div>
              <p style={{ fontFamily: MONO, fontSize: 11, color: "rgba(239,226,201,0.7)" }}>OG Score: {bluechipScore} points</p>
            </div>
          ) : (
            <InsetRow>
              <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                <Shield className="h-3.5 w-3.5" />
                <span>Not OG verified</span>
              </div>
            </InsetRow>
          )}

          {uniqueChains.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" style={{ color: MUTED }} /><span style={labelStyle()}>Active Chains</span></div>
              <div className="flex flex-wrap gap-2">{uniqueChains.map(c => <Pill key={c}>{c}</Pill>)}</div>
            </div>
          )}

          {totalTransactions > 0 && (
            <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 12 }}>
              <span style={{ color: MUTED }}>Total Transactions</span>
              <span style={{ color: INK }}>{totalTransactions}</span>
            </div>
          )}

          {bluechipDetails?.verifications && bluechipDetails.verifications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" style={{ color: MUTED }} /><span style={labelStyle()}>Early Activity</span></div>
              <div className="space-y-1">
                {bluechipDetails.verifications.map((v, i) => (
                  <p key={i} style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                    {v.chain}: {v.period} ({new Date(v.earliestDate).toLocaleDateString()})
                  </p>
                ))}
              </div>
            </div>
          )}

          {bluechipDetails?.ogStatus && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: ACCENT, color: CREAM, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              <Trophy className="h-3 w-3" />
              OG Status
            </div>
          )}

          {chainNames.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" style={{ color: MUTED }} />
                <span style={labelStyle()}>Significant Activities</span>
                <Pill>{chainNames.length} chain{chainNames.length > 1 ? 's' : ''}</Pill>
              </div>

              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {chainNames.map((chain) => {
                    const activities = activitiesByChain[chain] || [];
                    return (
                      <CarouselItem key={chain}>
                        <div className="p-4 rounded-[16px]" style={{ border: `1.5px solid ${BORDER}` }}>
                          <div className="flex items-center justify-between mb-3">
                            <Pill>{chain}</Pill>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                              {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {activities.slice(0, 5).map((activity, i) => {
                              const IconComponent = activityIcons[activity.type] || activityIcons.default;
                              return (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-[10px]" style={{ border: `1px solid ${BORDER}` }}>
                                  <IconComponent className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: INK }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate" style={{ fontFamily: MONO, fontSize: 11, color: INK }}>{activity.description}</p>
                                    <p className="truncate" style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{activity.experience}</p>
                                    {activity.date && (
                                      <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>
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
                {chainNames.length > 1 && (<><CarouselPrevious className="left-0 -translate-x-1/2" /><CarouselNext className="right-0 translate-x-1/2" /></>)}
              </Carousel>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Wallet className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(24,24,24,0.2)" }} />
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>No wallet declared</p>
          <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 4 }}>This CV was analyzed without a wallet address</p>
        </div>
      )}
    </div>
  );
};
