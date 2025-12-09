import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Link, Shield, Clock, Activity } from "lucide-react";

interface BluechipVerification {
  chain: string;
  period: string;
  transactions: number;
  earliestDate: string;
}

interface BluechipDetails {
  verifications?: BluechipVerification[];
  chains?: string[];
  ogStatus?: boolean;
}

interface WalletOverviewProps {
  walletAddress: string | null;
  bluechipVerified: boolean;
  bluechipScore: number;
  bluechipDetails: BluechipDetails | null;
}

export const WalletOverview = ({
  walletAddress,
  bluechipVerified,
  bluechipScore,
  bluechipDetails,
}: WalletOverviewProps) => {
  const truncatedWallet = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const chains = bluechipDetails?.verifications?.map(v => v.chain) || 
                 bluechipDetails?.chains || [];
  const uniqueChains = [...new Set(chains)];

  const totalTransactions = bluechipDetails?.verifications?.reduce(
    (sum, v) => sum + (v.transactions || 0), 0
  ) || 0;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Wallet Overview</h3>
      </div>

      {/* Wallet Address - Always show if available */}
      {walletAddress ? (
        <div className="space-y-4">
          <div className="p-3 bg-muted/30 rounded border border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Link className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{truncatedWallet}</span>
            </div>
          </div>

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
                <span className="text-muted-foreground">Chains</span>
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
            <Badge className="bg-primary/20 text-primary border-primary/30">
              🏆 OG Status
            </Badge>
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
