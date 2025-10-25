import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CVUploader } from "@/components/CVUploader";
import { CVAnalysis } from "@/components/CVAnalysis";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, LogOut, History, Info, Twitter, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [twitterUser, setTwitterUser] = useState<any>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [showTwitterLogin, setShowTwitterLogin] = useState(false);

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code && state && !twitterUser && !isProcessingCallback) {
      window.history.replaceState({}, '', '/arubaito');
      handleTwitterCallback(code);
      return;
    }

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
  }, [twitterUser, isProcessingCallback]);

  const handleTwitterLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/arubaito`;
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { action: 'getAuthUrl', redirectUri },
      });

      if (error) throw error;

      sessionStorage.setItem('twitter_code_verifier', data.codeVerifier);
      window.location.href = data.authUrl;
    } catch (error) {
      toast.error('Failed to initiate Twitter login');
      console.error('Twitter login error:', error);
    }
  };

  const handleTwitterCallback = async (code: string) => {
    setIsProcessingCallback(true);
    try {
      const storedVerifier = sessionStorage.getItem('twitter_code_verifier');
      const redirectUri = `${window.location.origin}/arubaito`;
      
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { 
          action: 'exchangeToken',
          code,
          codeVerifier: storedVerifier,
          redirectUri,
        },
      });

      if (error) throw error;

      // Check if user is whitelisted (bluechip verified)
      if (!data.bluechip_verified) {
        toast.error('Access denied: You are not on the bluechip whitelist');
        setShowTwitterLogin(true);
        sessionStorage.removeItem('twitter_code_verifier');
        setIsProcessingCallback(false);
        return;
      }

      setTwitterUser(data.user);
      sessionStorage.removeItem('twitter_code_verifier');
      
      // Auto-create account and sign in
      const email = `${data.user.x_user_id}@twitter.arubaito.app`;
      const password = `twitter_${data.user.x_user_id}_${Math.random().toString(36)}`;
      
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, create account
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              twitter_handle: data.user.handle,
              display_name: data.user.display_name,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Sign in after signup
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      toast.success(`Welcome, @${data.user.handle}!`);
      
      // Redirect to Club if verified
      setTimeout(() => {
        navigate('/club');
      }, 2000);
    } catch (error) {
      toast.error('Failed to complete Twitter login');
      console.error('Twitter callback error:', error);
    } finally {
      setIsProcessingCallback(false);
    }
  };

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

  if (!user && !twitterUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-transparent">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Bluechip Twitter Login</h1>
              <p className="text-muted-foreground">Access exclusive Web3 jobs community</p>
            </div>
            
            {showTwitterLogin && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only whitelisted Twitter accounts can access this platform. Please ensure you're on the bluechip whitelist.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTwitterLogin}
              size="lg"
              className="w-full"
              disabled={isProcessingCallback}
            >
              <Twitter className="mr-2 h-5 w-5" />
              {isProcessingCallback ? 'Verifying...' : 'Sign in with Twitter'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0];

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
                  <h1 className="text-xl font-bold text-foreground">Private Membership Web3 Jobs Community</h1>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Upload your CV for AI-powered analysis. Get detailed scores on content, structure, formatting, and more. Optional: Add wallet address for Bluechip Talent verification.</p>
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
                <Card className="bg-transparent">
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
