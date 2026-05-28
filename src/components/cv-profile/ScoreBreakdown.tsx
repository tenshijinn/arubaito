import { BarChart3 } from "lucide-react";
import { INK, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

interface Category {
  id: string;
  name: string;
  weight: number;
  qualitative_score: number;
  quantitative_score: number;
  final_score: number;
  reason: string;
  examples_found?: string[];
}

interface ScoreBreakdownProps { categories: Category[] }

export const ScoreBreakdown = ({ categories }: ScoreBreakdownProps) => {
  const getPercentage = (score: number, weight: number) => Math.round((score / weight) * 100);

  return (
    <div style={cardStyle()} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"03 / Breakdown"}</span>
        <span style={labelStyle()}>{"Categories"}</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-4 w-4" style={{ color: INK }} />
        <h3 style={{ fontFamily: DISPLAY, fontSize: 16, color: INK }}>Score Breakdown</h3>
      </div>

      <div className="space-y-5">
        {categories.map((category) => {
          const percentage = getPercentage(category.final_score, category.weight);
          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: MONO, fontSize: 12, color: INK }}>{category.name}</span>
                <span className="px-2 py-0.5 rounded-full" style={{ border: `1px solid ${BORDER}`, fontFamily: MONO, fontSize: 10, color: MUTED }}>
                  {category.final_score.toFixed(1)} / {category.weight}
                </span>
              </div>

              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(24,24,24,0.08)" }}>
                <div className="absolute top-0 left-0 h-full transition-all" style={{ width: `${percentage}%`, background: ACCENT }} />
              </div>

              {category.examples_found && category.examples_found.length > 0 && (
                <div className="mt-2 p-3 rounded-[12px]" style={{ border: `1px solid ${BORDER}` }}>
                  <p style={{ ...labelStyle(), marginBottom: 6 }}>Evidence Found</p>
                  <ul className="space-y-1">
                    {category.examples_found.slice(0, 2).map((example, i) => (
                      <li key={i} style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>• {example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
