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

const BAR_COUNT = 40;

export const BlockClockDisplay = ({
  currentBlock,
  targetBlock,
  progress,
  timeRemaining,
  blocksRemaining,
  compact = false,
}: BlockClockDisplayProps) => {
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
    <div
      className="w-full rounded-2xl p-6 md:p-8"
      style={{
        backgroundColor: 'rgba(237, 86, 90, 0.06)',
        border: '1px solid rgba(237, 86, 90, 0.35)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-1">
        {/* Left: title + subtitle */}
        <div className="flex-1">
          <h3
            className="text-2xl md:text-3xl font-bold"
            style={{ color: '#ed565a', fontFamily: 'Georgia, serif' }}
          >
            Club Waitlist
          </h3>
          <p
            className="text-sm md:text-base mt-1"
            style={{ color: 'rgba(237, 86, 90, 0.7)' }}
          >
            Signup Opens after 1 Million Solana Blocks
          </p>
        </div>

        {/* Divider */}
        <div
          className="mx-4 md:mx-6 self-stretch"
          style={{
            width: '1px',
            backgroundColor: 'rgba(237, 86, 90, 0.25)',
            minHeight: '60px',
          }}
        />

        {/* Right: percentage + pill + time */}
        <div className="flex flex-col items-end">
          <span
            className="text-4xl md:text-5xl font-bold italic leading-none"
            style={{ color: '#ed565a', fontFamily: 'Georgia, serif' }}
          >
            {Math.round(progress)}%
          </span>

          {/* Pill badge */}
          <span
            className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full mt-2"
            style={{
              color: '#ed565a',
              border: '1px solid rgba(237, 86, 90, 0.3)',
              backgroundColor: 'rgba(237, 86, 90, 0.1)',
            }}
          >
            ↝ {formatBlockNumber(blocksRemaining)} blocks remaining
          </span>

          {/* Time estimate */}
          <p
            className="text-base md:text-lg font-semibold italic mt-2"
            style={{ color: '#ed565a', fontFamily: 'Georgia, serif' }}
          >
            ≈ {formatTime(timeRemaining)} until unlock
          </p>
        </div>
      </div>

      {/* Vertical bar visualization */}
      <div className="flex items-end gap-[2px] h-24 md:h-32 my-6">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const isFilled = i < filledBars;
          // Bars are taller on the left, shorter on the right
          const barHeight = 100 - (i / BAR_COUNT) * 60;

          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${barHeight}%`,
                backgroundColor: isFilled
                  ? '#ed565a'
                  : 'rgba(237, 86, 90, 0.15)',
                opacity: isFilled ? 0.6 + (1 - i / filledBars) * 0.4 : 1,
              }}
            />
          );
        })}
      </div>

      {/* Footer: Current / Target block */}
      <div
        className="flex justify-between pt-4"
        style={{ borderTop: '1px solid rgba(237, 86, 90, 0.15)' }}
      >
        <div>
          <p
            className="text-[10px] tracking-widest uppercase mb-1"
            style={{ color: 'rgba(237, 86, 90, 0.5)' }}
          >
            Current Blocktime
          </p>
          <p
            className="text-lg md:text-xl font-semibold tabular-nums"
            style={{ color: '#ed565a' }}
          >
            {formatBlockNumber(currentBlock)}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-[10px] tracking-widest uppercase mb-1"
            style={{ color: 'rgba(237, 86, 90, 0.5)' }}
          >
            Target Blocktime
          </p>
          <p
            className="text-lg md:text-xl font-semibold tabular-nums"
            style={{ color: '#ed565a' }}
          >
            {formatBlockNumber(targetBlock)}
          </p>
        </div>
      </div>
    </div>
  );
};
