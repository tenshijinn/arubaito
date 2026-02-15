import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TextRotator } from "@/components/TextRotator";

// Twitter OAuth callback handler - for root and arubaito paths
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  const twitterCode = urlParams.get("code");
  const twitterState = urlParams.get("state");

  // Process if on root or arubaito path and we have a stored code verifier
  if (twitterCode && twitterState && (window.location.pathname === "/" || window.location.pathname === "/arubaito") && sessionStorage.getItem("twitter_code_verifier")) {
    sessionStorage.setItem("twitter_code", twitterCode);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"main" | "signin" | "register">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [returningUserLoading, setReturningUserLoading] = useState(false);
  const [bluechipLoading, setBluechipLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const twitterProcessingRef = useRef(false);

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

        // Read the auth intent before clearing
        const authIntent = sessionStorage.getItem("auth_intent");

        // Clear immediately to prevent reuse
        sessionStorage.removeItem("twitter_code");
        sessionStorage.removeItem("twitter_code_verifier");
        sessionStorage.removeItem("auth_intent");

        try {
          const {
            data,
            error
          } = await supabase.functions.invoke("twitter-oauth", {
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

          // --- Returning user path: sign-in only, no signup ---
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

            // Update avatar
            await supabase.auth.updateUser({
              data: { avatar_url: data.user.profile_image_url }
            });

            toast({
              title: "Welcome Back!",
              description: `Signed in as @${data.user.handle}`
            });

            // Route based on whether they have cv_analyses
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

          // --- Bluechip path: check whitelist ---
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

          // --- CV profile or bluechip path: registration only ---
          // Check if user already exists
          const {
            error: signInError
          } = await supabase.auth.signInWithPassword({
            email: twitterEmail,
            password: twitterPassword
          });
          if (!signInError) {
            // User already exists — sign them out and block
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
          // New user — create account
          const {
            error: signUpError
          } = await supabase.auth.signUp({
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

          // Navigate based on auth intent
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
      const {
        data,
        error
      } = await supabase.functions.invoke("twitter-oauth", {
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
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
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
      toast({
        title: "Error",
        description: "Please enter your email and password",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "You are now signed in and can upload your CV."
        });
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

    return <div className="min-h-screen flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-5xl">
        <div className="flex justify-center">
          <Card className="p-6 w-full max-w-md bg-transparent" style={{
          borderColor: "hsl(var(--border))"
        }}>
            {mode === "main" ? <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center font-mono" style={{
                color: "hsl(var(--muted-foreground))"
              }}>
                    Sign in with
                  </p>

                  {/* Universal returning user login */}
                  <Button onClick={() => {
                    sessionStorage.setItem("auth_intent", "returning_user");
                    handleTwitterAuth("returning");
                  }} className="w-full h-14 text-lg font-medium rounded-xl" variant="default" disabled={loading || returningUserLoading || bluechipLoading}>
                    {returningUserLoading ? "Authenticating..." : "X / Twitter"}
                  </Button>

                  <div className="wallet-button-wrapper w-full">
                    <button disabled className="member-nft-button !h-14 !rounded-xl !font-medium !text-lg !w-full">
                      <span className="default-text">Member NFT</span>
                      <span className="hover-text">Free Mint Soon</span>
                    </button>
                  </div>
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
                      border: 4px solid hsl(var(--muted-foreground)) !important;
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      gap: 0.5rem !important;
                      padding-left: 2rem !important;
                      padding-right: 2rem !important;
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
                  `}</style>

                  <div className="flex justify-center text-sm py-2">
                    <span className="font-medium" style={{
                  color: "hsl(var(--muted-foreground))"
                }}>
                      Apply for Membership
                    </span>
                  </div>

                  {/* Bluechip whitelist check path */}
                  <Button onClick={() => {
                    sessionStorage.removeItem("auth_intent");
                    handleTwitterAuth("bluechip");
                  }} className="w-full h-14 text-lg font-medium rounded-xl" variant="outline" disabled={loading || returningUserLoading || bluechipLoading}>
                    {bluechipLoading ? "Authenticating..." : "Blue Chip Twitter"}
                  </Button>

                  <Button onClick={() => setMode("register")} className="w-full h-14 text-lg font-medium rounded-xl cv-profile-button" variant="secondary">
                    Continue with CV Profile
                  </Button>
                  <style>{`
                    .cv-profile-button {
                      color: #f0e3c3 !important;
                      border-color: #f0e3c3 !important;
                    }
                    .cv-profile-button:hover {
                      background-color: hsl(var(--primary)) !important;
                      color: hsl(var(--background)) !important;
                      border-color: #ED565a !important;
                    }
                  `}</style>
                </div>
             </div> : mode === "register" ? <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4" style={{
              color: "hsl(var(--foreground))"
            }}>
                  Sign up with X to Continue
                </h2>

                <div className="space-y-3 mb-6 p-4 rounded-lg bg-accent/30 border">
                  <p className="text-sm font-medium text-foreground">Apply for Arubaito Club membership</p>
                  <p className="text-sm text-muted-foreground">Sign up with your X account to:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Create your Web3 CV Profile</li>
                    <li>• Get AI-powered CV analysis & scoring</li>
                    <li>• Qualify for club membership (score 80+)</li>
                    <li>• Unlock free Member NFT mint (coming soon)</li>
                  </ul>
                </div>

                <Button onClick={() => {
                  sessionStorage.setItem("auth_intent", "cv_profile");
                  handleTwitterAuth("bluechip");
                }} className="w-full h-14 text-lg font-medium rounded-xl" variant="default" disabled={loading || returningUserLoading || bluechipLoading}>
                  {bluechipLoading ? "Authenticating..." : "Continue with X"}
                </Button>

                <Button type="button" variant="ghost" onClick={() => setMode("main")} className="w-full" disabled={loading}>
                  Back
                </Button>
              </div> : <form onSubmit={handleEmailSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-4" style={{
              color: "hsl(var(--foreground))"
            }}>
                  Sign in with Email
                </h2>

                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl" required />

                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" required minLength={6} />

                <div className="flex gap-2">
                  <Button type="button" onClick={() => {
                setMode("main");
                setEmail("");
                setPassword("");
              }} variant="outline" className="flex-1 h-12 rounded-xl">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={loading}>
                    {loading ? "Loading..." : "Sign in"}
                  </Button>
                </div>
              </form>}
          </Card>
        </div>
      </div>
    </div>;
};
