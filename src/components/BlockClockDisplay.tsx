import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BlockClockDisplayProps {
  currentBlock: number;
  targetBlock: number;
  progress: number;
  timeRemaining: number;
  blocksRemaining: number;
  compact?: boolean;
  onReminderSubmit?: (email: string) => Promise<void>;
  reminderSubmitted?: boolean;
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
  onReminderSubmit,
  reminderSubmitted = false,
}: BlockClockDisplayProps) => {
  const [showBlockDetails, setShowBlockDetails] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReminder = async () => {
    if (!reminderEmail || !onReminderSubmit) return;
    setSubmitting(true);
    try {
      await onReminderSubmit(reminderEmail);
      setReminderEmail('');
      setShowReminderForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    const compactBarCount = 20;
    const compactFilled = Math.round((progress / 100) * compactBarCount);

    return (
      <div style={{ color: '#ed565a' }}>
        <div className="text-[10px] font-semibold mb-1" style={{ letterSpacing: '0.02em' }}>
          Club Waitlist
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '12px', marginBottom: '4px' }}>
          {Array.from({ length: compactBarCount }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: '2px',
                backgroundColor: i < compactFilled ? '#ed565a' : 'rgba(237,86,90,0.15)',
              }}
            />
          ))}
        </div>
        <div
          className="text-[8px] inline-flex items-center gap-1"
          style={{
            padding: '1px 6px',
            borderRadius: '999px',
            border: '1px solid rgba(237,86,90,0.3)',
          }}
        >
          <span>{Math.round(progress)}%</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>≈ {formatTime(timeRemaining)}</span>
        </div>
      </div>
    );
  }

  const filledBars = Math.round((progress / 100) * BAR_COUNT);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '6px' }}>
        <h3 className="text-2xl font-bold text-center mb-2 font-display" style={{ color: '#ed565a', margin: '0 0 6px 0' }}>
          Non-Members Club Waitlist
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(237,86,90,0.2)', marginTop: '14px', marginBottom: '14px' }} />

      {/* Bar visualization + percentage in single row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          cursor: 'pointer',
          position: 'relative',
        }}
        onMouseEnter={() => setShowBlockDetails(true)}
        onMouseLeave={() => setShowBlockDetails(false)}
      >
        {/* Progress bars */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '3px', height: '56px', flex: 1 }}>
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
        {/* Percentage */}
        <span style={{ color: '#ed565a', fontSize: '28px', fontWeight: 700, lineHeight: 1, minWidth: '60px', textAlign: 'right' }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Block details — visible on hover */}
      {showBlockDetails && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', animation: 'fadeIn 0.15s ease-in' }}>
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

      {/* Send Reminder */}
      {onReminderSubmit && (
        <div>
          {reminderSubmitted ? (
            <p style={{ color: '#ed565a', fontSize: '12px', textAlign: 'center', opacity: 0.7 }}>
              ✓ Reminder set — we'll email you when signup opens
            </p>
          ) : !showReminderForm ? (
            <button
              onClick={() => setShowReminderForm(true)}
              style={{
                width: '100%',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(237,86,90,0.3)',
                backgroundColor: 'transparent',
                color: '#ed565a',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(237,86,90,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              🔔 Send Reminder
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', animation: 'fadeIn 0.15s ease-in' }}>
              <Input
                type="email"
                placeholder="your@email.com"
                value={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.value)}
                className="h-9 rounded-lg text-sm flex-1"
                style={{ borderColor: 'rgba(237,86,90,0.3)' }}
                onKeyDown={(e) => e.key === 'Enter' && handleReminder()}
              />
              <Button
                onClick={handleReminder}
                disabled={!reminderEmail || submitting}
                size="sm"
                className="h-9 rounded-lg px-4"
                style={{
                  backgroundColor: '#ed565a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                }}
              >
                {submitting ? '...' : 'Send'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
