import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, FileText, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CVAnalysisProps {
  analysisId: string;
}

interface Analysis {
  overall_score: number;
  content_score: number;
  structure_score: number;
  formatting_score: number;
  keywords_score: number;
  experience_score: number;
  feedback: string;
  file_name: string;
  created_at: string;
}

export const CVAnalysis = ({ analysisId }: CVAnalysisProps) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      const { data, error } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
      } else {
        setAnalysis(data);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading analysis...</div>;
  }

  if (!analysis) {
    return <div className="text-center py-12 text-muted-foreground">Analysis not found</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const categories = [
    { name: 'Content', score: analysis.content_score, max: 20, icon: FileText },
    { name: 'Structure', score: analysis.structure_score, max: 20, icon: TrendingUp },
    { name: 'Formatting', score: analysis.formatting_score, max: 20, icon: Star },
    { name: 'Keywords', score: analysis.keywords_score, max: 20, icon: CheckCircle2 },
    { name: 'Experience', score: analysis.experience_score, max: 20, icon: Star },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overall Score Card */}
      <Card className="border-2" style={{ 
        borderColor: getScoreColor(analysis.overall_score),
        background: 'var(--gradient-hero)',
        color: 'white'
      }}>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-white/80 text-sm font-medium mb-2">Your CV Score</p>
              <h2 className="text-6xl font-bold mb-2">{analysis.overall_score}</h2>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {getScoreLabel(analysis.overall_score)}
              </Badge>
            </div>
            <div className="w-full md:w-64">
              <div className="text-center mb-2 text-white/80 text-sm">
                Overall Performance
              </div>
              <Progress 
                value={analysis.overall_score} 
                className="h-4 bg-white/20"
              />
              <div className="text-center mt-2 text-white/80 text-xs">
                {analysis.overall_score} out of 100
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const percentage = (category.score / category.max) * 100;
              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                      <span className="font-medium text-foreground">{category.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: getScoreColor(percentage) }}>
                      {category.score}/{category.max}
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {analysis.feedback}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
