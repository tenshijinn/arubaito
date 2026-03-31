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
      style={{
        backgroundColor: '#1a0a0b',
        border: '1px solid #ed565a',
        borderRadius: '20px',
        padding: '32px',
      }}
    >
      {/* Top section: two columns */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left column: title + subtitle */}
        <div style={{ flex: 1, borderRight: '1px solid rgba(237,86,90,0.25)', paddingRight: '24px' }}>
          <h3
            style={{
              color: '#ed565a',
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Club Waitlist
          </h3>
          <p
            style={{
              color: 'rgba(237,86,90,0.6)',
              fontSize: '14px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 600,
              marginTop: '8px',
              lineHeight: 1.4,
            }}
          >
            Signup Opens after 1 Million Solana Blocks
          </p>
        </div>

        {/* Right column: percentage + pill + time */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '140px' }}>
          <span
            style={{
              color: '#ed565a',
              fontSize: '52px',
              fontWeight: 700,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              lineHeight: 1,
            }}
          >
            {Math.round(progress)}%
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#ed565a',
              fontSize: '12px',
              padding: '4px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(237,86,90,0.35)',
              backgroundColor: 'rgba(237,86,90,0.1)',
              marginTop: '10px',
            }}
          >
            ↝ {formatBlockNumber(blocksRemaining)} blocks remaining
          </span>

          <p
            style={{
              color: '#ed565a',
              fontSize: '18px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontWeight: 600,
              marginTop: '10px',
            }}
          >
            ≈ {formatTime(timeRemaining)} until unlock
          </p>
        </div>
      </div>

      {/* Bar visualization */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '3px',
          height: '120px',
          margin: '28px 0',
        }}
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const isFilled = i < filledBars;
          // Tall on left, short on right — descending curve
          const heightPct = 95 - (i / (BAR_COUNT - 1)) * 55;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${heightPct}%`,
                borderRadius: '4px',
                backgroundColor: isFilled
                  ? '#ed565a'
                  : 'rgba(237,86,90,0.18)',
                opacity: isFilled
                  ? 1 - (i / Math.max(filledBars, 1)) * 0.3
                  : 1,
              }}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '20px',
          borderTop: '1px solid rgba(237,86,90,0.15)',
        }}
      >
        <div>
          <p
            style={{
              color: 'rgba(237,86,90,0.45)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Current Blocktime
          </p>
          <p
            style={{
              color: '#ed565a',
              fontSize: '22px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatBlockNumber(currentBlock)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              color: 'rgba(237,86,90,0.45)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Target Blocktime
          </p>
          <p
            style={{
              color: '#ed565a',
              fontSize: '22px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatBlockNumber(targetBlock)}
          </p>
        </div>
      </div>
    </div>
  );
};
