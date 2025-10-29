import { useEffect, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import solanaIcon from "@/assets/solana-icon.png";

interface TreasuryData {
  balance: number;
  dailyDeposits: Array<{ day: string; amount: number }>;
}

export const TreasuryDisplay = () => {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const totalRewards = data?.balance || 0;

  useEffect(() => {
    const fetchTreasuryData = async () => {
      try {
        const { data: treasuryData, error } = await supabase.functions.invoke(
          "get-treasury-data"
        );
        if (error) throw error;
        setData(treasuryData);
      } catch (error) {
        console.error("Error fetching treasury data:", error);
      }
    };

    fetchTreasuryData();
    const interval = setInterval(fetchTreasuryData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
      nextSunday.setHours(0, 0, 0, 0);

      const diff = nextSunday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <button className="flex items-center gap-2 cursor-pointer group">
            <img 
              src={solanaIcon} 
              alt="SOL" 
              className="w-8 h-8"
            />
            <span 
              className="text-xl font-bold tracking-wide"
              style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
            >
              {totalRewards.toFixed(1)}
            </span>
          </button>
        </HoverCardTrigger>

        <HoverCardContent 
          side="top" 
          align="start"
          className="w-[135px] p-0 border-[3px] rounded-[40px]"
          style={{ borderColor: '#a78bfa', backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
        >
          <div className="p-1">
            {/* Top Section: Distributing and Member Rewards */}
            <div className="grid grid-cols-2 gap-1 mb-1 items-start">
              {/* Left: Distributing */}
              <div>
                <div
                  className="text-[4px] font-bold mb-0.5 tracking-wide"
                  style={{ color: '#ffffff', fontFamily: 'Consolas, monospace' }}
                >
                  Distributing
                </div>
                <div
                  className="text-[6px] font-bold leading-tight"
                  style={{ color: '#ffffff', fontFamily: 'Consolas, monospace' }}
                >
                  {countdown.days}d / {countdown.hours}hr<br />
                  {countdown.minutes}m / {countdown.seconds}s
                </div>
              </div>

              {/* Right: Member Rewards */}
              <div className="text-right">
                <div
                  className="text-[4px] font-bold mb-0.5 tracking-wide"
                  style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
                >
                  Member Rewards
                </div>
                <div
                  className="text-[8px] font-bold inline-flex items-center gap-0.5 leading-none"
                  style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
                >
                  {totalRewards.toFixed(1)}
                  <img src={solanaIcon} alt="SOL" className="w-2 h-2" />
                </div>
              </div>
            </div>

            {/* Dotted Separator */}
            <div className="w-full h-px mb-1" style={{ borderTop: '1px dotted #a78bfa' }} />

            {/* Bar Chart */}
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.dailyDeposits || []}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#a78bfa', fontSize: 4, fontFamily: 'Consolas, monospace' }}
                    tickMargin={3}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="amount" fill="#a78bfa" radius={[2, 2, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};
