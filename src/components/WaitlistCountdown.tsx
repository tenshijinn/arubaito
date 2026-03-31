import { useBlockClock } from "@/hooks/useBlockClock";
import { BlockClockDisplay } from "./BlockClockDisplay";
import { BlockClockTimer } from "./BlockClockTimer";
import { useNavigate } from "react-router-dom";

export const WaitlistCountdown = () => {
  const { state, timeRemaining, blocksRemaining, currentBlock, targetBlock, progress, loading, signupWindowRemaining } = useBlockClock();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div>
        <h3
          className="text-[8px] font-bold mb-0.5 tracking-wide"
          style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
        >
          Club Waitlist
        </h3>
        <div className="font-mono text-[9px]" style={{ color: '#ed565a' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (state === "closed") {
    return (
      <div style={{ color: '#ed565a' }}>
        <div className="text-[10px] font-semibold mb-1" style={{ letterSpacing: '0.02em' }}>
          Club Waitlist
        </div>
        <div className="text-[9px] opacity-60">
          Signup closed
        </div>
      </div>
    );
  }

  if (state === "open") {
    return (
      <div style={{ color: '#ed565a' }}>
        <div className="text-[10px] font-semibold mb-1" style={{ letterSpacing: '0.02em' }}>
          Club Signup Open
        </div>
        <BlockClockTimer secondsRemaining={signupWindowRemaining} compact />
        <button
          onClick={() => navigate("/arubaito")}
          className="mt-1 text-[8px] font-bold px-2 py-0.5 rounded transition-colors"
          style={{
            color: '#ed565a',
            border: '1px solid rgba(237, 86, 90, 0.5)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ed565a';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ed565a';
          }}
        >
          Signup
        </button>
      </div>
    );
  }

  // countdown state
  return (
    <BlockClockDisplay
      currentBlock={currentBlock}
      targetBlock={targetBlock}
      progress={progress}
      timeRemaining={timeRemaining}
      blocksRemaining={blocksRemaining}
      compact
    />
  );
};
