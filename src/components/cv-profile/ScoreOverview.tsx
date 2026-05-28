import { Award, TrendingUp } from "lucide-react";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

interface ScoreOverviewProps {
  overallScore: number;
  bluechipVerified: boolean;
  bluechipScore: number;
}

export const ScoreOverview = ({ overallScore, bluechipVerified, bluechipScore }: ScoreOverviewProps) => {
  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  return (
    <div style={cardStyle()} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"02 / Score"}</span>
        <span style={labelStyle()}>{"Proof of Talent"}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: INK }} />
            <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>Web3 Proof-of-Talent</h3>
          </div>

          {bluechipVerified && (
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full self-start" style={{ background: INK, color: CREAM, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                <Award className="h-3 w-3" />
                OG Verified
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>OG Score: {bluechipScore}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center px-6 py-4 rounded-[16px]" style={{ border: `1.5px solid ${BORDER}` }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 44, color: INK, lineHeight: 1 }}>{overallScore.toFixed(1)}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 4 }}>out of 100</span>
          <span className="mt-2 px-2 py-0.5 rounded-full" style={{ background: ACCENT, color: CREAM, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {getScoreLabel(overallScore)}
          </span>
        </div>
      </div>
    </div>
  );
};
