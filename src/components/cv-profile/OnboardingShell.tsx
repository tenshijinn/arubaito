import { ReactNode } from "react";
import { INK, CREAM, MUTED, BORDER, DISPLAY, MONO, cardStyle } from "@/lib/aesthetics";

interface OnboardingShellProps {
  step: 1 | 2 | 3;
  total?: number;
  title: string;
  children: ReactNode;
}

export const OnboardingShell = ({ step, total = 3, title, children }: OnboardingShellProps) => {
  const pct = Math.round((step / total) * 100);

  return (
    <div style={cardStyle()} className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: DISPLAY, fontSize: 24, color: INK, letterSpacing: "0.02em" }}>
          {`Step ${step}/${total}`}
        </h2>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 24, color: INK, letterSpacing: "0.02em" }}>
          {title}
        </h2>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-7 rounded-full mb-10 overflow-hidden"
        style={{ background: CREAM, border: `1.5px solid ${INK}` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: INK }}
        />
      </div>

      {/* Step label (subtle) */}
      <div className="sr-only" style={{ fontFamily: MONO, color: MUTED }}>{`${pct}% complete`}</div>

      {children}
    </div>
  );
};
