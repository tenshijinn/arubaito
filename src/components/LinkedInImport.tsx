import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Info, AlertTriangle, Wallet, CheckCircle2 } from "lucide-react";

interface LinkedInImportProps {
  onBack: () => void;
  onComplete: (analysisId: string) => void;
  walletAddress?: string;
}

export const LinkedInImport = ({ onBack, onComplete, walletAddress }: LinkedInImportProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleLinkedInConnect = async () => {
    setIsConnecting(true);
    
    toast({
      title: "Coming Soon",
      description: "LinkedIn import functionality is currently in development. Please use manual form or CV upload instead.",
      variant: "default",
    });

    setIsConnecting(false);
  };

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
      {walletAddress ? (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-500">Wallet Connected for Verification</p>
              <p className="text-xs font-mono text-muted-foreground truncate mt-1">
                {walletAddress}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your LinkedIn profile claims will be verified against this wallet's on-chain activity
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
             style={{ background: 'var(--gradient-primary)' }}>
          <Linkedin className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Connect Your LinkedIn Account</h3>
          <p className="text-muted-foreground">
            We'll automatically import your profile data, work experience, skills, and more
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">What we'll import:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Profile summary and headline</li>
              <li>Work experience and positions</li>
              <li>Skills and endorsements</li>
              <li>Education background</li>
              <li>Certifications and achievements</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-1">Development Notice</p>
            <p className="text-sm">
              LinkedIn import is currently under development. Please use the manual form or CV upload method in the meantime.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-3 pt-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleLinkedInConnect}
            disabled={isConnecting || true}
          >
            <Linkedin className="mr-2 h-5 w-5" />
            {isConnecting ? 'Connecting...' : 'Connect LinkedIn (Coming Soon)'}
          </Button>

          <p className="text-xs text-muted-foreground">
            By connecting, you agree to share your LinkedIn profile data for CV analysis
          </p>
        </div>
      </Card>
    </div>
  );
};
