import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CVUploader } from "@/components/CVUploader";
import { CVAnalysis } from "@/components/CVAnalysis";
import { Auth } from "@/components/Auth";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, LogOut, History, Twitter, Check, AlertCircle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TwitterUser {
  x_user_id: string;
  handle: string;
  display_name: string;
  profile_image_url?: string;
  verified: boolean;
}

interface VerificationStatus {
  bluechip_verified: boolean;
  verification_type: string | null;
}

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [isSubmittingWhitelist, setIsSubmittingWhitelist] = useState(false);
  const [whitelistSubmitted, setWhitelistSubmitted] = useState(false);

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

  // Check for Twitter OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code && state && !twitterUser && !isProcessingCallback) {
      window.history.replaceState({}, '', '/arubaito');
      handleTwitterCallback(code);
    }
  }, [twitterUser, isProcessingCallback]);

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
      toast({
        title: 'Error',
        description: 'Failed to initiate Twitter login',
        variant: 'destructive',
      });
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

      setTwitterUser(data.user);
      setVerificationStatus({
        bluechip_verified: data.bluechip_verified,
        verification_type: data.verification_type,
      });
      sessionStorage.removeItem('twitter_code_verifier');
      
      window.history.replaceState({}, '', '/arubaito');
      
      if (data.bluechip_verified) {
        toast({
          title: 'Verified!',
          description: `Welcome, @${data.user.handle}! Your account is verified as a blue-chip Web3 talent.`,
        });
      } else {
        toast({
          title: 'Not Verified',
          description: `@${data.user.handle} is not on the verified list.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete Twitter login',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingCallback(false);
    }
  };

  const handleWhitelistRequest = async () => {
    if (!twitterUser) return;

    setIsSubmittingWhitelist(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-whitelist-request', {
        body: {
          twitter_handle: twitterUser.handle,
          x_user_id: twitterUser.x_user_id,
          display_name: twitterUser.display_name,
          profile_image_url: twitterUser.profile_image_url,
        },
      });

      if (error) throw error;

      if (data.success) {
        setWhitelistSubmitted(true);
        toast({
          title: 'Request Submitted!',
          description: data.message,
        });
      } else {
        toast({
          title: 'Already Submitted',
          description: data.message,
          variant: 'default',
        });
        setWhitelistSubmitted(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit whitelist request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingWhitelist(false);
    }
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
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <header className="border-b" style={{ background: 'hsl(var(--card))' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">CV Checker</h1>
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
                <h2 className="text-4xl font-bold text-foreground">
                  Qualify for Platform Access
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Verify your blue-chip Web3 status with Twitter, then upload your CV. Score 85% or higher to receive your CV Score and gain access to the platform waitlist.
                </p>
              </div>

              {/* Twitter Blue-Chip Verification */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                      <h3 className="text-lg font-semibold text-foreground">Blue-Chip Verification</h3>
                    </div>

                    {!twitterUser ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Connect your Twitter account to verify your blue-chip Web3 status before uploading your CV.
                          </AlertDescription>
                        </Alert>
                        <Button onClick={handleTwitterLogin} size="lg" className="w-full">
                          <Twitter className="mr-2 h-5 w-5" />
                          Register with Twitter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                          {twitterUser.profile_image_url && (
                            <img src={twitterUser.profile_image_url} alt={twitterUser.handle} className="h-12 w-12 rounded-full" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{twitterUser.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{twitterUser.handle}</p>
                          </div>
                          {twitterUser.verified && (
                            <Badge variant="secondary">X Verified</Badge>
                          )}
                        </div>
                        
                        {verificationStatus?.bluechip_verified ? (
                          <Alert className="border-primary bg-primary/10">
                            <Check className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-primary">
                              <strong>Verified Blue-Chip Account</strong>
                              {verificationStatus.verification_type && (
                                <span className="block text-sm mt-1">
                                  Type: {verificationStatus.verification_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-3">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                This account is not on the verified blue-chip list.
                              </AlertDescription>
                            </Alert>
                            
                            {!whitelistSubmitted ? (
                              <div className="p-4 bg-muted rounded-lg space-y-3">
                                <p className="text-sm font-medium">Think you should be verified?</p>
                                <p className="text-sm text-muted-foreground">
                                  Submit your Twitter account for blue-chip verification. Our team will review your request.
                                </p>
                                <Button
                                  onClick={handleWhitelistRequest}
                                  disabled={isSubmittingWhitelist}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  {isSubmittingWhitelist ? 'Submitting...' : 'Request Verification'}
                                </Button>
                              </div>
                            ) : (
                              <Alert className="border-primary/50 bg-primary/5">
                                <Check className="h-4 w-4 text-primary" />
                                <AlertDescription>
                                  <strong>Request Submitted</strong>
                                  <span className="block text-sm mt-1 text-muted-foreground">
                                    Your verification request has been received. We'll review it and notify you if approved.
                                  </span>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CV Upload - Only show if verified */}
              {verificationStatus?.bluechip_verified && (
                <CVUploader onAnalysisComplete={handleAnalysisComplete} />
              )}

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
