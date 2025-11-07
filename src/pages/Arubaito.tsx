import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CVUploader } from "@/components/CVUploader";
import { CVAnalysis } from "@/components/CVAnalysis";
import { Auth } from "@/components/Auth";
import { Navigation } from "@/components/Navigation";
import { CVProfileMethodSelector } from "@/components/CVProfileMethodSelector";
import { ManualCVForm } from "@/components/ManualCVForm";
import { LinkedInImport } from "@/components/LinkedInImport";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, LogOut, Plus, Info, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { CVProfilesEmpty } from "@/components/CVProfilesEmpty";
import { CVProfileCard } from "@/components/CVProfileCard";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'form' | 'upload' | 'linkedin' | null>(null);

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
      .select('id, file_name, overall_score, created_at, bluechip_verified')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

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
    setSelectedMethod(null);
  };

  const handleMethodSelect = (method: 'form' | 'upload' | 'linkedin') => {
    setSelectedMethod(method);
  };

  const handleBackToMethodSelector = () => {
    setSelectedMethod(null);
  };

  // Get wallet address from user metadata if available
  const walletAddress = user?.user_metadata?.wallet_address;

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

  // Prioritize Twitter data from user metadata
  const userName = user?.user_metadata?.full_name?.split(' ')[0] 
    || user?.user_metadata?.twitter_username
    || user?.user_metadata?.display_name?.split(' ')[0]
    || user?.user_metadata?.handle 
    || user?.email?.split('@')[0];

  return (
    <div className="min-h-screen">
      <Navigation userName={userName} />
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {currentAnalysisId ? "CV Analysis" : "CV Profile Manager"}
                  </h1>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Manage your CV profiles and get AI-powered analysis. Upload multiple CVs to track improvements over time. Optional: Add wallet address for Bluechip Talent verification.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
              {/* Upload New CV Button or Method Selector */}
              {!selectedMethod ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Your CV Profiles</h2>
                      <p className="text-muted-foreground mt-1">
                        Manage and analyze your curriculum vitae profiles
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      onClick={() => setSelectedMethod('upload')}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Upload New CV
                    </Button>
                  </div>

                  {/* CV Profiles Grid or Empty State */}
                  {recentAnalyses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentAnalyses.map((analysis) => (
                        <CVProfileCard
                          key={analysis.id}
                          id={analysis.id}
                          fileName={analysis.file_name}
                          overallScore={analysis.overall_score}
                          createdAt={analysis.created_at}
                          bluechipVerified={analysis.bluechip_verified}
                          onClick={setCurrentAnalysisId}
                        />
                      ))}
                    </div>
                  ) : (
                    <CVProfilesEmpty onUploadClick={() => setSelectedMethod('upload')} />
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Back to profiles button */}
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToMethodSelector}
                    className="mb-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Profiles
                  </Button>

                  {/* Method Selector or Upload Forms */}
                  {selectedMethod === 'upload' && !selectedMethod.startsWith('form') && !selectedMethod.startsWith('linkedin') ? (
                    <CVProfileMethodSelector 
                      onMethodSelect={handleMethodSelect}
                      walletAddress={walletAddress}
                    />
                  ) : selectedMethod === 'form' ? (
                    <ManualCVForm 
                      onBack={handleBackToMethodSelector}
                      onComplete={handleAnalysisComplete}
                      walletAddress={walletAddress}
                    />
                  ) : selectedMethod === 'linkedin' ? (
                    <LinkedInImport 
                      onBack={handleBackToMethodSelector}
                      onComplete={handleAnalysisComplete}
                      walletAddress={walletAddress}
                    />
                  ) : (
                    <CVUploader 
                      onAnalysisComplete={handleAnalysisComplete}
                      walletAddress={walletAddress}
                      onBack={handleBackToMethodSelector}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <WaitlistCountdown />
      <TreasuryDisplay />
    </div>
  );
};

export default Index;
