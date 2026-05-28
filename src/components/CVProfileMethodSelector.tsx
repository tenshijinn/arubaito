import { FileUp, FormInput, Linkedin, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletAddresses } from "@/components/cv-profile/WalletConnectStep";
import { INK, CREAM, MUTED, BORDER, DISPLAY, MONO, SANS, cardStyle, labelStyle } from "@/lib/aesthetics";

interface CVProfileMethodSelectorProps {
  onMethodSelect: (method: 'form' | 'upload' | 'linkedin') => void;
  walletAddress?: string;
  walletAddresses?: WalletAddresses;
}

const MethodCard = ({ icon: Icon, title, description, button, onClick, tag, tooltipLines }: any) => (
  <div onClick={onClick} style={cardStyle()} className="p-6 cursor-pointer transition-opacity hover:opacity-90">
    <div className="flex items-center justify-between mb-6">
      <span style={labelStyle()}>{tag}</span>
      <Tooltip>
        <TooltipTrigger asChild><Info className="h-3.5 w-3.5 cursor-help" style={{ color: MUTED }} /></TooltipTrigger>
        <TooltipContent>{tooltipLines.map((l: string, i: number) => <p key={i} className="text-sm">{l}</p>)}</TooltipContent>
      </Tooltip>
    </div>
    <div className="text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${BORDER}` }}>
        <Icon className="h-7 w-7" style={{ color: INK }} />
      </div>
      <h3 style={{ fontFamily: DISPLAY, fontSize: 18, color: INK }}>{title}</h3>
      <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{description}</p>
      <button
        className="w-full px-5 py-2.5 rounded-full text-sm transition-colors"
        style={{ background: "transparent", color: INK, border: `1.5px solid ${INK}`, fontFamily: SANS }}
      >
        {button}
      </button>
    </div>
  </div>
);

export const CVProfileMethodSelector = ({ onMethodSelect, walletAddress }: CVProfileMethodSelectorProps) => {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h2 style={{ fontFamily: DISPLAY, fontSize: 28, color: INK }}>Choose Your CV Profile Method</h2>
            <Tooltip>
              <TooltipTrigger asChild><Info className="h-4 w-4 cursor-help" style={{ color: MUTED }} /></TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold mb-2">⚠️ Proof-of-Work Verification</p>
                <p className="text-sm mb-2">Any projects, companies, or protocols you mention will be verified against your wallet's on-chain activity.</p>
                {walletAddress && (<p className="text-xs font-mono opacity-70">Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>)}
              </TooltipContent>
            </Tooltip>
          </div>
          <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>Select how you'd like to build your verified Web3 CV profile</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <MethodCard
            icon={FormInput} title="Manual Form" description="Fill out a structured form with your work history and skills"
            button="Start Form" tag="A / Form" onClick={() => onMethodSelect('form')}
            tooltipLines={["Most control over details", "Takes 10-15 minutes"]}
          />
          <MethodCard
            icon={FileUp} title="Upload CV" description="Upload your CV and let AI extract your profile data"
            button="Upload File" tag="B / Upload" onClick={() => onMethodSelect('upload')}
            tooltipLines={["Fastest method (2-3 mins)", "AI-powered extraction"]}
          />
          <MethodCard
            icon={Linkedin} title="LinkedIn Import" description="Connect LinkedIn and automatically import your profile"
            button="Connect LinkedIn" tag="C / Import" onClick={() => onMethodSelect('linkedin')}
            tooltipLines={["Uses existing data", "Takes 3-5 minutes"]}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};
