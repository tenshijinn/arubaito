import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ReiPointsCardProps {
  walletAddress: string;
}

export function ReiPointsCard({ walletAddress }: ReiPointsCardProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: pointsData, isLoading } = useQuery({
    queryKey: ['user-points', walletAddress],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_points')
        .select('total_points, points_pending, lifetime_earnings_sol')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!walletAddress) return;

    const channel = supabase
      .channel(`points-${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `wallet_address=eq.${walletAddress}`,
        },
        () => {
          setIsAnimating(true);
          queryClient.invalidateQueries({ queryKey: ['user-points', walletAddress] });
          setTimeout(() => setIsAnimating(false), 600);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, queryClient]);

  const totalPoints = pointsData?.total_points ?? 0;
  const pendingPoints = pointsData?.points_pending ?? 0;
  const lifetimeSol = pointsData?.lifetime_earnings_sol ?? 0;

  // Don't render if no wallet or still loading with no data
  if (!walletAddress || (isLoading && !pointsData)) {
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

      {/* SOL Equivalent */}
      {lifetimeSol > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 border-t border-primary/10 pt-1.5">
          ≈ {Number(lifetimeSol).toFixed(4)} SOL earned
        </p>
      )}
    </div>
  );
}
