import { CountdownTimer } from "./CountdownTimer";

export const WaitlistCountdown = () => {
  // Calculate the first day of next month
  const getNextMonthFirstDay = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return nextMonth;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div 
        className="border-2 rounded-3xl p-6 backdrop-blur-sm"
        style={{
          borderColor: '#ed565a',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <h3 
          className="text-lg font-bold mb-3 tracking-wide"
          style={{ color: '#ed565a', fontFamily: 'Consolas, monospace' }}
        >
          Waitlist [ New Members ]
        </h3>
        <div style={{ color: '#ed565a' }}>
          <CountdownTimer targetDate={getNextMonthFirstDay()} />
        </div>
      </div>
    </div>
  );
};
