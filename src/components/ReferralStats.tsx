import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MousePointerClick, Users, CreditCard, TrendingUp, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ReferralStatsProps {
  walletAddress: string;
  xUserId?: string;
}

interface Stats {
  totalClicks: number;
  uniqueVisitors: number;
  paidClicks: number;
  registrations: number;
  payments: number;
  totalPoints: number;
  breakdown: {
    clicks: number;
    registrations: number;
    payments: number;
  };
  recentActivity: Array<{
    type: string;
    timestamp: string;
    points: number;
    details: string | null;
  }>;
  dailyStats: Array<{
    date: string;
    day: string;
    clicks: number;
  }>;
}

export const ReferralStats = ({ walletAddress, xUserId }: ReferralStatsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!walletAddress && !xUserId) return;

      try {
        const { data, error } = await supabase.functions.invoke('get-referral-stats', {
          body: { walletAddress, xUserId },
        });

        if (error) throw error;
        
        if (data?.hasReferralCode) {
          setReferralCode(data.referralCode);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [walletAddress, xUserId]);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const maxClicks = Math.max(...stats.dailyStats.map(d => d.clicks), 1);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Referral Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background/50 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">Total Clicks</span>
            </div>
            <p className="text-xl font-bold">{stats.totalClicks}</p>
            <p className="text-xs text-muted-foreground">{stats.uniqueVisitors} unique</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Registrations</span>
            </div>
            <p className="text-xl font-bold">{stats.registrations}</p>
            <p className="text-xs text-primary">+{stats.breakdown.registrations} pts</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs">Paid Posts</span>
            </div>
            <p className="text-xl font-bold">{stats.payments}</p>
            <p className="text-xs text-primary">+{stats.breakdown.payments} pts</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs">Total Earned</span>
            </div>
            <p className="text-xl font-bold text-primary">{stats.totalPoints}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Last 7 Days</h4>
          <div className="flex items-end justify-between gap-1 h-20">
            {stats.dailyStats.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={cn(
                    "w-full rounded-t transition-all",
                    day.clicks > 0 ? "bg-primary" : "bg-muted"
                  )}
                  style={{ 
                    height: `${Math.max((day.clicks / maxClicks) * 100, 5)}%`,
                    minHeight: '4px'
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 5).map((activity, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.type === 'click' ? "bg-blue-500" :
                      activity.type === 'registration' ? "bg-green-500" : "bg-primary"
                    )} />
                    <span className="text-sm capitalize">{activity.type}</span>
                    {activity.details && (
                      <span className="text-xs text-muted-foreground">
                        {activity.details}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      +{activity.points}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
