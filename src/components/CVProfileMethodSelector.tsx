import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, FormInput, Linkedin, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CVProfileMethodSelectorProps {
  onMethodSelect: (method: 'form' | 'upload' | 'linkedin') => void;
  walletAddress?: string;
}

export const CVProfileMethodSelector = ({ onMethodSelect, walletAddress }: CVProfileMethodSelectorProps) => {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">
              Choose Your CV Profile Method
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold mb-2">⚠️ Proof-of-Work Verification</p>
                <p className="text-sm mb-2">
                  Any projects, companies, or protocols you mention will be verified against your wallet's on-chain activity.
                </p>
                {walletAddress && (
                  <p className="text-xs font-mono opacity-70">
                    Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
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
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Manual Form</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Most control over details</p>
                      <p className="text-sm">Takes 10-15 minutes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fill out a structured form with your work history and skills
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
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Upload CV</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Fastest method (2-3 mins)</p>
                      <p className="text-sm">AI-powered extraction</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your CV and let AI extract your profile data
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
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">LinkedIn Import</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Uses existing data</p>
                      <p className="text-sm">Takes 3-5 minutes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect LinkedIn and automatically import your profile
                </p>
              </div>
              <Button className="w-full" variant="outline">
                Connect LinkedIn
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};
