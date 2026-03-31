import { useState } from 'react';

interface BlockClockDisplayProps {
  currentBlock: number;
  targetBlock: number;
  progress: number;
  timeRemaining: number;
  blocksRemaining: number;
  compact?: boolean;
}

const formatTime = (totalSeconds: number): string => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatBlockNumber = (n: number): string => {
  return n.toLocaleString();
};

const BAR_COUNT = 36;

export const BlockClockDisplay = ({
  currentBlock,
  targetBlock,
  progress,
  timeRemaining,
  blocksRemaining,
  compact = false,
}: BlockClockDisplayProps) => {
  const [showBlockDetails, setShowBlockDetails] = useState(false);

  if (compact) {
    const barWidth = 16;
    const filled = Math.round((progress / 100) * barWidth);
    const empty = barWidth - filled;
    const progressBar = "█".repeat(filled) + "░".repeat(empty);

    return (
      <div className="font-mono text-[9px] leading-tight" style={{ color: '#ed565a' }}>
        <div className="flex items-center gap-1">
          <span className="opacity-60">BLK</span>
          <span>[{progressBar}]</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="opacity-70 mt-0.5">
          ≈ {formatTime(timeRemaining)}
        </div>
      </div>
    );
  }

  const filledBars = Math.round((progress / 100) * BAR_COUNT);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '6px' }}>
        <h3 className="text-2xl font-bold text-center mb-2 font-display" style={{ color: '#ed565a', margin: '0 0 2px 0' }}>
          Non-Members Club Waitlist
        </h3>
        <p className="text-sm text-center" style={{ color: 'rgba(237,86,90,0.55)', margin: 0 }}>
          Signup Opens after 1 Million Solana Blocks
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(237,86,90,0.2)', marginBottom: '12px' }} />

      {/* Percentage + time estimate row */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: '#ed565a', fontSize: '42px', fontWeight: 700, lineHeight: 1 }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Combined pill: blocks remaining | time remaining */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: '#ed565a',
            fontSize: '11px',
            padding: '3px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(237,86,90,0.3)',
          }}
        >
          ↝ {formatBlockNumber(blocksRemaining)} blocks remaining <span style={{ opacity: 0.4 }}>|</span> ≈ {formatTime(timeRemaining)}
        </span>
      </div>

      {/* Bar visualization — hover to show block details */}
      <div
        style={{ display: 'flex', alignItems: 'stretch', gap: '3px', height: '56px', marginBottom: '12px', cursor: 'pointer', position: 'relative' }}
        onMouseEnter={() => setShowBlockDetails(true)}
        onMouseLeave={() => setShowBlockDetails(false)}
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const isFilled = i < filledBars;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: '4px',
                backgroundColor: isFilled ? '#ed565a' : 'rgba(237,86,90,0.15)',
                opacity: isFilled ? 1 - (i / Math.max(filledBars, 1)) * 0.25 : 1,
              }}
            />
          );
        })}
      </div>

      {/* Block details — visible on hover */}
      {showBlockDetails && (
        <div style={{ display: 'flex', justifyContent: 'space-between', animation: 'fadeIn 0.15s ease-in' }}>
          <div>
            <p style={{ color: 'rgba(237,86,90,0.4)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Current Blocktime
            </p>
            <p style={{ color: '#ed565a', fontSize: '18px', fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {formatBlockNumber(currentBlock)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'rgba(237,86,90,0.4)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Target Blocktime
            </p>
            <p style={{ color: '#ed565a', fontSize: '18px', fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {formatBlockNumber(targetBlock)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
