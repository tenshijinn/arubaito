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
      // Check if wallet is verified in rei_registry
      const { data: reiData, error: reiError } = await supabase
        .from('rei_registry')
        .select('*')
        .eq('wallet_address', publicKey.toString())
        .eq('verified', true)
        .single();

      if (!reiError && reiData) {
        setIsVerified(true);
        setMemberData(reiData);
      }
    } catch (error) {
      console.error('Access check error:', error);
    } finally {
      setIsLoading(false);
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
                    <p>This area is restricted to verified members only. {!publicKey ? 'Connect your wallet and complete verification' : 'Complete verification'} through the Rei portal to access exclusive member features.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="pt-4 space-y-3">
            <Button
              onClick={() => navigate('/rei')}
              className="w-full font-mono"
              variant="default"
              size="lg"
            >
              GO TO VERIFICATION
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
