import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Lock, Award, Target, MessageSquare } from "lucide-react";

interface Category {
  id: string;
  name: string;
  reason: string;
  final_score: number;
  weight: number;
}

interface FeedbackCollapsibleProps {
  topStrengths: string[];
  recommendedImprovements: string[];
  categories: Category[];
  generalFeedback?: string;
}

export const FeedbackCollapsible = ({
  topStrengths,
  recommendedImprovements,
  categories,
  generalFeedback,
}: FeedbackCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors rounded-t-card">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">
              Improvement Recommendations
            </span>
            <Badge variant="outline" className="text-xs">
              Private
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border/50">
          <div className="p-6 space-y-6">
            {/* Top Strengths */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold text-sm">Top Strengths</h4>
              </div>
              <ul className="space-y-2">
                {topStrengths.map((strength, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-green-500 font-bold">{i + 1}.</span>
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Improvements */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-500" />
                <h4 className="font-semibold text-sm">Areas to Improve</h4>
              </div>
              <ul className="space-y-2">
                {recommendedImprovements.map((improvement, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-yellow-500 font-bold">{i + 1}.</span>
                    <span className="text-muted-foreground">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Category-Specific Feedback */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-sm">Category Feedback</h4>
              </div>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div 
                    key={category.id} 
                    className="p-3 bg-muted/30 rounded border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-xs">{category.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {category.final_score.toFixed(1)}/{category.weight}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {category.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* General Feedback */}
            {generalFeedback && (
              <div className="p-4 bg-secondary/50 rounded border border-border/50">
                <h4 className="font-semibold text-sm mb-2">General Feedback</h4>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {generalFeedback}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
