import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Lock, Award, Target, MessageSquare } from "lucide-react";
import { INK, CREAM, ACCENT, MUTED, BORDER, DISPLAY, MONO, cardStyle, labelStyle } from "@/lib/aesthetics";

interface Category { id: string; name: string; reason: string; final_score: number; weight: number }

interface FeedbackCollapsibleProps {
  topStrengths: string[];
  recommendedImprovements: string[];
  categories: Category[];
  generalFeedback?: string;
}

export const FeedbackCollapsible = ({ topStrengths, recommendedImprovements, categories, generalFeedback }: FeedbackCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ ...cardStyle(), borderStyle: "dashed" }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-3">
            <Lock className="h-3.5 w-3.5" style={{ color: MUTED }} />
            <span style={{ fontFamily: DISPLAY, fontSize: 14, color: INK }}>Improvement Recommendations</span>
            <span className="px-2 py-0.5 rounded-full" style={{ border: `1px solid ${BORDER}`, fontFamily: MONO, fontSize: 10, color: MUTED }}>Private</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" style={{ color: MUTED }} /> : <ChevronDown className="h-4 w-4" style={{ color: MUTED }} />}
        </CollapsibleTrigger>

        <CollapsibleContent style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" style={{ color: INK }} />
                <span style={labelStyle()}>Top Strengths</span>
              </div>
              <ul className="space-y-2">
                {topStrengths.map((s, i) => (
                  <li key={i} className="flex gap-3" style={{ fontFamily: MONO, fontSize: 12 }}>
                    <span style={{ color: INK, fontFamily: DISPLAY }}>{i + 1}.</span>
                    <span style={{ color: MUTED }}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: ACCENT }} />
                <span style={labelStyle()}>Areas to Improve</span>
              </div>
              <ul className="space-y-2">
                {recommendedImprovements.map((s, i) => (
                  <li key={i} className="flex gap-3" style={{ fontFamily: MONO, fontSize: 12 }}>
                    <span style={{ color: ACCENT, fontFamily: DISPLAY }}>{i + 1}.</span>
                    <span style={{ color: MUTED }}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: INK }} />
                <span style={labelStyle()}>Category Feedback</span>
              </div>
              <div className="space-y-3">
                {categories.map((c) => (
                  <div key={c.id} className="p-3 rounded-[12px]" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: MONO, fontSize: 12, color: INK }}>{c.name}</span>
                      <span className="px-2 py-0.5 rounded-full" style={{ border: `1px solid ${BORDER}`, fontFamily: MONO, fontSize: 10, color: MUTED }}>
                        {c.final_score.toFixed(1)}/{c.weight}
                      </span>
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>{c.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {generalFeedback && (
              <div className="p-4 rounded-[12px]" style={{ background: INK, border: `1.5px solid ${INK}` }}>
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(239,226,201,0.55)", marginBottom: 8 }}>General Feedback</p>
                <p style={{ fontFamily: MONO, fontSize: 12, color: CREAM, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{generalFeedback}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
