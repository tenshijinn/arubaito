import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp, Wallet } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ReiPointsCardProps {
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

export function ReiPointsCard({ registrationWallet, connectedWallet, xUserId }: ReiPointsCardProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Use connected wallet if available, otherwise fall back to registration wallet
  const primaryWallet = connectedWallet || registrationWallet;

  // Fetch aggregated points across all linked wallets
  const { data: pointsData, isLoading } = useQuery({
    queryKey: ['user-points-aggregated', xUserId, primaryWallet],
    queryFn: async (): Promise<AggregatedPoints> => {
      // First, get all wallet addresses linked to this X user
      let walletAddresses: string[] = [];
      
      if (xUserId) {
        // Get all wallets from rei_registry for this x_user_id
        const { data: registries } = await supabase
          .from('rei_registry')
          .select('wallet_address')
          .eq('x_user_id', xUserId);
        
        if (registries && registries.length > 0) {
          walletAddresses = registries.map(r => r.wallet_address);
        }
      }
      
      // Add connected wallet if not already included
      if (connectedWallet && !walletAddresses.includes(connectedWallet)) {
        walletAddresses.push(connectedWallet);
      }
      
      // Add registration wallet if not already included
      if (registrationWallet && !walletAddresses.includes(registrationWallet)) {
        walletAddresses.push(registrationWallet);
      }

      if (walletAddresses.length === 0) {
        return { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 };
      }

      // Fetch points for all linked wallets
      const { data: pointsRecords, error } = await supabase
        .from('user_points')
        .select('total_points, points_pending, lifetime_earnings_sol')
        .in('wallet_address', walletAddresses);

      if (error) throw error;

      // Aggregate points from all wallets
      const aggregated = (pointsRecords || []).reduce<AggregatedPoints>(
        (acc, record) => ({
          total_points: acc.total_points + (record.total_points || 0),
          points_pending: acc.points_pending + (record.points_pending || 0),
          lifetime_earnings_sol: acc.lifetime_earnings_sol + (Number(record.lifetime_earnings_sol) || 0),
          wallet_count: acc.wallet_count + 1,
        }),
        { total_points: 0, points_pending: 0, lifetime_earnings_sol: 0, wallet_count: 0 }
      );

      return aggregated;
    },
    enabled: !!(xUserId || primaryWallet),
    refetchInterval: 30000,
  });

  // Subscribe to real-time updates for the primary wallet
  useEffect(() => {
    if (!primaryWallet) return;

    const channel = supabase
      .channel(`points-${primaryWallet}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `wallet_address=eq.${primaryWallet}`,
        },
        () => {
          setIsAnimating(true);
          queryClient.invalidateQueries({ queryKey: ['user-points-aggregated', xUserId, primaryWallet] });
          setTimeout(() => setIsAnimating(false), 600);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [primaryWallet, xUserId, queryClient]);

  const totalPoints = pointsData?.total_points ?? 0;
  const pendingPoints = pointsData?.points_pending ?? 0;
  const lifetimeSol = pointsData?.lifetime_earnings_sol ?? 0;
  const walletCount = pointsData?.wallet_count ?? 0;

  // Don't render if no wallet or still loading with no data
  if ((!primaryWallet && !xUserId) || (isLoading && !pointsData)) {
    return null;
  }

  return (
    <div 
      className={`
        fixed top-20 left-4 z-40 
        bg-background/60 backdrop-blur-md 
        border border-primary/30 rounded-sm
        p-3 w-36
        shadow-[var(--shadow-glow)]
        transition-all duration-300
        ${isAnimating ? 'scale-105 border-primary/60' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Coins className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Points
        </span>
      </div>

      {/* Total Points */}
      <p 
        className={`
          text-xl font-bold font-mono text-primary leading-none
          transition-all duration-300
          ${isAnimating ? 'scale-110' : ''}
        `}
      >
        {totalPoints.toLocaleString()}
      </p>

      {/* Pending Points */}
      {pendingPoints > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3 text-yellow-500" />
          <span className="text-[10px] font-mono text-yellow-500">
            +{pendingPoints.toLocaleString()} pending
          </span>
        </div>
      )}

      {/* Wallets linked indicator */}
      {walletCount > 1 && (
        <div className="flex items-center gap-1 mt-1">
          <Wallet className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {walletCount} wallets linked
          </span>
        </div>
      )}

      {/* SOL Equivalent */}
      {lifetimeSol > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 border-t border-primary/10 pt-1.5">
          ≈ {Number(lifetimeSol).toFixed(4)} SOL earned
        </p>
      )}
    </div>
  );
}
