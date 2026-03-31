import { useEffect, useState } from "react";

interface BlockClockTimerProps {
  secondsRemaining: number;
  compact?: boolean;
}

export const BlockClockTimer = ({ secondsRemaining, compact = false }: BlockClockTimerProps) => {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const colon = blink ? ":" : " ";

  if (compact) {
    return (
      <div className="font-mono text-[9px] leading-tight" style={{ color: '#ed565a' }}>
        <span>
          {pad(hours)}{colon}{pad(minutes)}{colon}{pad(seconds)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="font-mono text-center p-4 rounded-lg border"
      style={{
        color: '#ed565a',
        borderColor: 'rgba(237, 86, 90, 0.3)',
        backgroundColor: 'rgba(237, 86, 90, 0.05)',
      }}
    >
      <div className="text-[10px] opacity-60 tracking-widest uppercase mb-2">
        ◆ Signup Window Open
      </div>
      <div className="text-3xl tracking-wider">
        {pad(hours)}{colon}{pad(minutes)}{colon}{pad(seconds)}
      </div>
      <div className="text-[10px] opacity-60 mt-2">
        Time remaining to sign up
      </div>
    </div>
  );
};
