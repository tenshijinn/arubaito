import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Target, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CVAnalysisProps {
  analysisId: string;
}

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

interface ScoringDetails {
  total_score: number;
  categories: Category[];
  top_strengths: string[];
  recommended_improvements: string[];
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
  wallet_address: string | null;
  bluechip_verified: boolean;
  bluechip_score: number;
  bluechip_details: any;
  scoring_details?: ScoringDetails;
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
        setAnalysis(data as unknown as Analysis);
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {analysis.bluechip_verified && (
        <Card className="p-6 bg-transparent bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <Award className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                🏅 Bluechip Talent Verified
                <Badge variant="secondary" className="ml-2">
                  Score: {analysis.bluechip_score}
                </Badge>
              </h3>
              {analysis.bluechip_details?.verifications?.map((v: any, i: number) => (
                <p key={i} className="text-sm mb-1">
                  ✓ Early activity on <strong>{v.chain}</strong> ({v.period})
                  - {v.transactions} transactions, earliest: {new Date(v.earliestDate).toLocaleDateString()}
                </p>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Wallet: {analysis.wallet_address}
              </p>
            </div>
          </div>
        </Card>
      )}

      {analysis.scoring_details ? (
        <>
          <Card className="p-6 bg-transparent">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Web3 Proof-of-Talent Score</h2>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {analysis.scoring_details.total_score}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
            </div>

            <div className="space-y-6">
              {analysis.scoring_details.categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{category.name}</h3>
                    <Badge variant="outline">
                      {category.final_score.toFixed(1)}/{category.weight}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-muted-foreground">Qualitative (70%)</span>
                      </div>
                      <Progress 
                        value={category.qualitative_score * 100} 
                        className="h-2"
                      />
                      <span className="text-xs">{(category.qualitative_score * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">Quantitative (30%)</span>
                      </div>
                      <Progress 
                        value={category.quantitative_score * 100} 
                        className="h-2"
                      />
                      <span className="text-xs">{(category.quantitative_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">{category.reason}</p>
                  
                  {category.examples_found && category.examples_found.length > 0 && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-md">
                      <p className="text-xs font-semibold mb-1">Measurable Evidence Found:</p>
                      <ul className="text-xs space-y-1">
                        {category.examples_found.map((example, i) => (
                          <li key={i} className="text-muted-foreground">• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-transparent">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Top Strengths
              </h3>
              <ul className="space-y-2">
                {analysis.scoring_details.top_strengths.map((strength, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-green-600 font-bold">{i + 1}.</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 bg-transparent">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Recommended Improvements
              </h3>
              <ul className="space-y-2">
                {analysis.scoring_details.recommended_improvements.map((improvement, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-orange-600 font-bold">{i + 1}.</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-6 bg-transparent">
          <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
          <Card className="p-4 bg-transparent bg-muted/50">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
              <div className="space-y-2 flex-1">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.feedback}</p>
              </div>
            </div>
          </Card>
        </Card>
      )}
    </div>
  );
};