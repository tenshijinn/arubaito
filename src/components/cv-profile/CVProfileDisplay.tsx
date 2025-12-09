import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileHeader } from "./ProfileHeader";
import { ScoreOverview } from "./ScoreOverview";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { WalletOverview } from "./WalletOverview";
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

interface ScoringDetails {
  total_score: number;
  categories: Category[];
  top_strengths: string[];
  recommended_improvements: string[];
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
        analysis.overall_score > 89 || 
        analysis.bluechip_verified;

      if (qualifiesForClub && analysis.wallet_address) {
        try {
          const { data: existing } = await supabase
            .from('rei_registry')
            .select('verified')
            .eq('wallet_address', analysis.wallet_address)
            .single();

          if (existing?.verified) {
            toast.success("Welcome back! Redirecting to Club...");
            setTimeout(() => navigate('/club'), 2000);
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

          const { error } = await supabase
            .from('rei_registry')
            .upsert({
              wallet_address: analysis.wallet_address,
              file_path: `/cv/${analysis.wallet_address}`,
              verified: true,
              display_name: displayName,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'wallet_address'
            });

          if (!error) {
            toast.success("🎉 Congratulations! You've been verified. Redirecting to Club...");
            setTimeout(() => navigate('/club'), 3000);
          }
        } catch (error) {
          console.error('Error verifying user:', error);
        }
      }
    };

    checkAndVerify();
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <ProfileHeader
        fileName={analysis.file_name}
        createdAt={analysis.created_at}
        walletAddress={analysis.wallet_address}
        profileImageUrl={profileImageUrl}
        userName={currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name}
        twitterHandle={currentUser?.user_metadata?.user_name || currentUser?.user_metadata?.preferred_username}
      />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Score Overview */}
        <div className="lg:col-span-2 space-y-6">
          <ScoreOverview
            overallScore={analysis.scoring_details?.total_score || analysis.overall_score}
            bluechipVerified={analysis.bluechip_verified}
            bluechipScore={analysis.bluechip_score}
          />

          {/* Score Breakdown */}
          {analysis.scoring_details && (
            <ScoreBreakdown categories={analysis.scoring_details.categories} />
          )}
        </div>

        {/* Right Column - Wallet Overview */}
        <div className="space-y-6">
          <WalletOverview
            walletAddress={analysis.wallet_address}
            bluechipVerified={analysis.bluechip_verified}
            bluechipScore={analysis.bluechip_score}
            bluechipDetails={analysis.bluechip_details}
          />
        </div>
      </div>

      {/* Portfolio Gallery */}
      <PortfolioGallery analysisId={analysisId} isOwner={isOwner} />

      {/* NFT Gallery */}
      <NFTGallery walletAddress={analysis.wallet_address} />

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
