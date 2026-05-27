import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import solanaIcon from "@/assets/solana-icon.png";
import { useIsMobile } from "@/hooks/use-mobile";

interface TreasuryData {
  balance: number;
  dailyDeposits: { day: string; amount: number }[];
}

const INK = "#181818";
const PAPER = "#f5ead7";
const SURFACE = "#efe2c9";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";
const ACCENT = "#ed565a";
const MONO = "'Consolas', 'IBM Plex Mono', monospace";

const getNextMonday = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const days = day === 0 ? 1 : 8 - day;
  const m = new Date(now);
  m.setUTCDate(now.getUTCDate() + days);
  m.setUTCHours(0, 0, 0, 0);
  return m;
};

const useCountdown = (targetDate: Date) => {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const d = targetDate.getTime() - Date.now();
      if (d > 0) {
        setT({
          days: Math.floor(d / 86400000),
          hours: Math.floor((d % 86400000) / 3600000),
          minutes: Math.floor((d % 3600000) / 60000),
          seconds: Math.floor((d % 60000) / 1000),
        });
      }
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [targetDate]);
  return t;
};

export const TreasuryDisplayAesthetic = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["treasury-data"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<TreasuryData>("get-treasury-data");
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
  const countdown = useCountdown(getNextMonday());
  const balance = data?.balance || 0;
  const totalRewards = balance * 0.1;

  return (
    <HoverCard openDelay={0} closeDelay={100} {...(isMobile ? { open, onOpenChange: setOpen } : {})}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer" onClick={() => isMobile && setOpen(!open)}>
          <div
            className="uppercase tracking-[0.18em] mb-0.5"
            style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}
          >
            Treasury ^
          </div>
          <div
            className="text-2xl font-bold tracking-tight flex items-center gap-1"
            style={{ color: INK, fontFamily: MONO }}
          >
            {isLoading ? "..." : (
              <>
                {balance.toFixed(1)}
                <img src={solanaIcon} alt="SOL" className="w-4 h-4" style={{ filter: "grayscale(1) brightness(0.2)" }} />
              </>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="w-[calc(100vw-2rem)] md:w-[420px] p-0 rounded-[20px] shadow-none"
        style={{ background: PAPER, border: `1.5px solid ${BORDER}`, boxShadow: "none" }}
      >
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:justify-between items-start mb-4 gap-3">
            <div>
              <div className="uppercase tracking-[0.18em] mb-1" style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}>
                Distributing
              </div>
              <div style={{ color: INK, fontFamily: MONO, fontSize: 16, lineHeight: 1.4 }}>
                {countdown.days}d / {countdown.hours}hr<br />
                {countdown.minutes}m / {countdown.seconds}s
              </div>
            </div>
            <div className="md:text-right">
              <div className="uppercase tracking-[0.18em] mb-1" style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}>
                Member Rewards
              </div>
              <div className="text-3xl font-bold flex items-center md:justify-end gap-1.5" style={{ color: ACCENT, fontFamily: MONO }}>
                {totalRewards.toFixed(1)}
                <img src={solanaIcon} alt="SOL" className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="w-full h-px mb-4" style={{ background: BORDER }} />
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyDeposits || []} barCategoryGap="20%">
                <XAxis
                  dataKey="day"
                  tick={{ fill: MUTED, fontSize: 11, fontFamily: MONO }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <Bar dataKey="amount" fill={INK} radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
