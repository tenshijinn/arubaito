import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, FormInput, Linkedin, Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CVProfileMethodSelectorProps {
  onMethodSelect: (method: 'form' | 'upload' | 'linkedin') => void;
  walletAddress?: string;
}

export const CVProfileMethodSelector = ({ onMethodSelect, walletAddress }: CVProfileMethodSelectorProps) => {
  return (
    <div className="space-y-6">
      <Alert className="border-primary/50 bg-primary/5">
        <Shield className="h-5 w-5" />
        <AlertDescription className="ml-2">
          <p className="font-semibold mb-2">⚠️ Proof-of-Work Verification Notice</p>
          <p className="text-sm">
            Any projects, companies, or protocols you mention in your CV will be verified against your wallet's on-chain activity. 
            This "Proof-of-Work" verification helps bluechip projects confirm the authenticity of your experience during hiring.
          </p>
          {walletAddress && (
            <p className="text-xs mt-2 font-mono opacity-70">
              Verifying wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </p>
          )}
          {!walletAddress && (
            <p className="text-xs mt-2 text-warning">
              ⚠️ No wallet connected - verification will be limited
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Choose Your CV Profile Method
        </h2>
        <p className="text-muted-foreground">
          Select how you'd like to build your verified Web3 CV profile
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Method 1: Traditional Form */}
        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onMethodSelect('form')}>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" 
                 style={{ background: 'var(--gradient-primary)' }}>
              <FormInput className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Manual Form Entry</h3>
              <p className="text-sm text-muted-foreground">
                Fill out a structured form with your work history, skills, and achievements
              </p>
            </div>
            <div className="pt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Most control over details
              </p>
              <p className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Takes 10-15 minutes
              </p>
            </div>
            <Button className="w-full" variant="outline">
              Start Form
            </Button>
          </div>
        </Card>

        {/* Method 2: CV Upload */}
        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onMethodSelect('upload')}>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" 
                 style={{ background: 'var(--gradient-primary)' }}>
              <FileUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload CV</h3>
              <p className="text-sm text-muted-foreground">
                Upload your existing CV and let AI extract and structure your profile data
              </p>
            </div>
            <div className="pt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Fastest method (2-3 mins)
              </p>
              <p className="flex items-center gap-1">
                <Info className="h-3 w-3" /> AI-powered extraction
              </p>
            </div>
            <Button className="w-full" variant="outline">
              Upload File
            </Button>
          </div>
        </Card>

        {/* Method 3: LinkedIn Import */}
        <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => onMethodSelect('linkedin')}>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" 
                 style={{ background: 'var(--gradient-primary)' }}>
              <Linkedin className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Import from LinkedIn</h3>
              <p className="text-sm text-muted-foreground">
                Connect your LinkedIn account and automatically import your profile data
              </p>
            </div>
            <div className="pt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Uses existing data
              </p>
              <p className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Takes 3-5 minutes
              </p>
            </div>
            <Button className="w-full" variant="outline">
              Connect LinkedIn
            </Button>
          </div>
        </Card>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground">
          All methods include AI-powered analysis and on-chain verification
        </p>
      </div>
    </div>
  );
};
