import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Award, TrendingUp, Target } from "lucide-react";
import { Navigation } from "@/components/Navigation";

interface MemberData {
  wallet_address: string;
  handle: string;
  display_name: string;
  profile_image_url: string;
  role_tags: string[];
  verified: boolean;
  bio: string;
  skills: Array<{ id: string; name: string }>;
  work_experience: Array<{
    id: string;
    company: string;
    role: string;
    period: string;
    description: string;
  }>;
  portfolio_links: string;
  bluechip_verified: boolean;
}

interface CVAnalysis {
  overall_score: number;
  scoring_details: {
    categories: Array<{
      name: string;
      weight: number;
      qualitative_score: number;
      quantitative_score: number;
    }>;
    top_strengths: string[];
    recommended_improvements: string[];
  };
  bluechip_details: {
    overallScore: number;
    verifications: Array<{
      chain: string;
      verificationType: string;
      period?: string;
      transactionCount?: number;
      earliestTxDate?: string;
    }>;
    verifiedProjects: Array<{
      name: string;
      chain: string;
      interactionCount: number;
      firstInteraction: string;
    }>;
  };
  feedback: string;
}

const MemberProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkAccessAndLoadProfile();
  }, [handle]);

  const checkAccessAndLoadProfile = async () => {
    try {
      // Check if current user is verified
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view member profiles",
          variant: "destructive",
        });
        navigate("/club");
        return;
      }

      // Get wallet address from local storage or state
      const walletAddress = localStorage.getItem("connectedWallet");
      
      if (!walletAddress) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to view profiles",
          variant: "destructive",
        });
        navigate("/club");
        return;
      }

      // Check if user is verified
      const { data: currentUser } = await supabase
        .from("rei_registry")
        .select("verified")
        .eq("wallet_address", walletAddress)
        .single();

      if (!currentUser?.verified) {
        toast({
          title: "Access Denied",
          description: "Only verified members can view profiles",
          variant: "destructive",
        });
        navigate("/club");
        return;
      }

      setIsVerified(true);

      // Fetch member profile data
      const { data: member, error: memberError } = await supabase
        .from("rei_registry")
        .select("*")
        .eq("handle", handle)
        .eq("verified", true)
        .single();

      if (memberError || !member) {
        toast({
          title: "Profile Not Found",
          description: "This member profile does not exist or is not verified",
          variant: "destructive",
        });
        navigate("/club");
        return;
      }

      setMemberData(member as any);

      // Fetch highest scoring CV analysis
      const { data: analysis } = await supabase
        .from("cv_analyses")
        .select("*")
        .eq("wallet_address", member.wallet_address)
        .order("overall_score", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysis) {
        setCvAnalysis(analysis as any);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    if (!memberData) return 0;
    let completion = 0;
    if (memberData.bio) completion += 25;
    if (memberData.skills && memberData.skills.length > 0) completion += 25;
    if (memberData.work_experience && memberData.work_experience.length > 0) completion += 25;
    if (memberData.portfolio_links) completion += 25;
    return completion;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getChainColor = (chain: string) => {
    switch (chain.toLowerCase()) {
      case "ethereum": return "bg-blue-500/20 text-blue-300";
      case "solana": return "bg-purple-500/20 text-purple-300";
      case "bsc": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!memberData || !isVerified) {
    return null;
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="p-8 mb-6 border-border">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-32 w-32">
              <AvatarImage src={memberData.profile_image_url} alt={memberData.display_name} />
              <AvatarFallback className="text-4xl font-mono">
                {memberData.display_name?.[0] || memberData.handle?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-3xl font-mono font-bold mb-2">
                {memberData.display_name || memberData.handle}
              </h1>
              <p className="text-muted-foreground font-mono mb-4">@{memberData.handle}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {memberData.role_tags?.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="font-mono">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono">
                  <span>Profile Completion</span>
                  <span>{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-2" />
              </div>
            </div>
          </div>
        </Card>

        {/* CV Analysis Score Section */}
        {cvAnalysis && cvAnalysis.scoring_details && (
          <Card className="p-8 mb-6 border-border">
            <h2 className="text-2xl font-mono font-bold mb-6 flex items-center gap-2">
              <Award className="h-6 w-6" />
              CV Analysis Score
            </h2>

            {/* Overall Score */}
            <div className="text-center mb-8 p-6 bg-muted/50 rounded-lg">
              <div className={`text-6xl font-mono font-bold mb-2 ${getScoreColor(cvAnalysis.overall_score)}`}>
                {cvAnalysis.overall_score}
              </div>
              <p className="text-muted-foreground font-mono">Overall Score (out of 100)</p>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-mono font-semibold mb-4">Category Breakdown</h3>
              {cvAnalysis.scoring_details.categories.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm font-mono">
                    <span>{category.name}</span>
                    <span className="text-muted-foreground">
                      Weight: {category.weight}% | Qual: {category.qualitative_score} | Quant: {category.quantitative_score}
                    </span>
                  </div>
                  <Progress 
                    value={(category.qualitative_score + category.quantitative_score) / 2 * 10} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>

            {/* Top Strengths */}
            {cvAnalysis.scoring_details.top_strengths && cvAnalysis.scoring_details.top_strengths.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-mono font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Strengths
                </h3>
                <ul className="list-disc list-inside space-y-2 font-mono text-sm">
                  {cvAnalysis.scoring_details.top_strengths.map((strength, idx) => (
                    <li key={idx} className="text-muted-foreground">{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Improvements */}
            {cvAnalysis.scoring_details.recommended_improvements && cvAnalysis.scoring_details.recommended_improvements.length > 0 && (
              <div>
                <h3 className="text-xl font-mono font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-500" />
                  Recommended Improvements
                </h3>
                <ul className="list-disc list-inside space-y-2 font-mono text-sm">
                  {cvAnalysis.scoring_details.recommended_improvements.map((improvement, idx) => (
                    <li key={idx} className="text-muted-foreground">{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Proof-of-Talent Section */}
        {memberData.bluechip_verified && cvAnalysis?.bluechip_details && (
          <Card className="p-8 mb-6 border-border">
            <h2 className="text-2xl font-mono font-bold mb-6 flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Proof-of-Talent Verification
            </h2>

            {/* Bluechip Badge */}
            <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-mono font-bold text-primary mb-2">
                    Bluechip Talent Verified
                  </h3>
                  <p className="text-muted-foreground font-mono text-sm">
                    On-chain activity verified across multiple blockchains
                  </p>
                </div>
                <div className="text-4xl font-mono font-bold text-primary">
                  {cvAnalysis.bluechip_details.overallScore}
                </div>
              </div>
            </div>

            {/* On-Chain Activity Timeline */}
            {cvAnalysis.bluechip_details.verifications && cvAnalysis.bluechip_details.verifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-mono font-semibold mb-4">On-Chain Activity Timeline</h3>
                <div className="space-y-4">
                  {cvAnalysis.bluechip_details.verifications.map((verification, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getChainColor(verification.chain)}>
                          {verification.chain}
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {verification.verificationType}
                        </Badge>
                        {verification.verificationType.includes("Early") && (
                          <Badge className="bg-yellow-500/20 text-yellow-300">OG</Badge>
                        )}
                      </div>
                      <div className="text-sm font-mono text-muted-foreground space-y-1">
                        {verification.period && <p>Period: {verification.period}</p>}
                        {verification.transactionCount && <p>Transactions: {verification.transactionCount}</p>}
                        {verification.earliestTxDate && <p>First Activity: {verification.earliestTxDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Projects Grid */}
            {cvAnalysis.bluechip_details.verifiedProjects && cvAnalysis.bluechip_details.verifiedProjects.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-mono font-semibold mb-4">Verified Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cvAnalysis.bluechip_details.verifiedProjects.map((project, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-mono font-semibold">{project.name}</h4>
                        <Badge className={getChainColor(project.chain)} variant="outline">
                          {project.chain}
                        </Badge>
                      </div>
                      <div className="text-sm font-mono text-muted-foreground space-y-1">
                        <p>Interactions: {project.interactionCount}</p>
                        <p>First Interaction: {new Date(project.firstInteraction).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Address */}
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <code className="flex-1 font-mono text-sm">{memberData.wallet_address}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(memberData.wallet_address)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Professional Profile */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bio */}
          {memberData.bio && (
            <Card className="p-6 border-border md:col-span-2">
              <h3 className="text-xl font-mono font-semibold mb-4">Bio</h3>
              <p className="font-mono text-muted-foreground whitespace-pre-wrap">{memberData.bio}</p>
            </Card>
          )}

          {/* Skills */}
          {memberData.skills && memberData.skills.length > 0 && (
            <Card className="p-6 border-border">
              <h3 className="text-xl font-mono font-semibold mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {memberData.skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="font-mono">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Portfolio Links */}
          {memberData.portfolio_links && (
            <Card className="p-6 border-border">
              <h3 className="text-xl font-mono font-semibold mb-4">Portfolio</h3>
              <div className="space-y-2">
                {memberData.portfolio_links.split("\n").map((link, idx) => (
                  link.trim() && (
                    <a
                      key={idx}
                      href={link.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline font-mono text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link.trim()}
                    </a>
                  )
                ))}
              </div>
            </Card>
          )}

          {/* Work Experience */}
          {memberData.work_experience && memberData.work_experience.length > 0 && (
            <Card className="p-6 border-border md:col-span-2">
              <h3 className="text-xl font-mono font-semibold mb-4">Work Experience</h3>
              <div className="space-y-6">
                {memberData.work_experience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-primary pl-4">
                    <h4 className="font-mono font-semibold text-lg">{exp.role}</h4>
                    <p className="font-mono text-primary mb-1">{exp.company}</p>
                    <p className="font-mono text-sm text-muted-foreground mb-2">{exp.period}</p>
                    <p className="font-mono text-sm text-muted-foreground">{exp.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/club")}
            className="font-mono"
          >
            Back to Club
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
