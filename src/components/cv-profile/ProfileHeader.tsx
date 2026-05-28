import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Wallet, FileText, Download, Loader2, FileDown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCVProfilePDF } from "@/utils/cvPdfGenerator";
import { NSIcon } from "@/components/icons/NSIcon";
import { GoldenCheckmark } from "@/components/icons/GoldenCheckmark";
import { INK, CREAM, MUTED, BORDER, DISPLAY, MONO, SANS, cardStyle, labelStyle } from "@/lib/aesthetics";

interface CVContent {
  personal_info?: { name: string | null; location: string | null; professional_title: string | null };
  describe_yourself?: string;
  web3_communities?: string[];
  hard_skills?: string[];
  soft_skills?: string[];
  languages?: string[];
  education?: Array<{ institution: string; degree: string; year: string }>;
  work_experience?: Array<{ company: string; role: string; duration: string; highlights?: string[] }>;
  hobbies?: string[];
}

interface VerifiedProject { name: string; chain: string; interactions?: number | string }

interface ProfileHeaderProps {
  fileName: string;
  filePath?: string;
  createdAt: string;
  walletAddress: string | null;
  profileImageUrl: string | null;
  userName?: string;
  twitterHandle?: string;
  overallScore?: number;
  cvContent?: CVContent | null;
  verifiedProjects?: VerifiedProject[];
  detectedChains?: string[];
}

export const ProfileHeader = ({
  fileName, filePath, createdAt, walletAddress, profileImageUrl,
  userName, twitterHandle, overallScore, cvContent, verifiedProjects, detectedChains,
}: ProfileHeaderProps) => {
  const [downloading, setDownloading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [membershipType, setMembershipType] = useState<string | null>(null);
  const displayName = userName || fileName.replace(/\.[^/.]+$/, "");

  useEffect(() => {
    const fetchMembership = async () => {
      if (!twitterHandle) return;
      const { data } = await supabase.from("club_member_showcase").select("membership_type").eq("twitter_handle", twitterHandle).maybeSingle();
      if (data) setMembershipType(data.membership_type);
    };
    fetchMembership();
  }, [twitterHandle]);

  const hasNS = membershipType?.toLowerCase().includes("ns_member") || membershipType?.toLowerCase().includes("network_school");
  const hasGuestlist = membershipType?.toLowerCase().includes("whitelist") || membershipType?.toLowerCase().includes("guestlist") || membershipType?.toLowerCase().includes("bluechip");
  const truncatedWallet = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null;

  const handleDownload = async () => {
    if (!filePath) return toast.error("No file available");
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage.from('cv-uploads').download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CV downloaded");
    } catch { toast.error("Failed to download CV"); }
    finally { setDownloading(false); }
  };

  const handleDownloadPDF = async () => {
    if (!overallScore) return toast.error("Score data not available");
    setGeneratingPDF(true);
    try {
      await generateCVProfilePDF({ userName: displayName, profileImageUrl, overallScore, cvContent, createdAt, twitterHandle, verifiedProjects, detectedChains });
      toast.success("PDF downloaded");
    } catch { toast.error("Failed to generate PDF"); }
    finally { setGeneratingPDF(false); }
  };

  return (
    <div style={cardStyle()} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span style={labelStyle()}>{"01 / Profile"}</span>
        <span style={labelStyle()}>{"Web3 CV"}</span>
      </div>
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20" style={{ border: `1.5px solid ${BORDER}` }}>
          <AvatarImage src={profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback style={{ background: "transparent", color: INK, fontFamily: DISPLAY, fontSize: 20 }}>
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2" style={{ fontFamily: DISPLAY, fontSize: 28, color: INK, lineHeight: 1.1 }}>
                {hasNS && <NSIcon size={25} />}
                {hasGuestlist && <GoldenCheckmark size={25} />}
                {displayName}
              </h2>
              {twitterHandle && (
                <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 4 }}>@{twitterHandle}</p>
              )}
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="px-4 py-2 rounded-full text-xs transition-opacity hover:opacity-80 flex items-center gap-2 shrink-0 disabled:opacity-50"
              style={{ background: INK, color: CREAM, fontFamily: SANS }}
            >
              {generatingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              Download Profile
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              <span>{fileName}</span>
              {filePath && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="ml-1 p-1 rounded-full hover:opacity-70"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Analyzed {format(new Date(createdAt), 'MMM d, yyyy')}</span>
            </div>

            {truncatedWallet && (
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5" />
                <span className="px-2 py-0.5 rounded-full" style={{ border: `1px solid ${BORDER}`, fontFamily: MONO, fontSize: 10 }}>
                  {truncatedWallet}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
