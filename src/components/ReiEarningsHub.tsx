import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Coins, TrendingUp, Wallet, ChevronDown, ChevronUp, 
  Copy, Check, Twitter, Share2, MousePointer, UserPlus, Briefcase 
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReiEarningsHubProps {
  registrationWallet?: string;
  connectedWallet?: string;
  xUserId?: string;
}

interface AggregatedPoints {
  total_points: number;
  points_pending: number;
  lifetime_earnings_sol: number;
  wallet_count: number;
}

export function ReiEarningsHub({ registrationWallet, connectedWallet, xUserId }: ReiEarningsHubProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const primaryWallet = connectedWallet || registrationWallet;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralUrl = referralCode ? `${baseUrl}/r/${referralCode}` : '';

  // Fetch aggregated points
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['user-points-aggregated', xUserId, primaryWallet],
    queryFn: async (): Promise<AggregatedPoints> => {
      let walletAddresses: string[] = [];
      
      if (xUserId) {
        const { data: registries } = await supabase
          .from('rei_registry')
          .select('wallet_address')
          .eq('x_user_id', xUserId);
        
        if (registries && registries.length > 0) {
          walletAddresses = registries.map(r => r.wallet_address);
        }
      }
      
      if (connectedWallet && !walletAddresses.includes(connectedWallet)) {
        walletAddresses.push(connectedWallet);
      }
      
      if (registrationWallet && !walletAddresses.includes(registrationWallet)) {
        walletAddresses.push(registrationWallet);
      }

      if (walletAddresses.length === 0) {
        return { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 };
      }

      const { data: pointsRecords, error } = await supabase
        .from('user_points')
        .select('total_points, points_pending, lifetime_earnings_sol')
        .in('wallet_address', walletAddresses);

      if (error) throw error;

      return (pointsRecords || []).reduce<AggregatedPoints>(
        (acc, record) => ({
          total_points: acc.total_points + (record.total_points || 0),
          points_pending: acc.points_pending + (record.points_pending || 0),
          lifetime_earnings_sol: acc.lifetime_earnings_sol + (Number(record.lifetime_earnings_sol) || 0),
          wallet_count: acc.wallet_count + 1,
        }),
        { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 }
      );
    },
    enabled: !!(xUserId || primaryWallet),
    refetchInterval: 30000,
  });

  // Fetch referral code when expanded
  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!primaryWallet || referralCode) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-referral-code', {
          body: { walletAddress: primaryWallet, xUserId },
        });
        if (!error && data?.referralCode) {
          setReferralCode(data.referralCode);
        }
      } catch (err) {
        console.error('Error fetching referral code:', err);
      }
    };

    if (isExpanded) {
      fetchReferralCode();
    }
  }, [isExpanded, primaryWallet, xUserId, referralCode]);

  // Real-time points updates
  useEffect(() => {
    if (!primaryWallet) return;

    const channel = supabase
      .channel(`points-${primaryWallet}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_points',
        filter: `wallet_address=eq.${primaryWallet}`,
      }, () => {
        setIsAnimating(true);
        queryClient.invalidateQueries({ queryKey: ['user-points-aggregated', xUserId, primaryWallet] });
        setTimeout(() => setIsAnimating(false), 600);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [primaryWallet, xUserId, queryClient]);

  const totalPoints = pointsData?.total_points ?? 0;
  const pendingPoints = pointsData?.points_pending ?? 0;
  const lifetimeSol = pointsData?.lifetime_earnings_sol ?? 0;
  const walletCount = pointsData?.wallet_count ?? 0;

  if ((!primaryWallet && !xUserId) || (pointsLoading && !pointsData)) {
    return null;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareToTwitter = () => {
    const text = `Join me on Rei and discover web3 opportunities!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Rei', text: 'Join me on Rei!', url: referralUrl });
      } catch { /* cancelled */ }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div 
      className={`
        fixed top-20 left-4 z-40 
        bg-background/80 backdrop-blur-lg 
        border border-primary/20 rounded-lg
        shadow-lg
        transition-all duration-300 ease-out
        ${isExpanded ? 'w-72' : 'w-40'}
        ${isAnimating ? 'scale-[1.02] border-primary/50' : ''}
      `}
    >
      {/* Collapsed Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-primary/5 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Coins className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left">
            <p className={`font-bold font-mono text-lg leading-none ${isAnimating ? 'text-primary' : 'text-foreground'}`}>
              {totalPoints.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
              {pendingPoints > 0 ? `+${pendingPoints} pending` : 'points'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Stats Row */}
          <div className="flex gap-3 text-xs">
            {walletCount > 1 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Wallet className="h-3 w-3" />
                <span className="font-mono">{walletCount} linked</span>
              </div>
            )}
            {lifetimeSol > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span className="font-mono">{lifetimeSol.toFixed(4)} SOL</span>
              </div>
            )}
          </div>

          {/* How to Earn */}
          <div className="bg-muted/30 rounded-md p-2.5 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              How to earn
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <MousePointer className="h-3 w-3 text-primary/70" />
                <span className="text-muted-foreground">1 pt</span>
                <span className="text-foreground/80">per unique click</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <UserPlus className="h-3 w-3 text-primary/70" />
                <span className="text-muted-foreground">25 pts</span>
                <span className="text-foreground/80">per registration</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Briefcase className="h-3 w-3 text-primary/70" />
                <span className="text-muted-foreground">100 pts</span>
                <span className="text-foreground/80">per paid job</span>
              </div>
            </div>
          </div>

          {/* Share Section */}
          {referralCode && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Your referral link
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 h-8 px-2 bg-muted/50 hover:bg-muted rounded text-xs font-mono truncate flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate text-muted-foreground">/r/{referralCode}</span>
                </button>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareToTwitter}
                  className="flex-1 h-7 text-xs"
                >
                  <Twitter className="h-3 w-3 mr-1" />
                  Post
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareNative}
                  className="flex-1 h-7 text-xs"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
