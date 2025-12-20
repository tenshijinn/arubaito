import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";

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

interface ScoreBreakdownProps {
  categories: Category[];
}

export const ScoreBreakdown = ({ categories }: ScoreBreakdownProps) => {
  const getScoreColor = (score: number, weight: number) => {
    const percentage = (score / weight) * 100;
    if (percentage >= 85) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-destructive";
  };

  const getPercentage = (score: number, weight: number) => {
    return Math.round((score / weight) * 100);
  };

  return (
    <Card className="p-6 bg-transparent border-border/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Score Breakdown</h3>
      </div>

      <div className="space-y-5">
        {categories.map((category) => {
          const percentage = getPercentage(category.final_score, category.weight);
          
          return (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{category.name}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {category.final_score.toFixed(1)} / {category.weight}
                </Badge>
              </div>
              
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className="h-3"
                />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getScoreColor(category.final_score, category.weight)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {category.examples_found && category.examples_found.length > 0 && (
                <div className="mt-2 p-3 bg-muted/30 rounded border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Evidence Found:
                  </p>
                  <ul className="text-xs space-y-1">
                    {category.examples_found.slice(0, 2).map((example, i) => (
                      <li key={i} className="text-muted-foreground">• {example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
