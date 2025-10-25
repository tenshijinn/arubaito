import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { ClubTimeline } from '@/components/club/ClubTimeline';
import { CVBuilder } from '@/components/club/CVBuilder';
import { JobPitch } from '@/components/club/JobPitch';
import { MemberShowcase } from '@/components/club/MemberShowcase';

export default function Club() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);

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
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-sm bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground font-mono">ACCESS DENIED</h1>
            <p className="text-muted-foreground font-mono text-sm">
              THIS AREA IS RESTRICTED TO VERIFIED MEMBERS ONLY
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <p className="text-xs text-muted-foreground font-mono">
              {!publicKey ? 'CONNECT YOUR WALLET AND COMPLETE VERIFICATION' : 'COMPLETE VERIFICATION TO ACCESS'}
            </p>
            <button
              onClick={() => navigate('/rei')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/90 transition-colors border border-primary"
            >
              GO TO VERIFICATION
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground font-mono">THE CLUBHOUSE</h1>
            <p className="text-sm text-muted-foreground font-mono">
              EXCLUSIVE MEMBER AREA - {memberData?.display_name || memberData?.handle}
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
