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
    refetchInterval: 30000,
  });

  const countdown = useCountdown(getNextMonday());
  const balance = data?.balance || 0;
  const totalRewards = balance * 0.1;

  return (
    <div className="fixed bottom-6 left-6 z-50" style={{ width: '20vw' }}>
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div 
            className="rounded-3xl px-6 py-3 cursor-pointer"
          >
            <div 
              className="text-xs font-bold mb-1 tracking-wide"
              style={{ color: '#a78bfa', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Treasury ^
            </div>
            <div 
              className="text-2xl font-bold tracking-tight flex items-center gap-2"
              style={{ color: '#a78bfa', fontFamily: 'IBM Plex Mono, monospace' }}
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
          className="p-0 border-[3px] rounded-[40px]"
          style={{
            width: '20vw',
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            transition: 'none',
            animation: 'none',
          }}
        >
          <div className="p-6">
            {/* Top Section: Distributing and Member Rewards */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div 
                  className="text-sm font-bold mb-2"
                  style={{ color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  Distributing
                </div>
                <div 
                  className="text-2xl font-bold leading-tight"
                  style={{ color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {countdown.days}d / {countdown.hours}hr<br />
                  {countdown.minutes}m / {countdown.seconds}s
                </div>
              </div>
              
              <div className="flex-1 text-right">
                <div 
                  className="text-sm font-bold mb-2"
                  style={{ color: '#a78bfa', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  Member Rewards
                </div>
                <div 
                  className="text-4xl font-bold flex items-center justify-end gap-2"
                  style={{ color: '#a78bfa', fontFamily: 'IBM Plex Mono, monospace' }}
                >
                  {totalRewards.toFixed(1)}
                  <img src={solanaIcon} alt="SOL" className="w-12 h-12" />
                </div>
              </div>
            </div>

            {/* Dotted Separator */}
            <div 
              className="w-full h-px mb-6"
              style={{ 
                borderTop: '2px dotted #a78bfa',
              }}
            />

            {/* Bar Chart */}
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dailyDeposits || []} barGap={4}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: '#a78bfa', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#a78bfa" 
                    radius={[8, 8, 8, 8]}
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
