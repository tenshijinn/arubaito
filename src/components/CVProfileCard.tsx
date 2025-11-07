import { FileCheck, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CVProfileCardProps {
  id: string;
  fileName: string;
  overallScore: number;
  createdAt: string;
  bluechipVerified?: boolean;
  onClick: (id: string) => void;
}

export const CVProfileCard = ({
  id,
  fileName,
  overallScore,
  createdAt,
  bluechipVerified = false,
  onClick,
}: CVProfileCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "hsl(var(--success))";
    if (score >= 70) return "hsl(var(--primary))";
    if (score >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group"
      onClick={() => onClick(id)}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header with icon and badges */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {fileName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {bluechipVerified && (
              <Badge variant="secondary" className="shrink-0 ml-2">
                <Award className="h-3 w-3 mr-1" />
                Bluechip
              </Badge>
            )}
          </div>

          {/* Score display */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
              <p className="text-xs text-muted-foreground">{getScoreLabel(overallScore)}</p>
            </div>
            <div 
              className="text-4xl font-bold tabular-nums"
              style={{ color: getScoreColor(overallScore) }}
            >
              {overallScore}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
