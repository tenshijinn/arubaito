import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Wallet, FileText, Download, Loader2, FileDown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCVProfilePDF } from "@/utils/cvPdfGenerator";
import { NSIcon } from "@/components/icons/NSIcon";
import { GoldenCheckmark } from "@/components/icons/GoldenCheckmark";

interface CVContent {
  personal_info?: {
    name: string | null;
    location: string | null;
    professional_title: string | null;
  };
  describe_yourself?: string;
  web3_communities?: string[];
  hard_skills?: string[];
  soft_skills?: string[];
  languages?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  work_experience?: Array<{
    company: string;
    role: string;
    duration: string;
    highlights?: string[];
  }>;
  hobbies?: string[];
}

interface VerifiedProject {
  name: string;
  chain: string;
  interactions?: number | string;
}

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
  fileName,
  filePath,
  createdAt,
  walletAddress,
  profileImageUrl,
  userName,
  twitterHandle,
  overallScore,
  cvContent,
  verifiedProjects,
  detectedChains,
}: ProfileHeaderProps) => {
  const [downloading, setDownloading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [membershipType, setMembershipType] = useState<string | null>(null);
  const displayName = userName || fileName.replace(/\.[^/.]+$/, "");

  // Fetch membership pathway from club_member_showcase
  useEffect(() => {
    const fetchMembership = async () => {
      if (!twitterHandle) return;
      const { data } = await supabase
        .from("club_member_showcase")
        .select("membership_type")
        .eq("twitter_handle", twitterHandle)
        .maybeSingle();
      if (data) setMembershipType(data.membership_type);
    };
    fetchMembership();
  }, [twitterHandle]);

  const hasNS = membershipType?.toLowerCase().includes("ns_member") || membershipType?.toLowerCase().includes("network_school");
  const hasGuestlist = membershipType?.toLowerCase().includes("whitelist") || membershipType?.toLowerCase().includes("guestlist") || membershipType?.toLowerCase().includes("bluechip");
  const truncatedWallet = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const handleDownload = async () => {
    if (!filePath) {
      toast.error("No file available for download");
      return;
    }

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('cv-uploads')
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        toast.error("Failed to download CV");
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("CV downloaded successfully");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download CV");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!overallScore) {
      toast.error("Score data not available");
      return;
    }

    setGeneratingPDF(true);
    try {
      await generateCVProfilePDF({
        userName: displayName,
        profileImageUrl,
        overallScore,
        cvContent,
        createdAt,
        twitterHandle,
        verifiedProjects,
        detectedChains,
      });
      toast.success("CV Profile PDF downloaded");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Card className="p-6 bg-transparent border-border/30 backdrop-blur-sm">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <Avatar className="h-20 w-20 border-2 border-primary/30">
          <AvatarImage src={profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-secondary text-primary text-xl font-bold">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {displayName}
              </h2>
              {twitterHandle && (
                <p className="text-muted-foreground text-sm">
                  @{twitterHandle}
                </p>
              )}
            </div>
            
            {/* Download CV Profile Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="shrink-0"
            >
              {generatingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Download Profile
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{fileName}</span>
              {filePath && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-1"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Analyzed {format(new Date(createdAt), 'MMM d, yyyy')}</span>
            </div>

            {truncatedWallet && (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <Badge variant="outline" className="font-mono text-xs">
                  {truncatedWallet}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
