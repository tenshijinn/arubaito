import { useBlockClock } from "@/hooks/useBlockClock";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const INK = "#181818";
const MUTED = "rgba(24,24,24,0.55)";
const BORDER = "rgba(24,24,24,0.18)";
const ACCENT = "#ed565a";
const CREAM = "#faf1e1";
const MONO = "'Consolas', 'IBM Plex Mono', monospace";

const formatTime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const Bars = ({ progress }: { progress: number }) => {
  const count = 20;
  const filled = Math.round((progress / 100) * count);
  return (
    <div style={{ display: "flex", gap: 2, height: 12, marginBottom: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 2,
            background: i < filled ? INK : "transparent",
            border: `1px solid ${i < filled ? INK : BORDER}`,
          }}
        />
      ))}
    </div>
  );
};

const SignupTimer = ({ seconds }: { seconds: number }) => {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const i = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(i);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const c = blink ? ":" : " ";
  return (
    <div style={{ fontFamily: MONO, fontSize: 11, color: ACCENT }}>
      {pad(h)}{c}{pad(m)}{c}{pad(s)}
    </div>
  );
};

export const WaitlistCountdownAesthetic = () => {
  const { state, timeRemaining, progress, loading, signupWindowRemaining } = useBlockClock();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="text-right">
        <div className="uppercase tracking-[0.18em]" style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}>
          Club Waitlist
        </div>
        <div style={{ color: MUTED, fontFamily: MONO, fontSize: 11 }}>Loading...</div>
      </div>
    );
  }

  if (state === "closed") {
    return (
      <div className="text-right">
        <div className="uppercase tracking-[0.18em]" style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}>
          Club Waitlist
        </div>
        <div style={{ color: MUTED, fontFamily: MONO, fontSize: 11 }}>Signup closed</div>
      </div>
    );
  }

  if (state === "open") {
    return (
      <div className="text-right">
        <div className="uppercase tracking-[0.18em] mb-1" style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}>
          Club Signup Open
        </div>
        <SignupTimer seconds={signupWindowRemaining} />
        <button
          onClick={() => navigate("/arubaito")}
          className="mt-1 px-3 py-1 rounded-full transition-opacity hover:opacity-80"
          style={{ background: ACCENT, color: CREAM, fontFamily: MONO, fontSize: 10 }}
        >
          Signup
        </button>
      </div>
    );
  }

  return (
    <div className="text-right" style={{ minWidth: 160 }}>
      <div className="uppercase tracking-[0.18em] mb-1" style={{ color: MUTED, fontFamily: MONO, fontSize: 10 }}>
        Club Waitlist
      </div>
      <Bars progress={progress} />
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
        style={{ border: `1px solid ${BORDER}`, color: INK, fontFamily: MONO, fontSize: 9 }}
      >
        <span>{Math.round(progress)}%</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>≈ {formatTime(timeRemaining)}</span>
      </div>
    </div>
  );
};
