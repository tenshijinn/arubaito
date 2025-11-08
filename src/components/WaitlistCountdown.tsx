import { CountdownTimer } from "./CountdownTimer";

export const WaitlistCountdown = () => {
  // Calculate the first day of next month
  const getNextMonthFirstDay = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return nextMonth;
  };

  return (
    <div>
      <div>
        <h3 
          className="text-[8px] font-bold mb-0.5 tracking-wide"
          style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
        >
          Club Member Waitlist
        </h3>
        <div style={{ color: '#ed565a', fontSize: '0.75rem' }}>
          <CountdownTimer targetDate={getNextMonthFirstDay()} />
        </div>
      </div>
    </div>
  );
};
