import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CVUploader } from "@/components/CVUploader";
import { CVProfileDisplay } from "@/components/cv-profile";
import { Auth } from "@/components/Auth";
import { Navigation } from "@/components/Navigation";
import { CVProfileMethodSelector } from "@/components/CVProfileMethodSelector";
import { ManualCVForm } from "@/components/ManualCVForm";
import { LinkedInImport } from "@/components/LinkedInImport";
import { WalletConnectStep, WalletAddresses } from "@/components/cv-profile/WalletConnectStep";
import { OnboardingShell } from "@/components/cv-profile/OnboardingShell";

import { supabase } from "@/integrations/supabase/client";
import { FileCheck, LogOut, Plus, Info, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
import { CVProfilesEmpty } from "@/components/CVProfilesEmpty";
import { CVProfileCard } from "@/components/CVProfileCard";
import { toast } from "@/hooks/use-toast";

// Flow states: null (profiles list) -> 'wallet' (scan wallet) -> 'selecting' -> 'form'|'upload'|'linkedin'
type FlowState = "wallet" | "selecting" | "form" | "upload" | "linkedin" | null;

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flowState, setFlowState] = useState<FlowState>(null);
  const [connectedWallets, setConnectedWallets] = useState<WalletAddresses>({ solana: null, evm: null });

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const stateParam = urlParams.get("state");

      if (!code) return;

      const savedState = localStorage.getItem("linkedinOAuthState");
      if (!savedState) {
        console.error("No saved LinkedIn OAuth state");
        return;
      }

      try {
        const { state, wallets, redirectUri, timestamp } = JSON.parse(savedState);

        // Verify state and check timeout (10 minutes)
        if (state !== stateParam || Date.now() - timestamp > 600000) {
          throw new Error("Invalid or expired OAuth state");
        }

        // Exchange code for user data (no codeVerifier - using standard OAuth)
        const { data, error } = await supabase.functions.invoke("linkedin-oauth", {
          body: {
            action: "exchangeToken",
            code,
            redirectUri,
          },
        });

        if (error) throw error;
        if (!data?.user) throw new Error("No user data received");

        // Store user data and restore wallet state
        localStorage.setItem("linkedinUserData", JSON.stringify(data.user));
        setConnectedWallets(wallets || { solana: null, evm: null });
        setFlowState("linkedin");

        // Clean up URL
        window.history.replaceState({}, "", "/arubaito");
      } catch (e) {
        console.error("LinkedIn OAuth callback error:", e);
        toast({
          title: "LinkedIn Import Failed",
          description: e instanceof Error ? e.message : "Could not complete LinkedIn authentication.",
          variant: "destructive",
        });
      } finally {
        localStorage.removeItem("linkedinOAuthState");
      }
    };

    handleLinkedInCallback();
  }, []);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchRecentAnalyses(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRecentAnalyses(session.user.id);
      } else {
        setRecentAnalyses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRecentAnalyses = async (userId: string) => {
    const { data, error } = await supabase
      .from("cv_analyses")
      .select("id, file_name, overall_score, created_at, bluechip_verified")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setRecentAnalyses(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentAnalysisId(null);
    setRecentAnalyses([]);
  };

  const handleAnalysisComplete = async (analysisId: string) => {
    if (user) {
      fetchRecentAnalyses(user.id);
    }
    setCurrentAnalysisId(analysisId);
    setFlowState(null);
  };

  const handleNewAnalysis = () => {
    setCurrentAnalysisId(null);
    setFlowState(null);
    setConnectedWallets({ solana: null, evm: null });
  };

  const handleStartNewCV = () => {
    setFlowState("wallet");
  };

  const handleWalletContinue = (wallets: WalletAddresses) => {
    setConnectedWallets(wallets);
    setFlowState("selecting");
  };

  const handleWalletSkip = () => {
    setConnectedWallets({ solana: null, evm: null });
    setFlowState("selecting");
  };

  const handleMethodSelect = (method: "form" | "upload" | "linkedin") => {
    setFlowState(method);
  };

  const handleBackToMethodSelector = () => {
    setFlowState("selecting");
  };

  const handleBackToProfiles = () => {
    setFlowState(null);
    setConnectedWallets({ solana: null, evm: null });
  };

  const handleDeleteProfile = async (analysisId: string) => {
    try {
      // Get the analysis to find the file path
      const { data: analysis } = await supabase.from("cv_analyses").select("file_path").eq("id", analysisId).single();

      // Delete portfolio images first
      await supabase.from("cv_portfolio_images").delete().eq("analysis_id", analysisId);

      // Delete the CV file from storage
      if (analysis?.file_path) {
        await supabase.storage.from("cv-uploads").remove([analysis.file_path]);
      }

      // Delete the analysis record
      const { error } = await supabase.from("cv_analyses").delete().eq("id", analysisId);

      if (error) throw error;

      // Refresh the list
      if (user) {
        fetchRecentAnalyses(user.id);
      }

      toast({
        title: "CV Profile deleted",
        description: "Your CV profile has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the CV profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5ead7" }}>
        <div style={{ fontFamily: "'Consolas', monospace", fontSize: 12, color: "rgba(24,24,24,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Prioritize Twitter data from user metadata
  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.twitter_username ||
    user?.user_metadata?.display_name?.split(" ")[0] ||
    user?.user_metadata?.handle ||
    user?.email?.split("@")[0];

  // For backward compatibility, pass primary wallet (prefer Solana, fallback to EVM)
  const primaryWallet = connectedWallets.solana || connectedWallets.evm || undefined;

  return (
    <div className="min-h-screen pt-20" style={{ background: "#f5ead7" }}>
      <Navigation userName={userName} />

      {/* Header */}
      <header style={{ borderBottom: "1.5px solid rgba(24,24,24,0.18)" }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ border: "1.5px solid rgba(24,24,24,0.18)" }}>
                <FileCheck className="h-5 w-5" style={{ color: "#181818" }} />
              </div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontFamily: "'Styrene A Trial', 'Consolas', monospace", fontSize: 20, color: "#181818" }}>
                  {currentAnalysisId ? "CV Analysis" : "CV Profile Manager"}
                </h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help" style={{ color: "rgba(24,24,24,0.55)" }} />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        Manage your CV profiles and get AI-powered analysis. Upload multiple CVs to track improvements
                        over time. Optional: Add wallet address for OG verification.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentAnalysisId && (
                <button
                  onClick={handleNewAnalysis}
                  className="px-4 py-2 rounded-full text-xs transition-colors"
                  style={{ background: "transparent", color: "#181818", border: "1.5px solid #181818", fontFamily: "'Consolas', monospace" }}
                >
                  New Analysis
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-full text-xs transition-colors inline-flex items-center gap-1.5"
                style={{ background: "transparent", color: "rgba(24,24,24,0.55)", border: "1.5px solid rgba(24,24,24,0.18)", fontFamily: "'Consolas', monospace" }}
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {currentAnalysisId ? (
            <CVProfileDisplay analysisId={currentAnalysisId} />
          ) : (
            <div className="space-y-8">
              {/* Profiles List */}
              {flowState === null && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 style={{ fontFamily: "'Styrene A Trial', 'Consolas', monospace", fontSize: 28, color: "#181818" }}>Your CV Profiles</h2>
                      <p style={{ fontFamily: "'Consolas', monospace", fontSize: 12, color: "rgba(24,24,24,0.55)", marginTop: 4 }}>
                        Manage your Web3 CV Profiles | Create New | Edit Previous
                      </p>
                    </div>
                    <button
                      onClick={handleStartNewCV}
                      className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 inline-flex items-center gap-2"
                      style={{ background: "#181818", color: "#faf1e1", fontFamily: "'Consolas', monospace" }}
                    >
                      <Plus className="h-4 w-4" /> Upload New CV
                    </button>
                  </div>

                  {/* CV Profiles Grid or Empty State */}
                  {recentAnalyses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentAnalyses.map((analysis) => (
                        <CVProfileCard
                          key={analysis.id}
                          id={analysis.id}
                          fileName={analysis.file_name}
                          overallScore={analysis.overall_score}
                          createdAt={analysis.created_at}
                          bluechipVerified={analysis.bluechip_verified}
                          onClick={setCurrentAnalysisId}
                          onDelete={handleDeleteProfile}
                        />
                      ))}
                    </div>
                  ) : (
                    <CVProfilesEmpty onUploadClick={handleStartNewCV} />
                  )}
                </div>
              )}

              {/* Method Selector */}
              {flowState === "selecting" && (
                <div className="space-y-6">
                  <button
                    onClick={handleBackToProfiles}
                    className="mb-2 px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 transition-colors"
                    style={{ background: "transparent", color: "rgba(24,24,24,0.55)", border: "1.5px solid rgba(24,24,24,0.18)", fontFamily: "'Consolas', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Profiles
                  </button>
                  <CVProfileMethodSelector
                    onMethodSelect={handleMethodSelect}
                    walletAddress={primaryWallet}
                    walletAddresses={connectedWallets}
                  />
                </div>
              )}

              {/* Upload Forms */}
              {flowState === "form" && (
                <ManualCVForm
                  onBack={handleBackToMethodSelector}
                  onComplete={handleAnalysisComplete}
                  walletAddress={primaryWallet}
                  walletAddresses={connectedWallets}
                />
              )}

              {flowState === "linkedin" && (
                <LinkedInImport
                  onBack={handleBackToMethodSelector}
                  onComplete={handleAnalysisComplete}
                  walletAddress={primaryWallet}
                  walletAddresses={connectedWallets}
                />
              )}

              {flowState === "upload" && (
                <CVUploader
                  onAnalysisComplete={handleAnalysisComplete}
                  walletAddress={primaryWallet}
                  walletAddresses={connectedWallets}
                  onBack={handleBackToMethodSelector}
                />
              )}

              {/* Wallet Scan Step - shown before method selection */}
              {flowState === "wallet" && (
                <div className="space-y-6">
                  <button
                    onClick={handleBackToProfiles}
                    className="mb-2 px-4 py-2 rounded-full text-xs inline-flex items-center gap-1.5 transition-colors"
                    style={{ background: "transparent", color: "rgba(24,24,24,0.55)", border: "1.5px solid rgba(24,24,24,0.18)", fontFamily: "'Consolas', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Profiles
                  </button>
                  <WalletConnectStep onContinue={handleWalletContinue} onSkip={handleWalletSkip} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-50">
        <WaitlistCountdown />
      </div>
      <div className="fixed bottom-4 left-4 z-50">
        <TreasuryDisplay />
      </div>
    </div>
  );
};

export default Index;
