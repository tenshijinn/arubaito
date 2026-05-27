import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import logoNoWordmark from '@/assets/logo-no-wordmark.png';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useBlockClock } from "@/hooks/useBlockClock";
import { BlockClockDisplay } from "./BlockClockDisplay";
import { BlockClockTimer } from "./BlockClockTimer";

// Twitter OAuth callback handler - for root and arubaito paths
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  const twitterCode = urlParams.get("code");
  const twitterState = urlParams.get("state");

  if (twitterCode && twitterState && (window.location.pathname === "/" || window.location.pathname === "/arubaito") && sessionStorage.getItem("twitter_code_verifier")) {
    sessionStorage.setItem("twitter_code", twitterCode);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"main" | "apply" | "signin" | "register">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [returningUserLoading, setReturningUserLoading] = useState(false);
  const [bluechipLoading, setBluechipLoading] = useState(false);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderSubmitted, setReminderSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const twitterProcessingRef = useRef(false);
  const blockClock = useBlockClock();

  const handleReminderSubmit = async (emailToSubmit?: string) => {
    const targetEmail = emailToSubmit || reminderEmail;
    if (!targetEmail) return;
    try {
      await supabase.from("block_clock_reminders" as any).insert({ email: targetEmail } as any);
      setReminderSubmitted(true);
      toast({ title: "Reminder Set!", description: "We'll notify you when signup opens." });
    } catch {
      toast({ title: "Error", description: "Failed to save reminder", variant: "destructive" });
    }
  };

  // Handle Twitter OAuth callback
  useEffect(() => {
    const handleTwitterCallback = async () => {
      const twitterCode = sessionStorage.getItem("twitter_code");
      const codeVerifier = sessionStorage.getItem("twitter_code_verifier");
      if (twitterCode && codeVerifier && !twitterProcessingRef.current) {
        twitterProcessingRef.current = true;
        const isReturning = sessionStorage.getItem("auth_intent") === "returning_user";
        if (isReturning) setReturningUserLoading(true);
        else setBluechipLoading(true);

        const authIntent = sessionStorage.getItem("auth_intent");

        sessionStorage.removeItem("twitter_code");
        sessionStorage.removeItem("twitter_code_verifier");
        sessionStorage.removeItem("auth_intent");

        try {
          const { data, error } = await supabase.functions.invoke("twitter-oauth", {
            body: {
              action: "exchangeToken",
              code: twitterCode,
              codeVerifier,
              redirectUri: window.location.origin + window.location.pathname
            }
          });
          if (error) throw error;

          const twitterEmail = `${data.user.handle}@twitter.oauth`;
          const twitterPassword = data.user.x_user_id + "_twitter_auth";

          if (authIntent === "returning_user") {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: twitterEmail,
              password: twitterPassword
            });
            if (signInError) {
              toast({
                title: "No Account Found",
                description: "No account found for this X account. Please apply for membership first.",
                variant: "destructive"
              });
              setReturningUserLoading(false);
              twitterProcessingRef.current = false;
              return;
            }

            await supabase.auth.updateUser({
              data: { avatar_url: data.user.profile_image_url }
            });

            toast({
              title: "Welcome Back!",
              description: `Signed in as @${data.user.handle}`
            });

            const { data: session } = await supabase.auth.getSession();
            const userId = session?.session?.user?.id;
            if (userId) {
              const { data: cvData } = await supabase
                .from("cv_analyses")
                .select("id")
                .eq("user_id", userId)
                .limit(1);
              navigate(cvData && cvData.length > 0 ? "/arubaito" : "/club");
            } else {
              navigate("/club");
            }
            setReturningUserLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          if (authIntent !== "cv_profile" && !data.bluechip_verified) {
            toast({
              title: "Access Denied",
              description: "Your Twitter account is not on the bluechip whitelist.",
              variant: "destructive"
            });
            setBluechipLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: twitterEmail,
            password: twitterPassword
          });
          if (!signInError) {
            await supabase.auth.signOut();
            toast({
              title: "Account Already Exists",
              description: "You already have an account. Please use 'Sign in with X / Twitter' to log in.",
              variant: "destructive"
            });
            setBluechipLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          const { error: signUpError } = await supabase.auth.signUp({
            email: twitterEmail,
            password: twitterPassword,
            options: {
              data: {
                twitter_username: data.user.handle,
                twitter_id: data.user.x_user_id,
                full_name: data.user.display_name,
                avatar_url: data.user.profile_image_url
              }
            }
          });
          if (signUpError) throw signUpError;
          toast({
            title: "Welcome!",
            description: `Signed in with Twitter as @${data.user.handle}`
          });

          navigate(authIntent === "cv_profile" ? "/arubaito" : "/club");
        } catch (error) {
          console.error("Twitter OAuth error:", error);
          toast({
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "Failed to authenticate with Twitter",
            variant: "destructive"
          });
        } finally {
          setReturningUserLoading(false);
          setBluechipLoading(false);
          twitterProcessingRef.current = false;
        }
      }
    };
    handleTwitterCallback();
  }, [navigate, toast]);

  const handleTwitterAuth = async (flow: "returning" | "bluechip") => {
    try {
      if (flow === "returning") setReturningUserLoading(true);
      else setBluechipLoading(true);
      const { data, error } = await supabase.functions.invoke("twitter-oauth", {
        body: {
          action: "getAuthUrl",
          redirectUri: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
      sessionStorage.setItem("twitter_code_verifier", data.codeVerifier);
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Twitter auth error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Twitter authentication",
        variant: "destructive"
      });
      setReturningUserLoading(false);
      setBluechipLoading(false);
    }
  };

  const handleGoogleAuth = async (isSignUp: boolean) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `An error occurred with Google ${isSignUp ? "registration" : "sign in"}`,
        variant: "destructive"
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter your email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Account created!", description: "You are now signed in and can upload your CV." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You have successfully signed in." });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "An error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-mono">
      {/* Left side — Auth content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-16 py-12 lg:py-0">
        <div className="w-full max-w-md">
          {/* Logo + tagline above card */}
          {(mode === "main" || mode === "apply") && (
            <div className="flex flex-col items-center mb-8">
              <img src={logoNoWordmark} alt="Arubaito" className="h-16 w-auto mb-3" />
              <p className="text-sm text-muted-foreground tracking-widest uppercase">Private Members Network Club</p>
            </div>
          )}

          {mode === "main" ? (
            <div className="space-y-4">
              {/* Members sign-in card — inverted feature card */}
              <Card className="feature-card-dark p-8 rounded-[20px] shadow-none">
                <h2 className="text-2xl font-bold text-center mb-2 font-display tracking-tight" style={{ color: "#faf1e1" }}>
                  Members
                </h2>
                <p className="text-xs uppercase tracking-[0.18em] text-center mb-6" style={{ color: "rgba(239,226,201,0.55)" }}>
                  Sign in With
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      sessionStorage.setItem("auth_intent", "returning_user");
                      handleTwitterAuth("returning");
                    }}
                    className="w-full h-14 text-base font-medium rounded-full cv-profile-button"
                    variant="outline"
                    disabled={loading || returningUserLoading || bluechipLoading}
                  >
                    {returningUserLoading ? "Authenticating..." : "Twitter Guest List"}
                  </Button>

                  <div className="wallet-button-wrapper w-full">
                    <button disabled className="member-nft-button !h-14 !rounded-full !font-medium !text-base !w-full">
                      <span className="default-text">Member NFT</span>
                      <span className="hover-text">Free Mint Soon</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-center mt-6" style={{ color: "rgba(239,226,201,0.55)" }}>
                  Not a member yet?{" "}
                  <button
                    onClick={() => setMode("apply")}
                    className="font-bold hover:underline"
                    style={{ color: "#ed565a" }}
                  >
                    Apply to Join
                  </button>
                </p>
              </Card>
            </div>

          ) : mode === "apply" ? (
            <div className="space-y-4">
              <Card className="feature-card-dark p-8 rounded-[20px] shadow-none">
              {blockClock.loading ? (
                  <div className="text-center py-8">
                    <div className="font-mono text-sm animate-pulse" style={{ color: "rgba(239,226,201,0.55)" }}>Loading...</div>
                  </div>
                ) : blockClock.state === "countdown" ? (
                  <>
                    <BlockClockDisplay
                      currentBlock={blockClock.currentBlock}
                      targetBlock={blockClock.targetBlock}
                      progress={blockClock.progress}
                      timeRemaining={blockClock.timeRemaining}
                      blocksRemaining={blockClock.blocksRemaining}
                      onReminderSubmit={async (email) => {
                        await handleReminderSubmit(email);
                      }}
                      reminderSubmitted={reminderSubmitted}
                    />
                  </>
                ) : blockClock.state === "closed" ? (
                  <div className="text-center py-4">
                    <p className="font-mono text-sm" style={{ color: '#ed565a' }}>
                      Application window has closed
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-center mb-2 font-display tracking-tight" style={{ color: "#faf1e1" }}>
                      Apply for Membership
                    </h2>
                    <p className="text-xs uppercase tracking-[0.18em] text-center mb-6" style={{ color: "rgba(239,226,201,0.55)" }}>
                      Choose how you'd like to apply
                    </p>

                    {blockClock.state === "open" && (
                      <div className="mb-4">
                        <BlockClockTimer secondsRemaining={blockClock.signupWindowRemaining} compact />
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate("/guestlist")}
                        className="w-full h-14 text-base font-medium rounded-full cv-profile-button"
                        variant="outline"
                      >
                        Twitter Guest List
                      </Button>

                      <Button
                        onClick={() => setMode("register")}
                        className="w-full h-14 text-base font-medium rounded-full cv-profile-button"
                        variant="secondary"
                      >
                        CV Profile
                      </Button>
                    </div>
                  </>
                )}

                <p className="text-sm text-center mt-6" style={{ color: "rgba(239,226,201,0.55)" }}>
                  Already a member?{" "}
                  <button
                    onClick={() => setMode("main")}
                    className="font-bold hover:underline"
                    style={{ color: "#ed565a" }}
                  >
                    Sign in
                  </button>
                </p>
              </Card>
            </div>
          ) : mode === "register" ? (
            <div className="space-y-4">
              <Card className="feature-card-dark p-8 rounded-[20px] shadow-none">
                <h2 className="text-xl font-bold text-center mb-2 font-display tracking-tight" style={{ color: "#faf1e1" }}>
                  Sign up with Twitter
                </h2>
                <p className="text-xs uppercase tracking-[0.18em] text-center mb-6" style={{ color: "rgba(239,226,201,0.55)" }}>
                  to continue
                </p>

                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium" style={{ color: "#faf1e1" }}>Apply for Arubaito Club membership</p>
                  <p className="text-sm" style={{ color: "rgba(239,226,201,0.55)" }}>Sign up with your X account to:</p>
                  <ul className="text-sm space-y-1 ml-4" style={{ color: "rgba(239,226,201,0.55)" }}>
                    <li>• Create your Web3 CV Profile</li>
                    <li>• Get AI-powered CV analysis & scoring</li>
                    <li>• Qualify for club membership (score 80+)</li>
                    <li>• Unlock free Member NFT mint (coming soon)</li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    sessionStorage.setItem("auth_intent", "cv_profile");
                    handleTwitterAuth("bluechip");
                  }}
                  className="w-full h-14 text-base font-medium rounded-full hover:opacity-90"
                  style={{ backgroundColor: "#ed565a", color: "#faf1e1", border: "none" }}
                  disabled={loading || returningUserLoading || bluechipLoading}
                >
                  {bluechipLoading ? "Authenticating..." : "Continue with Twitter"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode("apply")}
                  className="w-full mt-2 rounded-full hover:bg-transparent"
                  style={{ color: "rgba(239,226,201,0.55)" }}
                  disabled={loading}
                >
                  Back
                </Button>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="feature-card-dark p-8 rounded-[20px] shadow-none">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <h2 className="text-2xl font-bold text-center mb-2 font-display tracking-tight" style={{ color: "#faf1e1" }}>
                    Sign in with Email
                  </h2>
                  <p className="text-xs uppercase tracking-[0.18em] text-center mb-6" style={{ color: "rgba(239,226,201,0.55)" }}>
                    Members only
                  </p>

                  <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-full feature-card-input" required />
                  <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-full feature-card-input" required minLength={6} />

                  <div className="flex gap-2 pt-2">
                    <Button type="button" onClick={() => { setMode("main"); setEmail(""); setPassword(""); }} variant="outline" className="flex-1 h-12 rounded-full cv-profile-button">
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 rounded-full hover:opacity-90"
                      style={{ backgroundColor: "#ed565a", color: "#faf1e1", border: "none" }}
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Sign in"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Shared inverted feature card styles */}
          <style>{`
            .feature-card-dark {
              background-color: #181818 !important;
              border: 1.5px solid rgba(239,226,201,0.18) !important;
            }
            .wallet-button-wrapper {
              width: 100% !important;
              display: block !important;
            }
            .wallet-button-wrapper > * {
              width: 100% !important;
            }
            .member-nft-button {
              height: 3.5rem !important;
              border-radius: 9999px !important;
              font-size: 1rem !important;
              font-weight: 500 !important;
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              background-color: transparent !important;
              color: rgba(239,226,201,0.55) !important;
              border: 1.5px solid rgba(239,226,201,0.18) !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 0.5rem !important;
              transition: all 0.2s ease !important;
              cursor: not-allowed !important;
              opacity: 0.7 !important;
            }
            .member-nft-button .hover-text { display: none !important; }
            .member-nft-button:hover .default-text { display: none !important; }
            .member-nft-button:hover .hover-text { display: inline !important; }
            .member-nft-button:hover {
              border-color: #faf1e1 !important;
              color: #faf1e1 !important;
            }
            .cv-profile-button {
              color: #faf1e1 !important;
              border: 1.5px solid rgba(239,226,201,0.18) !important;
              background-color: transparent !important;
              border-radius: 9999px !important;
            }
            .cv-profile-button:hover {
              background-color: #faf1e1 !important;
              color: #181818 !important;
              border-color: #faf1e1 !important;
            }
            .feature-card-input {
              background-color: transparent !important;
              border: 1.5px solid rgba(239,226,201,0.18) !important;
              color: #faf1e1 !important;
            }
            .feature-card-input::placeholder {
              color: rgba(239,226,201,0.4) !important;
            }
          `}</style>



        </div>
      </div>

      {/* Right side — ASCII Art */}
      <div className="w-full lg:w-1/2 relative min-h-[50vh] lg:min-h-screen">
        <iframe
          src="/ascii/arubaito.html"
          className="absolute inset-0 w-full h-full border-0"
          style={{ backgroundColor: "#181818" }}
          title="Arubaito ASCII Art"
        />
      </div>
    </div>
  );
};
