/* ...snip... */
<HoverCardContent 
  side="top" 
  align="start"
  className="w-[300px] p-0 border-[1px] rounded-[40px]"  // widen a bit
  style={{ borderColor: '#a78bfa', backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
>
  <div className="p-3">
    {/* Top Section: Distributing and Member Rewards */}
    <div className="grid grid-cols-2 gap-2 mb-2 items-start">
      {/* Left: Distributing */}
      <div>
        <div
          className="text-[8px] font-bold mb-1 tracking-wide"
          style={{ color: '#ffffff', fontFamily: 'Consolas, monospace' }}
        >
          Distributing
        </div>
        <div
          className="text-[10px] font-bold leading-tight"
          style={{ color: '#ffffff', fontFamily: 'Consolas, monospace' }}
        >
          {countdown.days}d / {countdown.hours}hr<br />
          {countdown.minutes}m / {countdown.seconds}s
        </div>
      </div>

      {/* Right: Member Rewards */}
      <div className="text-right">
        <div
          className="text-[8px] font-bold mb-1 tracking-wide"
          style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
        >
          Member Rewards
        </div>
        <div
          className="text-xs font-bold inline-flex items-center gap-1 leading-none"
          style={{ color: '#a78bfa', fontFamily: 'Consolas, monospace' }}
        >
          {totalRewards.toFixed(1)}
          <img src={solanaIcon} alt="SOL" className="w-3 h-3" />
        </div>
      </div>
    </div>

    {/* Dotted Separator */}
    <div className="w-full h-px mb-2" style={{ borderTop: '1px dotted #a78bfa' }} />

    {/* Bar Chart */}
    <div className="h-14">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data?.dailyDeposits || []}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <XAxis
            dataKey="day"
            tick={{ fill: '#a78bfa', fontSize: 6, fontFamily: 'Consolas, monospace' }}
            tickMargin={6}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="amount" fill="#a78bfa" radius={[3, 3, 3, 3]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
</HoverCardContent>
/* ...snip... */
