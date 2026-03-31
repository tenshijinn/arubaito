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

  const handleReminderSubmit = async () => {
    if (!reminderEmail) return;
    try {
      await supabase.from("block_clock_reminders" as any).insert({ email: reminderEmail } as any);
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
              {/* Members sign-in card */}
              <Card className="p-8 bg-transparent border border-primary/40 rounded-xl">
                {blockClock.state === "countdown" && !blockClock.loading ? (
                  <>
                    <BlockClockDisplay
                      currentBlock={blockClock.currentBlock}
                      targetBlock={blockClock.targetBlock}
                      progress={blockClock.progress}
                      timeRemaining={blockClock.timeRemaining}
                      blocksRemaining={blockClock.blocksRemaining}
                    />

                    {/* Email reminder */}
                    <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(237, 86, 90, 0.15)' }}>
                      <p className="font-mono text-[10px] opacity-60 tracking-widest uppercase mb-2" style={{ color: '#ed565a' }}>
                        Get notified when signup opens
                      </p>
                      {!reminderSubmitted ? (
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={reminderEmail}
                            onChange={(e) => setReminderEmail(e.target.value)}
                            className="h-8 text-xs font-mono rounded"
                            style={{ borderColor: 'rgba(237, 86, 90, 0.3)' }}
                          />
                          <Button
                            onClick={handleReminderSubmit}
                            size="sm"
                            className="h-8 text-xs font-mono px-3 rounded"
                            style={{ backgroundColor: '#ed565a', color: '#000' }}
                          >
                            Notify Me
                          </Button>
                        </div>
                      ) : (
                        <p className="font-mono text-[10px]" style={{ color: '#ed565a' }}>
                          ✓ We'll email you when signup opens
                        </p>
                      )}
                    </div>
                  </>
                ) : blockClock.state === "open" && !blockClock.loading ? (
                  <>
                    {/* 1-hour countdown timer integrated at top */}
                    <div className="mb-5">
                      <BlockClockTimer secondsRemaining={blockClock.signupWindowRemaining} />
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2 font-display text-primary">
                      Members
                    </h2>
                    <p className="text-sm text-center mb-6 text-muted-foreground">
                      Sign in With
                    </p>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          sessionStorage.setItem("auth_intent", "returning_user");
                          handleTwitterAuth("returning");
                        }}
                        className="w-full h-14 text-lg font-medium rounded-xl cv-profile-button"
                        variant="outline"
                        disabled={loading || returningUserLoading || bluechipLoading}
                      >
                        {returningUserLoading ? "Authenticating..." : "Guest Listed Twitter"}
                      </Button>

                      <div className="wallet-button-wrapper w-full">
                        <button disabled className="member-nft-button !h-14 !rounded-xl !font-medium !text-lg !w-full">
                          <span className="default-text">Member NFT</span>
                          <span className="hover-text">Free Mint Soon</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : blockClock.state === "closed" && !blockClock.loading ? (
                  <div className="text-center py-4">
                    <p className="font-mono text-sm" style={{ color: '#ed565a' }}>
                      Signup window has closed
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-2">
                      The next signup period will be announced soon
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-center mb-2 font-display text-primary">
                      Members
                    </h2>
                    <p className="text-sm text-center mb-6 text-muted-foreground">
                      Sign in With
                    </p>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          sessionStorage.setItem("auth_intent", "returning_user");
                          handleTwitterAuth("returning");
                        }}
                        className="w-full h-14 text-lg font-medium rounded-xl cv-profile-button"
                        variant="outline"
                        disabled={loading || returningUserLoading || bluechipLoading}
                      >
                        {returningUserLoading ? "Authenticating..." : "Guest Listed Twitter"}
                      </Button>

                      <div className="wallet-button-wrapper w-full">
                        <button disabled className="member-nft-button !h-14 !rounded-xl !font-medium !text-lg !w-full">
                          <span className="default-text">Member NFT</span>
                          <span className="hover-text">Free Mint Soon</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <p className="text-sm text-center mt-6 text-muted-foreground">
                  Not a member yet?{" "}
                  <button
                    onClick={() => setMode("apply")}
                    className="font-bold text-primary hover:underline"
                  >
                    Apply to Join
                  </button>
                </p>
              </Card>

              <style>{`
                .wallet-button-wrapper {
                  width: 100% !important;
                  display: block !important;
                }
                .wallet-button-wrapper > * {
                  width: 100% !important;
                }
                .member-nft-button {
                  height: 3.5rem !important;
                  border-radius: 0.75rem !important;
                  font-size: 1.125rem !important;
                  font-weight: 500 !important;
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                  background-color: transparent !important;
                  color: hsl(var(--muted-foreground)) !important;
                  border: 1px solid hsl(var(--foreground)) !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  gap: 0.5rem !important;
                  transition: all 0.2s ease !important;
                  cursor: not-allowed !important;
                  opacity: 0.7 !important;
                }
                .member-nft-button .hover-text {
                  display: none !important;
                }
                .member-nft-button:hover .default-text {
                  display: none !important;
                }
                .member-nft-button:hover .hover-text {
                  display: inline !important;
                }
                .member-nft-button:hover {
                  border-color: hsl(var(--primary)) !important;
                  color: hsl(var(--primary)) !important;
                }
                .cv-profile-button {
                  color: hsl(var(--foreground)) !important;
                  border: 1px solid hsl(var(--foreground)) !important;
                  background-color: transparent !important;
                }
                .cv-profile-button:hover {
                  background-color: hsl(var(--primary)) !important;
                  color: hsl(var(--background)) !important;
                  border-color: hsl(var(--primary)) !important;
                }
              `}</style>
            </div>
          ) : mode === "apply" ? (
            <div className="space-y-4">
              <Card className="p-8 bg-transparent border border-primary/40 rounded-xl">
                {blockClock.state === "countdown" && !blockClock.loading ? (
                  <>
                    <BlockClockDisplay
                      currentBlock={blockClock.currentBlock}
                      targetBlock={blockClock.targetBlock}
                      progress={blockClock.progress}
                      timeRemaining={blockClock.timeRemaining}
                      blocksRemaining={blockClock.blocksRemaining}
                    />
                    <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(237, 86, 90, 0.15)' }}>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        Applications open when the block clock unlocks
                      </p>
                    </div>
                  </>
                ) : blockClock.state === "closed" && !blockClock.loading ? (
                  <div className="text-center py-4">
                    <p className="font-mono text-sm" style={{ color: '#ed565a' }}>
                      Application window has closed
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-center mb-2 font-display text-primary">
                      Apply for Membership
                    </h2>
                    <p className="text-sm text-center mb-6 text-muted-foreground">
                      Choose how you'd like to apply
                    </p>

                    {blockClock.state === "open" && !blockClock.loading && (
                      <div className="mb-4">
                        <BlockClockTimer secondsRemaining={blockClock.signupWindowRemaining} compact />
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate("/guestlist")}
                        className="w-full h-14 text-base md:text-lg font-medium rounded-xl cv-profile-button"
                        variant="outline"
                      >
                        Twitter Guest List
                      </Button>

                      <Button
                        onClick={() => setMode("register")}
                        className="w-full h-14 text-base md:text-lg font-medium rounded-xl cv-profile-button"
                        variant="secondary"
                      >
                        CV Profile
                      </Button>
                    </div>
                  </>
                )}

                <p className="text-sm text-center mt-6 text-muted-foreground">
                  Already a member?{" "}
                  <button
                    onClick={() => setMode("main")}
                    className="font-bold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </Card>

              <style>{`
                .cv-profile-button {
                  color: hsl(var(--foreground)) !important;
                  border: 1px solid hsl(var(--foreground)) !important;
                  background-color: transparent !important;
                }
                .cv-profile-button:hover {
                  background-color: hsl(var(--primary)) !important;
                  color: hsl(var(--background)) !important;
                  border-color: hsl(var(--primary)) !important;
                }
              `}</style>
            </div>
          ) : mode === "register" ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Sign up with Twitter to Continue
              </h2>

              <div className="space-y-3 mb-6 p-4">
                <p className="text-sm font-medium text-foreground">Apply for Arubaito Club membership</p>
                <p className="text-sm text-muted-foreground">Sign up with your X account to:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
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
                className="w-full h-14 text-lg font-medium rounded-xl"
                variant="default"
                disabled={loading || returningUserLoading || bluechipLoading}
              >
                {bluechipLoading ? "Authenticating..." : "Continue with Twitter"}
              </Button>

              <Button type="button" variant="ghost" onClick={() => setMode("main")} className="w-full" disabled={loading}>
                Back
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Sign in with Email
              </h2>

              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl" required />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" required minLength={6} />

              <div className="flex gap-2">
                <Button type="button" onClick={() => { setMode("main"); setEmail(""); setPassword(""); }} variant="outline" className="flex-1 h-12 rounded-xl">
                  Back
                </Button>
                <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={loading}>
                  {loading ? "Loading..." : "Sign in"}
                </Button>
              </div>
            </form>
          )}
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
