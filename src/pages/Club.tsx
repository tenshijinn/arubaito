import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ClubTimeline } from '@/components/club/ClubTimeline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CVBuilder } from '@/components/club/CVBuilder';
import { JobPitch } from '@/components/club/JobPitch';
import { MemberShowcase } from '@/components/club/MemberShowcase';

export default function Club() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    checkMemberAccess();
  }, [publicKey]);

  const checkMemberAccess = async () => {
    setIsLoading(true);
    
    if (!publicKey) {
      setIsLoading(false);
      return;
    }

    try {
      const walletAddress = publicKey.toString();
      let hasAccess = false;
      let accessReason = '';
      let data: any = null;

      // Check 1: Get rei_registry data first (needed for multiple checks)
      const { data: reiData } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      // Check 2: Twitter Whitelist
      if (reiData?.handle) {
        const { data: whitelistData } = await supabase
          .from('twitter_whitelist')
          .select('twitter_handle')
          .eq('twitter_handle', reiData.handle)
          .maybeSingle();

        if (whitelistData) {
          hasAccess = true;
          accessReason = 'twitter_whitelist';
          data = reiData;
        }
      }

      // Check 3: NFT Holder
      if (!hasAccess && reiData && (reiData.nft_minted || reiData.nft_mint_address)) {
        hasAccess = true;
        accessReason = 'nft_holder';
        data = reiData;
      }

      // Check 4: High CV Score (89+)
      if (!hasAccess) {
        const { data: cvData } = await supabase
          .from('cv_analyses')
          .select('*')
          .eq('wallet_address', walletAddress)
          .gt('overall_score', 89)
          .order('overall_score', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cvData) {
          hasAccess = true;
          accessReason = 'high_cv_score';
          data = reiData || { wallet_address: walletAddress };
        }
      }

      if (hasAccess) {
        setIsVerified(true);
        setMemberData({ ...data, access_reason: accessReason });
        console.log(`Club access granted via: ${accessReason}`);
      }
    } catch (error) {
      console.error('Access check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelistSubmission = async () => {
    if (!user) {
      toast.error('Please sign in with Twitter first');
      return;
    }

    try {
      const twitterHandle = user.user_metadata?.twitter_username;
      
      if (!twitterHandle) {
        toast.error('Twitter handle not found in your account');
        return;
      }

      const { error } = await supabase.functions.invoke('submit-whitelist-request', {
        body: {
          twitter_handle: twitterHandle,
          x_user_id: user.user_metadata?.twitter_id,
          display_name: user.user_metadata?.full_name,
          profile_image_url: user.user_metadata?.avatar_url,
        },
      });

      if (error) throw error;

      toast.success('Whitelist request submitted for review!');
    } catch (error: any) {
      console.error('Whitelist submission error:', error);
      toast.error(error.message || 'Failed to submit whitelist request');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground font-mono">VERIFYING ACCESS...</p>
        </div>
      </div>
    );
  }

  if (!isVerified || !publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 bg-transparent">
          <div className="mx-auto h-16 w-16 rounded-sm bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-foreground font-mono">ACCESS DENIED</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>This area is restricted to club members only. {!publicKey ? 'Connect your wallet to check membership.' : 'Access is granted if you are: (1) on the Twitter whitelist, (2) an NFT holder, or (3) have a CV score above 89.'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="pt-4 space-y-3">
            {user && (
              <Button
                onClick={handleWhitelistSubmission}
                className="w-full font-mono"
                variant="outline"
                size="lg"
              >
                Review my Twitter for Whitelist
              </Button>
            )}
            <Button
              onClick={() => navigate('/arubaito')}
              className="w-full font-mono"
              variant="default"
              size="lg"
            >
              Try another sign in method
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const userName = memberData?.display_name?.split(' ')[0] || memberData?.handle;

  return (
    <div className="min-h-screen">
      <Navigation userName={userName} />
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground font-mono">THE CLUBHOUSE</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-6 w-6 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Exclusive member area for verified Web3 contributors. Access your timeline, manage your profile, create job pitches, and view the member spotlight.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {memberData?.display_name || memberData?.handle}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card border border-border">
            <TabsTrigger value="timeline" className="font-mono text-xs py-3">
              TIMELINE
            </TabsTrigger>
            <TabsTrigger value="cv" className="font-mono text-xs py-3">
              MY PROFILE
            </TabsTrigger>
            <TabsTrigger value="pitch" className="font-mono text-xs py-3">
              JOB PITCH
            </TabsTrigger>
            <TabsTrigger value="showcase" className="font-mono text-xs py-3">
              SPOTLIGHT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            <ClubTimeline />
          </TabsContent>

          <TabsContent value="cv" className="space-y-6">
            <CVBuilder memberData={memberData} />
          </TabsContent>

          <TabsContent value="pitch" className="space-y-6">
            <JobPitch memberData={memberData} />
          </TabsContent>

          <TabsContent value="showcase" className="space-y-6">
            <MemberShowcase />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
