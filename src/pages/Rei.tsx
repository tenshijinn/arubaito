import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AudioRecorder } from '@/components/AudioRecorder';
import ReiChatbot from '@/components/ReiChatbot';
import { useToast } from '@/hooks/use-toast';
import { Check, Twitter, Wallet, FileText, Shield, AlertCircle, Info, Sparkles, Briefcase, CheckCircle2, Mic, Globe, Edit2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

type RoleTag = 'dev' | 'product' | 'research' | 'community' | 'design' | 'ops';

const ROLE_OPTIONS: { value: RoleTag; label: string }[] = [
  { value: 'dev', label: 'Developer' },
  { value: 'product', label: 'Product' },
  { value: 'research', label: 'Research' },
  { value: 'community', label: 'Community' },
  { value: 'design', label: 'Design' },
  { value: 'ops', label: 'Operations' },
];

export default function Rei() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Form state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleTag[]>([]);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmittingWhitelist, setIsSubmittingWhitelist] = useState(false);
  const [whitelistSubmitted, setWhitelistSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false);

  // Set up Supabase session persistence and restore Twitter user state
  useEffect(() => {
    const restoreTwitterUserFromSession = async (session: Session) => {
      // Check if session contains Twitter user metadata
      const metadata = session.user.user_metadata;
      if (metadata?.twitter_id && metadata?.twitter_username) {
        // Reconstruct Twitter user from session metadata
        const restoredTwitterUser: TwitterUser = {
          x_user_id: metadata.twitter_id,
          handle: metadata.twitter_username,
          display_name: metadata.full_name || metadata.twitter_username,
          profile_image_url: metadata.avatar_url,
          verified: false // Will be updated from database
        };

        // Check database for verification status
        try {
          const { data: whitelistData } = await supabase
            .from('twitter_whitelist')
            .select('verification_type')
            .eq('twitter_handle', metadata.twitter_username)
            .single();

          if (whitelistData) {
            setVerificationStatus({
              bluechip_verified: !!whitelistData.verification_type,
              verification_type: whitelistData.verification_type
            });
            restoredTwitterUser.verified = true;
          }
        } catch (error) {
          console.log('No verification status found');
        }

        setTwitterUser(restoredTwitterUser);
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Restore Twitter user state if session exists
        if (session) {
          setTimeout(() => {
            restoreTwitterUserFromSession(session);
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Restore Twitter user state if session exists
      if (session) {
        restoreTwitterUserFromSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedVerifier = sessionStorage.getItem('twitter_code_verifier_rei');
    
    // Only process if we have code, state, verifier, haven't processed yet, and no existing twitter user
    if (code && state && storedVerifier && !twitterUser && !isProcessingCallback) {
      // Immediately clean URL to prevent re-processing
      window.history.replaceState({}, '', '/rei');
      handleTwitterCallback(code);
    }
  }, [twitterUser, isProcessingCallback]);

  // Auto-advance to step 2 when Twitter is verified
  useEffect(() => {
    if (twitterUser && step === 1) {
      setStep(2);
    }
  }, [twitterUser]);

  // Auto-advance to step 3 when wallet is connected
  useEffect(() => {
    if (connected && twitterUser && step === 2) {
      setStep(3);
    }
  }, [connected, twitterUser]);

  // Check for existing registration after Twitter login
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (twitterUser && !isLoadingRegistration) {
        setIsLoadingRegistration(true);
        try {
          const { data, error } = await supabase
            .from('rei_registry')
            .select('*')
            .eq('x_user_id', twitterUser.x_user_id)
            .single();

          if (data && !error) {
            setRegistrationData(data);
            setIsSuccess(true);
            setPortfolioUrl(data.portfolio_url || '');
            setSelectedRoles(data.role_tags || []);
            setConsent(true);
          }
        } catch (error) {
          console.error('Error checking registration:', error);
        } finally {
          setIsLoadingRegistration(false);
        }
      }
    };

    checkExistingRegistration();
  }, [twitterUser]);


  const handleTwitterLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/rei`;
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { action: 'getAuthUrl', redirectUri },
      });

      if (error) throw error;

      sessionStorage.setItem('twitter_code_verifier_rei', data.codeVerifier);
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
      const storedVerifier = sessionStorage.getItem('twitter_code_verifier_rei');
      sessionStorage.removeItem('twitter_code_verifier_rei');
      const redirectUri = `${window.location.origin}/rei`;
      
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
      
      // Clean URL
      window.history.replaceState({}, '', '/rei');
      
      toast({
        title: 'Identity Verified!',
        description: `Welcome, @${data.user.handle}! Your identity has been verified.`,
      });
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

  const handleAudioReady = (blob: Blob) => {
    setAudioBlob(blob);
    toast({
      title: 'Audio Ready',
      description: 'Your audio introduction is ready to submit',
    });
  };

  const toggleRole = (role: RoleTag) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (!audioBlob || !publicKey || !consent || !twitterUser) return;

    setIsSubmitting(true);

    try {
      // Upload audio file
      const fileName = `${twitterUser.x_user_id}_${Date.now()}_audio.webm`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rei-contributor-files')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      // Submit registration
      const { data, error } = await supabase.functions.invoke('submit-rei-registration', {
        body: {
          x_user_id: twitterUser.x_user_id,
          handle: twitterUser.handle,
          display_name: twitterUser.display_name,
          profile_image_url: twitterUser.profile_image_url,
          verified: twitterUser.verified,
          wallet_address: publicKey.toString(),
          file_path: filePath,
          portfolio_url: portfolioUrl || null,
          role_tags: selectedRoles,
          consent: true,
        },
      });

      if (error) throw error;

      // Fetch the updated registration data
      const { data: regData } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('x_user_id', twitterUser.x_user_id)
        .single();

      setRegistrationData(regData);
      setIsSuccess(true);
      setIsEditMode(false);
      toast({
        title: 'Success!',
        description: isEditMode ? 'Your profile has been updated!' : data.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

  const canSubmit = audioBlob && publicKey && consent && selectedRoles.length > 0 && twitterUser;

  const userName = twitterUser?.display_name?.split(' ')[0] || twitterUser?.handle;

  if (isSuccess && registrationData && !isEditMode) {
    const analysis = registrationData.profile_analysis as any;

    return (
      <div className="min-h-screen">
        <Navigation userName={userName} />
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
            <TabsList className="w-full mb-6 h-12 bg-muted/30 p-1 rounded-lg grid grid-cols-2">
              <TabsTrigger 
                value="profile" 
                className="font-mono text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                &gt; Talent Profile
              </TabsTrigger>
              <TabsTrigger 
                value="askrei" 
                className="font-mono text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                &gt; AskRei
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <Card className="w-full bg-transparent">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Registration Summary</CardTitle>
                  <CardDescription>
                    Your Proof-of-Talent registration is complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* AI Profile Analysis */}
                  {analysis && registrationData.profile_score && (
                    <div className="space-y-4 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Profile Analysis</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-primary">
                            {Math.round(registrationData.profile_score)}
                          </span>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                      </div>

                      {/* Summary */}
                      {registrationData.analysis_summary && (
                        <p className="text-sm text-muted-foreground italic">
                          "{registrationData.analysis_summary}"
                        </p>
                      )}

                      {/* Category Scores */}
                      {analysis.category_scores && (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(analysis.category_scores).map(([category, score]: [string, any]) => (
                            <div key={category} className="bg-background/50 rounded p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs capitalize">
                                  {category.replace('_', ' ')}
                                </span>
                                <span className="text-sm font-semibold">{score}/25</span>
                              </div>
                              <Progress value={(score / 25) * 100} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Key Strengths */}
                      {analysis.key_strengths && analysis.key_strengths.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Key Strengths
                          </h4>
                          <ul className="space-y-1">
                            {analysis.key_strengths.map((strength: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Experience Highlights */}
                      {analysis.experience_highlights && analysis.experience_highlights.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            Experience Highlights
                          </h4>
                          <ul className="space-y-1">
                            {analysis.experience_highlights.map((exp: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{exp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Wallet Verification */}
                      {analysis.wallet_verification?.verified && (
                        <div className="bg-background/50 rounded p-3">
                          <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-500" />
                            Wallet Verified
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Chain:</span>
                              <span className="ml-1 font-medium">{analysis.wallet_verification.chain}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Account Age:</span>
                              <span className="ml-1 font-medium">{analysis.wallet_verification.account_age_days} days</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Transactions:</span>
                              <span className="ml-1 font-medium">{analysis.wallet_verification.transaction_count}</span>
                            </div>
                          <div>
                            <span className="text-muted-foreground">Bluechip Score:</span>
                            <span className="ml-1 font-medium">{analysis.wallet_verification.bluechip_score}/100</span>
                          </div>
                        </div>

                        {/* Notable Interactions */}
                        {analysis.wallet_verification.notable_interactions && 
                         analysis.wallet_verification.notable_interactions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <h5 className="font-medium text-xs mb-2 text-muted-foreground">
                              On-Chain Activity
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.wallet_verification.notable_interactions.map((interaction: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {interaction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                      {/* Recommended Improvements */}
                      {analysis.recommended_improvements && analysis.recommended_improvements.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            Recommended Improvements
                          </h4>
                          <ul className="space-y-1">
                            {analysis.recommended_improvements.map((improvement: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-amber-500">→</span>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Twitter Identity */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Identity</h3>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      {twitterUser?.profile_image_url && (
                        <img src={twitterUser.profile_image_url} alt={twitterUser.handle} className="h-12 w-12 rounded-full" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{registrationData.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{registrationData.handle}</p>
                      </div>
                      {registrationData.verified && (
                        <Badge variant="secondary">X Verified</Badge>
                      )}
                    </div>
                  </div>

                  {/* Wallet */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Wallet Address</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-mono break-all">{registrationData.wallet_address}</p>
                    </div>
                  </div>

                  {/* Portfolio */}
                  {registrationData.portfolio_url && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Portfolio</h3>
                      <div className="p-4 bg-muted rounded-lg">
                        <a href={registrationData.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {registrationData.portfolio_url}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Role Tags */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Role Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {registrationData.role_tags?.map((role: string) => (
                        <Badge key={role} variant="default">
                          {ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Video CV */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Video CV</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">Video submitted: {new Date(registrationData.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* NFT Status */}
                  <Alert className={registrationData.nft_minted ? "border-primary bg-primary/10" : "border-yellow-500 bg-yellow-500/10"}>
                    <Shield className={`h-4 w-4 ${registrationData.nft_minted ? 'text-primary' : 'text-yellow-500'}`} />
                    <AlertDescription className={registrationData.nft_minted ? 'text-primary' : 'text-yellow-500'}>
                      {registrationData.nft_minted ? (
                        <strong>NFT Minted: Your Proof-of-Talent NFT has been minted!</strong>
                      ) : (
                        <strong>NFT Pending: Your Proof-of-Talent NFT will be minted shortly</strong>
                      )}
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => setIsEditMode(true)} className="w-full" variant="outline">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="askrei" className="mt-0">
              <ReiChatbot 
                walletAddress={registrationData.wallet_address} 
                userMode="talent"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation userName={userName} />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-2xl bg-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-3xl font-bold">Rei Proof-Of-Talent Portal</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Register as a Web3 contributor by verifying your identity, connecting your wallet, and submitting your video CV. Upon completion, you'll receive a Soul-Bound NFT proof of talent.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`h-2 rounded-full flex-1 ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Twitter Verification */}
          <div className={step !== 1 && twitterUser ? 'opacity-50' : ''}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${twitterUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {twitterUser ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <h3 className="text-lg font-semibold">Verify Your Identity</h3>
            </div>

            {!twitterUser ? (
              <div className="space-y-4">
                <Button onClick={handleTwitterLogin} size="lg" className="w-full">
                  <Twitter className="mr-2 h-5 w-5" />
                  Verify with X (Twitter)
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
                
                <Alert className="border-primary bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary">
                    <strong>Identity Verified</strong>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Step 2: Wallet Connection */}
          {twitterUser && (
            <div className={step !== 2 && connected ? 'opacity-50' : ''}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${connected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {connected ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <h3 className="text-lg font-semibold">Connect Solana Wallet</h3>
              </div>

              <WalletMultiButton className="!w-full !h-12 !bg-primary hover:!bg-primary/90" />
              
              {connected && publicKey && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Connected Wallet</p>
                  <p className="text-xs font-mono break-all">{publicKey.toString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Registration Form */}
          {twitterUser && connected && (!isSuccess || isEditMode) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
                  3
                </div>
                <h3 className="text-lg font-semibold">{isEditMode ? 'Edit My Details' : 'Submit My Details'}</h3>
              </div>

              <div className="space-y-4">
                {/* Audio Introduction */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Label>Record Your Introduction</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Introduce yourself and share your Web3 experience. Maximum 5 minutes. Tips: mention your background, highlight projects, discuss skills, and keep it professional.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <AudioRecorder onAudioReady={handleAudioReady} maxDurationMinutes={5} />
                </div>

                {/* Portfolio URL */}
                <div>
                  <Label htmlFor="portfolio">Portfolio / Project URL (Optional)</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://..."
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>

                {/* Role Tags */}
                <div>
                  <Label>Role Tags *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ROLE_OPTIONS.map((role) => (
                      <Badge
                        key={role.value}
                        variant={selectedRoles.includes(role.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleRole(role.value)}
                      >
                        {role.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm cursor-pointer flex items-center gap-2">
                    I consent to data storage *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Your data will be stored for talent matching purposes and NFT issuance. This includes your X profile, wallet address, video CV, and role preferences.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  {isEditMode && (
                    <Button
                      onClick={() => {
                        setIsEditMode(false);
                        setAudioBlob(null);
                      }}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    size="lg"
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : isEditMode ? 'Update Profile' : 'Register & Claim Proof-Of-Talent NFT'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}