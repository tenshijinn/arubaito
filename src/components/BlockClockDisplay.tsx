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

export const BlockClockDisplay = ({
  currentBlock,
  targetBlock,
  progress,
  timeRemaining,
  blocksRemaining,
  compact = false,
}: BlockClockDisplayProps) => {
  const barWidth = compact ? 16 : 24;
  const filled = Math.round((progress / 100) * barWidth);
  const empty = barWidth - filled;
  const progressBar = "█".repeat(filled) + "░".repeat(empty);

  if (compact) {
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

  return (
    <div
      className="font-mono text-xs leading-relaxed p-4 rounded-lg border"
      style={{
        color: '#ed565a',
        borderColor: 'rgba(237, 86, 90, 0.3)',
        backgroundColor: 'rgba(237, 86, 90, 0.05)',
      }}
    >
      <div className="mb-2 text-[10px] opacity-60 tracking-widest uppercase">
        ◆ Solana Block Clock
      </div>

      <div className="mb-1">
        <span className="opacity-60">CURRENT </span>
        <span>{formatBlockNumber(currentBlock)}</span>
      </div>
      <div className="mb-2">
        <span className="opacity-60">TARGET  </span>
        <span>{formatBlockNumber(targetBlock)}</span>
      </div>

      <div className="mb-1">
        [{progressBar}] {progress.toFixed(1)}%
      </div>

      <div className="mt-2 text-[10px] opacity-70">
        {formatBlockNumber(blocksRemaining)} blocks remaining
      </div>
      <div className="text-[10px] opacity-70">
        ≈ {formatTime(timeRemaining)} until unlock
      </div>
    </div>
  );
};
