import { useQuery } from "@tanstack/react-query";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Coins, TrendingUp, Clock } from "lucide-react";
import { Badge } from "./ui/badge";

interface PointsDisplayProps {
  walletAddress: string;
}

export const PointsDisplay = ({ walletAddress }: PointsDisplayProps) => {
  const { data: points, isLoading } = useQuery({
    queryKey: ['user-points', walletAddress],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        console.error('Error fetching points:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!walletAddress,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['points-transactions', walletAddress],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!walletAddress,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (!points) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No points yet. Start submitting opportunities to earn rewards!</p>
        </div>
      </Card>
    );
  }

  const canConvert = points.total_points >= 1000;
  const solValue = (points.total_points / 100) * 0.01;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Your Points</h3>
            <p className="text-sm text-muted-foreground">Earn points by submitting unique opportunities</p>
          </div>
          <Coins className="h-8 w-8 text-primary" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Total Points</p>
            </div>
            <p className="text-3xl font-bold">{points.total_points}</p>
            <p className="text-xs text-muted-foreground">≈ {solValue.toFixed(3)} SOL</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-sm font-medium">Pending</p>
            </div>
            <p className="text-3xl font-bold text-yellow-500">{points.points_pending}</p>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium">Lifetime Earnings</p>
            </div>
            <p className="text-3xl font-bold text-green-500">{points.lifetime_earnings_sol.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">SOL</p>
          </div>
        </div>

        <div className="mt-6">
          <Button
            className="w-full"
            disabled={!canConvert}
          >
            Convert to SOL
            {!canConvert && <span className="ml-2 text-xs">(min 1,000 points)</span>}
          </Button>
        </div>
      </Card>

      {recentTransactions && recentTransactions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    tx.transaction_type === 'earned' ? 'default' :
                    tx.transaction_type === 'converted' ? 'secondary' :
                    'outline'
                  }>
                    {tx.transaction_type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {tx.transaction_type === 'earned' && '+'}
                      {tx.points} points
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {tx.sol_amount && (
                  <p className="text-sm font-medium text-green-500">
                    {tx.sol_amount} SOL
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};