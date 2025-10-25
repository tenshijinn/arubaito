import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CVUploader } from "@/components/CVUploader";
import { CVAnalysis } from "@/components/CVAnalysis";
import { Auth } from "@/components/Auth";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, LogOut, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CountdownTimer } from "@/components/CountdownTimer";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchRecentAnalyses(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRecentAnalyses(session.user.id);
      } else {
        setRecentAnalyses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRecentAnalyses = async (userId: string) => {
    const { data, error } = await supabase
      .from('cv_analyses')
      .select('id, file_name, overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentAnalyses(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentAnalysisId(null);
    setRecentAnalyses([]);
  };

  const handleAnalysisComplete = (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
    if (user) {
      fetchRecentAnalyses(user.id);
    }
  };

  const handleNewAnalysis = () => {
    setCurrentAnalysisId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Private Membership Web3 Jobs Community</h1>
                <p className="text-sm text-muted-foreground">AI-Powered CV Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentAnalysisId && (
                <Button variant="outline" onClick={handleNewAnalysis}>
                  New Analysis
                </Button>
              )}
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {currentAnalysisId ? (
            <CVAnalysis analysisId={currentAnalysisId} />
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-2xl font-bold text-foreground">
                  New Member Onboarding
                </h2>
                <div className="text-lg text-muted-foreground">
                  <CountdownTimer targetDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
                </div>
              </div>

              <CVUploader onAnalysisComplete={handleAnalysisComplete} />

              {/* Recent Analyses */}
              {recentAnalyses.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      <h3 className="text-lg font-semibold text-foreground">Recent Analyses</h3>
                    </div>
                    <div className="space-y-2">
                      {recentAnalyses.map((analysis) => (
                        <button
                          key={analysis.id}
                          onClick={() => setCurrentAnalysisId(analysis.id)}
                          className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-medium text-foreground">{analysis.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-2xl font-bold" 
                               style={{ color: analysis.overall_score >= 70 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                            {analysis.overall_score}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
