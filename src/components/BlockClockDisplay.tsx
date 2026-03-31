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
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const formatBlockNumber = (n: number): string => {
  return n.toLocaleString();
};

const BAR_COUNT = 24;

export const BlockClockDisplay = ({
  currentBlock,
  targetBlock,
  progress,
  timeRemaining,
  blocksRemaining,
  compact = false,
}: BlockClockDisplayProps) => {
  // Compact mode for WaitlistCountdown widget — keep ASCII style
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

  // Full mode — rich card layout matching reference screenshot
  const filledBars = Math.round((progress / 100) * BAR_COUNT);

  return (
    <div className="w-full">
      {/* Header: Title + Percentage */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="font-mono text-sm font-semibold tracking-widest uppercase"
            style={{ color: '#ed565a' }}
          >
            Club Waitlist
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-px h-8" style={{ backgroundColor: 'rgba(237, 86, 90, 0.3)' }} />
          <span
            className="font-mono text-3xl font-bold tabular-nums"
            style={{ color: '#ed565a' }}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <p className="font-mono text-[10px] text-muted-foreground tracking-wide mb-4">
        Signup Opens after 1 Million Solana Blocks
      </p>

      {/* Pill badge — blocks remaining */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className="inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-1 rounded-full border"
          style={{
            color: '#ed565a',
            borderColor: 'rgba(237, 86, 90, 0.3)',
            backgroundColor: 'rgba(237, 86, 90, 0.08)',
          }}
        >
          ↝ {formatBlockNumber(blocksRemaining)} blocks remaining
        </span>
      </div>

      {/* Time estimate */}
      <p className="font-mono text-[10px] text-muted-foreground mb-5">
        ≈ {formatTime(timeRemaining)} until unlock
      </p>

      {/* Vertical bar visualization */}
      <div className="flex items-end gap-[3px] h-16 mb-5">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const isFilled = i < filledBars;
          const barHeight = 30 + Math.sin((i / BAR_COUNT) * Math.PI) * 70;

          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${barHeight}%`,
                backgroundColor: isFilled
                  ? '#ed565a'
                  : 'rgba(237, 86, 90, 0.12)',
                opacity: isFilled ? 0.4 + (i / BAR_COUNT) * 0.6 : 1,
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* Footer: Current / Target block */}
      <div className="flex justify-between font-mono">
        <div>
          <p className="text-[9px] text-muted-foreground tracking-widest uppercase mb-0.5">
            Current Blocktime
          </p>
          <p className="text-xs tabular-nums" style={{ color: '#ed565a' }}>
            {formatBlockNumber(currentBlock)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-muted-foreground tracking-widest uppercase mb-0.5">
            Target Blocktime
          </p>
          <p className="text-xs tabular-nums" style={{ color: '#ed565a' }}>
            {formatBlockNumber(targetBlock)}
          </p>
        </div>
      </div>
    </div>
  );
};
