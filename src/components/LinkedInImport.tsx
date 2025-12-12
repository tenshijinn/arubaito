import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Info, Loader2, CheckCircle2, Wallet } from "lucide-react";
import { WalletAddresses } from "@/components/cv-profile/WalletConnectStep";
import { ManualCVForm, PrefillData } from "@/components/ManualCVForm";
import { supabase } from "@/integrations/supabase/client";

interface LinkedInImportProps {
  onBack: () => void;
  onComplete: (analysisId: string) => void;
  walletAddress?: string;
  walletAddresses?: WalletAddresses;
}

export const LinkedInImport = ({ onBack, onComplete, walletAddress, walletAddresses }: LinkedInImportProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [linkedInData, setLinkedInData] = useState<PrefillData | null>(null);
  const { toast } = useToast();

  // Check if we already have LinkedIn data from auth - ONLY for LinkedIn provider
  useEffect(() => {
    const checkLinkedInAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // ONLY check if authenticated specifically via LinkedIn
      if (user?.app_metadata?.provider === 'linkedin_oidc') {
        const metadata = user.user_metadata;
        setLinkedInData({
          fullName: metadata?.full_name || metadata?.name || '',
          email: user.email || '',
          professionalTitle: metadata?.headline || '',
          profileImageUrl: metadata?.avatar_url || metadata?.picture || '',
        });
      }
    };
    checkLinkedInAuth();
  }, []);

  const handleLinkedInConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Store state before redirect so we can restore after OAuth return
      localStorage.setItem('linkedinImportState', JSON.stringify({
        wallets: walletAddresses,
        timestamp: Date.now()
      }));
      
      const redirectUrl = `${window.location.origin}/arubaito`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          scopes: 'openid profile email',
        }
      });

      if (error) throw error;

      // The user will be redirected to LinkedIn
      // On return, Arubaito.tsx will restore state and the useEffect will pick up the data
      
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      // Clean up localStorage on error
      localStorage.removeItem('linkedinImportState');
      
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Handle missing credentials gracefully
      if (errorMessage.includes('provider') || errorMessage.includes('not enabled')) {
        toast({
          title: "LinkedIn Not Configured",
          description: "LinkedIn login is not yet available. Please use Manual Form or Upload CV instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: errorMessage || "Could not connect to LinkedIn. Please try again.",
          variant: "destructive",
        });
      }
      setIsConnecting(false);
    }
  };

  // If we have LinkedIn data, show the manual form with prefilled data
  if (linkedInData) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-500/10 border-green-500/30">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">
            <strong>LinkedIn data imported!</strong> We've pre-filled your basic info. Please complete the remaining sections below.
          </AlertDescription>
        </Alert>
        
        <ManualCVForm
          onBack={onBack}
          onComplete={onComplete}
          walletAddress={walletAddress}
          walletAddresses={walletAddresses}
          prefillData={linkedInData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} disabled={isConnecting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Import from LinkedIn</h2>
      </div>

      {/* Wallet Status Banner */}
      {(walletAddresses?.solana || walletAddresses?.evm) ? (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-500">Wallets Connected for Verification</span>
          </div>
          {walletAddresses?.solana && (
            <div className="mb-2">
              <span className="text-xs text-green-500 font-medium">Solana:</span>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {walletAddresses.solana}
              </p>
            </div>
          )}
          {walletAddresses?.evm && (
            <div className="mb-2">
              <span className="text-xs text-green-500 font-medium">EVM:</span>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {walletAddresses.evm}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            ✓ Your LinkedIn claims will be verified against on-chain activity
          </p>
        </Card>
      ) : (
        <Card className="p-4 bg-accent/30 border-dashed">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">No Wallet Connected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your profile will be created without on-chain verification
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" 
             style={{ background: 'linear-gradient(135deg, #0077B5, #00A0DC)' }}>
          <Linkedin className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Connect Your LinkedIn Account</h3>
          <p className="text-muted-foreground">
            We'll import your basic profile info, then you'll complete your Web3 experience details
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Hybrid Import Process:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-left">
              <li><strong>From LinkedIn:</strong> Name, email, headline, profile photo</li>
              <li><strong>You'll add:</strong> Skills, work experience details, Web3 communities, education</li>
            </ul>
            <p className="text-xs mt-2 text-muted-foreground">
              This hybrid approach gives you the best of both worlds - quick import + complete Web3 profile
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3 pt-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleLinkedInConnect}
            disabled={isConnecting}
            style={{ background: '#0077B5' }}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to LinkedIn...
              </>
            ) : (
              <>
                <Linkedin className="mr-2 h-5 w-5" />
                Connect LinkedIn & Continue
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            By connecting, you agree to share your LinkedIn profile data for CV analysis.
            You'll be redirected to LinkedIn to authorize access.
          </p>
        </div>
      </Card>
    </div>
  );
};
