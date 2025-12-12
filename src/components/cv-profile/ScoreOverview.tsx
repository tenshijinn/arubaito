import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp } from "lucide-react";

interface ScoreOverviewProps {
  overallScore: number;
  bluechipVerified: boolean;
  bluechipScore: number;
}

export const ScoreOverview = ({
  overallScore,
  bluechipVerified,
  bluechipScore,
}: ScoreOverviewProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-500/10 border-green-500/30";
    if (score >= 70) return "bg-blue-500/10 border-blue-500/30";
    if (score >= 50) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-destructive/10 border-destructive/30";
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Web3 Proof-of-Talent Score</h3>
          </div>
          
          {bluechipVerified && (
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <Badge className="bg-primary/20 text-primary border-primary/30">
                OG Verified
              </Badge>
              <span className="text-sm text-muted-foreground">
                OG Score: {bluechipScore}
              </span>
            </div>
          )}
        </div>

        <div className={`flex flex-col items-center p-6 rounded-lg border ${getScoreBgColor(overallScore)}`}>
          <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground mt-1">out of 100</span>
          <Badge 
            variant="outline" 
            className={`mt-2 ${getScoreColor(overallScore)} border-current`}
          >
            {getScoreLabel(overallScore)}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
