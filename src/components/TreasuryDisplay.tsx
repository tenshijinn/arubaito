import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import solanaIcon from "@/assets/solana-icon.png";

interface TreasuryData {
  balance: number;
  dailyDeposits: { day: string; amount: number }[];
}

const getNextMonday = () => {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday;
};

const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

export const TreasuryDisplay = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['treasury-data'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<TreasuryData>('get-treasury-data');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const countdown = useCountdown(getNextMonday());
  const balance = data?.balance || 0;
  const totalRewards = balance * 0.1; // Example: 10% of treasury goes to rewards

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div 
            className="rounded-3xl px-6 py-3 cursor-pointer transition-all hover:scale-105"
          >
            <div 
              className="text-xs font-bold mb-1 tracking-wide"
              style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
            >
              Treasury ^
            </div>
            <div 
              className="text-2xl font-bold tracking-tight flex items-center gap-2"
              style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
            >
              {isLoading ? '...' : (
                <>
                  {balance.toFixed(1)}
                  <img src={solanaIcon} alt="SOL" className="w-6 h-6" />
                </>
              )}
            </div>
          </div>
        </HoverCardTrigger>
        
        <HoverCardContent 
          side="top" 
          align="start"
          className="w-[400px] p-0 border-2"
          style={{
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          }}
        >
          <div className="p-6">
            {/* Top Section: Distributing and Member Rewards */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div 
                  className="text-xs font-bold mb-2 tracking-wide"
                  style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
                >
                  Distributing
                </div>
                <div 
                  className="text-sm font-mono"
                  style={{ color: '#a78bfa' }}
                >
                  {countdown.days}d / {countdown.hours}hr / {countdown.minutes}m / {countdown.seconds}s
                </div>
              </div>
              
              <div 
                className="w-px h-12 mx-4"
                style={{ 
                  borderLeft: '1px dotted #a78bfa',
                }}
              />
              
              <div className="flex-1 text-right">
                <div 
                  className="text-xs font-bold mb-2 tracking-wide"
                  style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
                >
                  Member Rewards
                </div>
                <div 
                  className="text-lg font-bold"
                  style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
                >
                  {totalRewards.toFixed(1)} ≡
                </div>
              </div>
            </div>

            {/* Dotted Separator */}
            <div 
              className="w-full h-px mb-6"
              style={{ 
                borderTop: '1px dotted #a78bfa',
              }}
            />

            {/* Bar Chart */}
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dailyDeposits || []}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: '#a78bfa', fontSize: 10, fontFamily: 'Consolas, monospace' }}
                    axisLine={{ stroke: '#a78bfa' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#a78bfa" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};
