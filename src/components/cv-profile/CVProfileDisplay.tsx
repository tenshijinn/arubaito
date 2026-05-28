import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileHeader } from "./ProfileHeader";
import { ScoreOverview } from "./ScoreOverview";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { OnChainResume } from "./OnChainResume";
import { CVContentCard } from "./CVContentCard";
import { FeedbackCollapsible } from "./FeedbackCollapsible";
import { PortfolioGallery } from "./PortfolioGallery";
import { NFTGallery } from "./NFTGallery";

interface Category {
  id: string;
  name: string;
  weight: number;
  qualitative_score: number;
  quantitative_score: number;
  final_score: number;
  reason: string;
  examples_found?: string[];
}

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

interface ScoringDetails {
  total_score: number;
  categories: Category[];
  top_strengths: string[];
  recommended_improvements: string[];
  cv_content?: CVContent;
}

interface Analysis {
  overall_score: number;
  content_score: number;
  structure_score: number;
  formatting_score: number;
  keywords_score: number;
  experience_score: number;
  feedback: string;
  file_name: string;
  created_at: string;
  wallet_address: string | null;
  bluechip_verified: boolean;
  bluechip_score: number;
  bluechip_details: any;
  scoring_details?: ScoringDetails;
  user_id: string;
}

interface CVProfileDisplayProps {
  analysisId: string;
}

export const CVProfileDisplay = ({ analysisId }: CVProfileDisplayProps) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch analysis data
      const { data: analysisData, error: analysisError } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
        setLoading(false);
        return;
      }

      setAnalysis(analysisData as unknown as Analysis);

      // Check current user for ownership
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setIsOwner(user?.id === analysisData.user_id);
      
      setLoading(false);
    };

    fetchData();
  }, [analysisId]);

  // Handle club verification redirect
  useEffect(() => {
    const checkAndVerify = async () => {
      if (!analysis) return;

      const qualifiesForClub = 
        analysis.overall_score >= 80 || 
        analysis.bluechip_verified;

      if (qualifiesForClub && analysis.wallet_address) {
        try {
          const { data: existing } = await supabase
            .from('club_verifications')
            .select('verified')
            .eq('wallet_address', analysis.wallet_address)
            .maybeSingle();

          if (existing?.verified) {
            toast.success("Welcome back! Redirecting to Club...");
            setTimeout(() => navigate('/club'), 2000);
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member';

          const { error } = await supabase
            .from('club_verifications')
            .upsert({
              wallet_address: analysis.wallet_address,
              user_id: user.id,
              display_name: displayName,
              verified: true,
              cv_score: analysis.overall_score,
              bluechip_verified: analysis.bluechip_verified,
            }, {
              onConflict: 'wallet_address'
  if (loading) {
    return (
      <div className="text-center py-12" style={{ fontFamily: "'Consolas', monospace", fontSize: 12, color: "rgba(24,24,24,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Loading profile...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12" style={{ fontFamily: "'Consolas', monospace", fontSize: 12, color: "rgba(24,24,24,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Profile not found
      </div>
    );
  }
  }, [analysis, navigate]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Profile not found
      </div>
    );
  }

  const profileImageUrl = currentUser?.user_metadata?.avatar_url || 
                          currentUser?.user_metadata?.picture || 
                          null;

  const cvContent = analysis.scoring_details?.cv_content || null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <ProfileHeader
        fileName={analysis.file_name}
        filePath={analysis.file_name}
        createdAt={analysis.created_at}
        walletAddress={analysis.wallet_address}
        profileImageUrl={profileImageUrl}
        userName={currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name}
        twitterHandle={currentUser?.user_metadata?.user_name || currentUser?.user_metadata?.preferred_username}
        overallScore={analysis.scoring_details?.total_score || analysis.overall_score}
        cvContent={cvContent}
        verifiedProjects={analysis.bluechip_details?.verifiedProjects || []}
        detectedChains={analysis.bluechip_details?.detectedChains || []}
      />

      {/* Main Content Grid - 2 Columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - CV Content (2 columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          <CVContentCard cvContent={cvContent} />
        </div>

        {/* Right Column - Score Overview, On-Chain Resume, Score Breakdown */}
        <div className="space-y-6">
          <ScoreOverview
            overallScore={analysis.scoring_details?.total_score || analysis.overall_score}
            bluechipVerified={analysis.bluechip_verified}
            bluechipScore={analysis.bluechip_score}
          />

          <OnChainResume
            walletAddress={analysis.wallet_address}
            bluechipVerified={analysis.bluechip_verified}
            bluechipScore={analysis.bluechip_score}
            bluechipDetails={analysis.bluechip_details}
          />

          {/* Score Breakdown */}
          {analysis.scoring_details && (
            <ScoreBreakdown categories={analysis.scoring_details.categories} />
          )}
        </div>
      </div>

      {/* Portfolio & NFT Galleries - Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        <PortfolioGallery analysisId={analysisId} isOwner={isOwner} />
        <NFTGallery walletAddress={analysis.wallet_address} />
      </div>

      {/* Private Feedback Section - Only visible to owner */}
      {isOwner && analysis.scoring_details && (
        <FeedbackCollapsible
          topStrengths={analysis.scoring_details.top_strengths}
          recommendedImprovements={analysis.scoring_details.recommended_improvements}
          categories={analysis.scoring_details.categories}
          generalFeedback={analysis.feedback}
        />
      )}
    </div>
  );
};
