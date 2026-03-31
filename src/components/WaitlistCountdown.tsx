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
      <div>
        <h3
          className="text-[8px] font-bold mb-0.5 tracking-wide"
          style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
        >
          Club Waitlist
        </h3>
        <div className="font-mono text-[9px] opacity-60" style={{ color: '#ed565a' }}>
          Signup closed
        </div>
      </div>
    );
  }

  if (state === "open") {
    return (
      <div>
        <h3
          className="text-[8px] font-bold mb-0.5 tracking-wide"
          style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
        >
          Club signup closes in:
        </h3>
        <BlockClockTimer secondsRemaining={signupWindowRemaining} compact />
        <button
          onClick={() => navigate("/arubaito")}
          className="mt-1 font-mono text-[8px] font-bold px-2 py-0.5 rounded border transition-colors"
          style={{
            color: '#ed565a',
            borderColor: 'rgba(237, 86, 90, 0.5)',
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
    <div>
      <h3
        className="text-[8px] font-bold mb-0.5 tracking-wide"
        style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
      >
        Next club signup opens in:
      </h3>
      <BlockClockDisplay
        currentBlock={currentBlock}
        targetBlock={targetBlock}
        progress={progress}
        timeRemaining={timeRemaining}
        blocksRemaining={blocksRemaining}
        compact
      />
    </div>
  );
};
