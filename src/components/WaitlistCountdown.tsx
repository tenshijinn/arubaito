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
      <div 
        className="border-2 rounded-3xl p-3 md:p-4 backdrop-blur-sm"
        style={{
          borderColor: '#ed565a',
          backgroundColor: 'transparent',
        }}
      >
        <h3 
          className="text-[10px] md:text-xs font-bold mb-1.5 md:mb-2 tracking-wide"
          style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
        >
          Club Member Waitlist
        </h3>
        <div style={{ color: '#ed565a' }}>
          <CountdownTimer targetDate={getNextMonthFirstDay()} />
        </div>
      </div>
    </div>
  );
};
