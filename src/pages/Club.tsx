import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CountdownTimer } from "@/components/CountdownTimer";
import { WaitlistCountdown } from "@/components/WaitlistCountdown";
import { TreasuryDisplay } from "@/components/TreasuryDisplay";
export default function Club() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [supperclubEmail, setSupperclubEmail] = useState("");
  const [isSubmittingSupperclub, setIsSubmittingSupperclub] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", {
        event: _event,
        user: session?.user,
        metadata: session?.user?.user_metadata,
      });
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Got session:", { user: session?.user, metadata: session?.user?.user_metadata });
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Only check access if we have a user session loaded
    if (user !== null || publicKey) {
      checkMemberAccess();
    }
  }, [publicKey, user]);

  const checkMemberAccess = async () => {
    setIsLoading(true);

    // Use wallet from authenticated session first, fallback to connected wallet
    const walletAddress = user?.user_metadata?.wallet_address || publicKey?.toString();
    const twitterHandle = user?.user_metadata?.twitter_username;

    console.log("Club access check:", { walletAddress, twitterHandle, userMetadata: user?.user_metadata });

    if (!walletAddress && !twitterHandle) {
      setIsLoading(false);
      return;
    }

    try {
      let hasAccess = false;
      let accessReason = "";
      let data: any = null;

      // Check 1: Twitter Whitelist - check if authenticated user's Twitter is whitelisted
      if (twitterHandle) {
        const { data: whitelistData } = await supabase
          .from("twitter_whitelist")
          .select("*")
          .ilike("twitter_handle", twitterHandle)
          .maybeSingle();

        console.log("Twitter whitelist check:", { twitterHandle, whitelistData });

        if (whitelistData) {
          hasAccess = true;
          accessReason = "twitter_whitelist";
          data = {
            wallet_address: walletAddress,
            handle: twitterHandle,
            display_name: user?.user_metadata?.full_name || twitterHandle,
          };
        }
      }

      // Check 2: Club verification via CV score / bluechip
      if (!hasAccess && walletAddress) {
        const { data: clubData } = await supabase
          .from("club_verifications")
          .select("*")
          .eq("wallet_address", walletAddress)
          .maybeSingle();

        if (clubData?.verified) {
          hasAccess = true;
          accessReason = "club_verification";
          data = clubData;
        }
      }

      if (hasAccess) {
        setIsVerified(true);
        setMemberData({ ...data, access_reason: accessReason });
        console.log(`Club access granted via: ${accessReason}`);
      }
    } catch (error) {
      console.error("Access check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhitelistSubmission = async () => {
    if (!user) {
      toast.error("Please sign in with Twitter first");
      return;
    }

    try {
      const twitterHandle = user.user_metadata?.twitter_username;

      if (!twitterHandle) {
        toast.error("Twitter handle not found in your account");
        return;
      }

      const { error } = await supabase.functions.invoke("submit-whitelist-request", {
        body: {
          twitter_handle: twitterHandle,
          x_user_id: user.user_metadata?.twitter_id,
          display_name: user.user_metadata?.full_name,
          profile_image_url: user.user_metadata?.avatar_url,
        },
      });

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke("send-club-notification", {
        body: {
          type: "whitelist_request",
          twitter_handle: twitterHandle,
          x_user_id: user.user_metadata?.twitter_id,
          display_name: user.user_metadata?.full_name,
          profile_image_url: user.user_metadata?.avatar_url,
        },
      });

      toast.success("Whitelist request submitted for review!");
    } catch (error: any) {
      console.error("Whitelist submission error:", error);
      toast.error(error.message || "Failed to submit whitelist request");
    }
  };

  const handleSupperclubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supperclubEmail || !supperclubEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmittingSupperclub(true);
    try {
      // Store in database instead of sending email (email disabled temporarily)
      const { error } = await supabase
        .from("supperclub_interests")
        .insert({ email: supperclubEmail });

      if (error) throw error;

      toast.success("Interest registered! We'll be in touch soon.");
      setSupperclubEmail("");
    } catch (error: any) {
      console.error("Supperclub submission error:", error);
      toast.error("Failed to register interest. Please try again.");
    } finally {
      setIsSubmittingSupperclub(false);
    }
  };

  const MONO = "'Consolas', 'IBM Plex Mono', monospace";
  const DISPLAY = "'Styrene A Trial', 'Consolas', monospace";
  const INK = "#181818";
  const CREAM = "#faf1e1";
  const MUTED = "rgba(24,24,24,0.55)";
  const BORDER = "rgba(24,24,24,0.18)";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#faf1e1" }}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: INK }} />
          <p
            className="uppercase"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: MUTED }}
          >
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#faf1e1" }}>
        <div
          className="max-w-md w-full p-8 text-center space-y-6 rounded-[20px]"
          style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between">
            <span
              className="uppercase"
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
            >
              {"00 / Access"}
            </span>
            <span
              className="uppercase"
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
            >
              {"Restricted"}
            </span>
          </div>
          <div
            className="mx-auto h-14 w-14 rounded-full flex items-center justify-center"
            style={{ border: `1.5px solid ${BORDER}` }}
          >
            <Shield className="h-6 w-6" style={{ color: INK }} strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h1
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 28,
                  letterSpacing: "-0.03em",
                  color: INK,
                  fontWeight: 500,
                }}
              >
                {"Access denied"}
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help" style={{ color: MUTED }} />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      This area is restricted to club members only.{" "}
                      {!publicKey && !user?.user_metadata?.wallet_address
                        ? "Sign in with your wallet to check membership."
                        : "Access is granted if you are: (1) on the Twitter whitelist, or (2) an NFT holder."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="pt-2 space-y-3">
            {user && (
              <button
                onClick={handleWhitelistSubmission}
                className="w-full px-5 py-2.5 rounded-full text-sm transition-colors hover:bg-black/5"
                style={{
                  background: "transparent",
                  color: INK,
                  border: `1.5px solid ${INK}`,
                  fontFamily: MONO,
                }}
              >
                {"Review my Twitter for whitelist"}
              </button>
            )}
            <button
              onClick={() => navigate("/arubaito")}
              className="w-full px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
              style={{ background: INK, color: CREAM, fontFamily: MONO }}
            >
              {"Try another sign in method"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prioritize Twitter data from user metadata or member data
  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.twitter_username ||
    user?.user_metadata?.display_name?.split(" ")[0] ||
    user?.user_metadata?.handle ||
    memberData?.display_name?.split(" ")[0] ||
    memberData?.handle;

  return (
    <div className="min-h-screen pt-20" style={{ background: "#faf1e1" }}>
      <Navigation userName={userName} />

      {/* Header */}
      <header style={{ borderBottom: `1.5px solid ${BORDER}` }}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-3">
            <span
              className="uppercase"
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
            >
              {"00 / Members"}
            </span>
            <span
              className="uppercase"
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
            >
              {"The Club"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: 36,
                letterSpacing: "-0.04em",
                color: INK,
                fontWeight: 500,
              }}
            >
              {"The Club"}
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-5 w-5 cursor-help" style={{ color: MUTED }} />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    Exclusive member area for verified Web3 contributors. Access your timeline, manage your profile,
                    create job pitches, and view the member spotlight.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {(memberData?.display_name || memberData?.handle) && (
            <p
              className="mt-1"
              style={{ fontFamily: MONO, fontSize: 13, color: MUTED }}
            >
              {memberData?.display_name || memberData?.handle}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6 max-w-4xl mx-auto md:grid-cols-2">
          {/* Club Opens Soon Card */}
          <div
            className="rounded-[20px] p-8"
            style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <span
                className="uppercase"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
              >
                {"01 / Launch"}
              </span>
              <span
                className="uppercase"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
              >
                {"Dec 8"}
              </span>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <h2
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 24,
                    letterSpacing: "-0.03em",
                    color: INK,
                    fontWeight: 500,
                  }}
                >
                  {"Club opens soon"}
                </h2>
                <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                  {"Exclusive member features coming December 8th"}
                </p>
              </div>

              <CountdownTimer targetDate={new Date("2025-12-08T00:00:00")} />

              <div className="pt-4 space-y-3" style={{ borderTop: `1.5px solid ${BORDER}` }}>
                <p
                  className="uppercase mt-4"
                  style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
                >
                  {"Upcoming features"}
                </p>
                <ul style={{ fontFamily: MONO, fontSize: 12, color: INK, lineHeight: 1.8 }}>
                  <li>{"— Member timeline & activity feed"}</li>
                  <li>{"— Profile builder & CV management"}</li>
                  <li>{"— Job pitch creation"}</li>
                  <li>{"— Member spotlight & showcase"}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cypherpunk Supperclub Card */}
          <div
            className="rounded-[20px] p-8"
            style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <span
                className="uppercase"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
              >
                {"02 / Supperclub"}
              </span>
              <span
                className="uppercase"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: MUTED }}
              >
                {"Interest"}
              </span>
            </div>
            <div className="space-y-5">
              <div className="space-y-1">
                <h3
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                    color: INK,
                    fontWeight: 500,
                  }}
                >
                  {"Cypherpunk Supperclub"}
                </h3>
                <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                  {"Dine + network with OGs and changemakers"}
                </p>
              </div>

              <form onSubmit={handleSupperclubSubmit} className="space-y-3">
                <div
                  className="flex items-center px-4 py-3 rounded-full"
                  style={{ background: "transparent", border: `1.5px solid ${BORDER}` }}
                >
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={supperclubEmail}
                    onChange={(e) => setSupperclubEmail(e.target.value)}
                    disabled={isSubmittingSupperclub}
                    className="bg-transparent outline-none flex-1 text-sm"
                    style={{ color: INK, fontFamily: MONO }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingSupperclub}
                  className="w-full px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: INK, color: CREAM, fontFamily: MONO }}
                >
                  {isSubmittingSupperclub ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {"Submitting..."}
                    </>
                  ) : (
                    "Register interest"
                  )}
                </button>
              </form>
            </div>
          </div>
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
}
