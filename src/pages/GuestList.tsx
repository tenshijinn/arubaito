import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import guestlistIcon from "@/assets/guestlist-icon.png";

// Twitter OAuth callback handler for /guestlist
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  const twitterCode = urlParams.get("code");
  const twitterState = urlParams.get("state");

  if (twitterCode && twitterState && window.location.pathname === "/guestlist" && sessionStorage.getItem("twitter_code_verifier")) {
    sessionStorage.setItem("twitter_code", twitterCode);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

type SearchResult = "found" | "followed_by" | "not_found" | "rate_limited" | null;

const GuestList = () => {
  const [handle, setHandle] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult>(null);
  const [followedByHandle, setFollowedByHandle] = useState<string | null>(null);
  const [nextCheckDate, setNextCheckDate] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [checkingFollows, setCheckingFollows] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const twitterProcessingRef = useRef(false);

  useEffect(() => {
    const handleTwitterCallback = async () => {
      const twitterCode = sessionStorage.getItem("twitter_code");
      const codeVerifier = sessionStorage.getItem("twitter_code_verifier");
      if (twitterCode && codeVerifier && !twitterProcessingRef.current) {
        twitterProcessingRef.current = true;
        setAuthLoading(true);

        sessionStorage.removeItem("twitter_code");
        sessionStorage.removeItem("twitter_code_verifier");
        sessionStorage.removeItem("auth_intent");

        try {
          const { data, error } = await supabase.functions.invoke("twitter-oauth", {
            body: {
              action: "exchangeToken",
              code: twitterCode,
              codeVerifier,
              redirectUri: window.location.origin + "/guestlist"
            }
          });
          if (error) throw error;

          if (!data.bluechip_verified) {
            toast({ title: "Not on Guest List", description: "Your Twitter account is not on the guest list.", variant: "destructive" });
            setAuthLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          const twitterEmail = `${data.user.handle}@twitter.oauth`;
          const twitterPassword = data.user.x_user_id + "_twitter_auth";

          const { error: signInError } = await supabase.auth.signInWithPassword({ email: twitterEmail, password: twitterPassword });
          if (!signInError) {
            await supabase.auth.signOut();
            toast({ title: "Account Already Exists", description: "You already have an account. Please use 'Guest Listed Twitter' sign in on /arubaito.", variant: "destructive" });
            setAuthLoading(false);
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

          const { error: postSignupSignInError } = await supabase.auth.signInWithPassword({
            email: twitterEmail,
            password: twitterPassword
          });
          if (postSignupSignInError) throw postSignupSignInError;

          toast({ title: "Welcome!", description: `Signed in with Twitter as @${data.user.handle}` });
          navigate("/club");
        } catch (error) {
          console.error("Twitter OAuth error:", error);
          toast({ title: "Authentication Failed", description: error instanceof Error ? error.message : "Failed to authenticate with Twitter", variant: "destructive" });
        } finally {
          setAuthLoading(false);
          twitterProcessingRef.current = false;
        }
      }
    };
    handleTwitterCallback();
  }, [navigate, toast]);

  const handleSearch = async () => {
    const cleaned = handle.trim().replace(/^@/, "");
    if (!cleaned) {
      toast({ title: "Enter a handle", description: "Please enter your Twitter handle to search.", variant: "destructive" });
      return;
    }
    setSearching(true);
    setSearchResult(null);
    setFollowedByHandle(null);
    setSubmitted(false);
    try {
      // Step 1: Check direct whitelist
      const { data, error } = await supabase.from("twitter_whitelist").select("id").ilike("twitter_handle", cleaned).limit(1);
      if (error) throw error;

      if (data && data.length > 0) {
        setSearchResult("found");
        setSearching(false);
        return;
      }

      // Step 2: Not directly on the list — check if followed by someone on the list
      setCheckingFollows(true);
      setSearching(false);

      try {
        const { data: followData, error: followError } = await supabase.functions.invoke("check-guest-list-follows", {
          body: { twitter_handle: cleaned }
        });

        if (followError) throw followError;

        if (followData?.rate_limited && !followData?.found) {
          setNextCheckDate(followData.next_check_at);
          setSearchResult("rate_limited");
        } else if (followData?.found && followData?.followed_by) {
          setFollowedByHandle(followData.followed_by);
          setSearchResult("followed_by");
        } else if (followData?.rate_limited && followData?.found) {
          setFollowedByHandle(followData.followed_by);
          setSearchResult("followed_by");
        } else {
          setSearchResult("not_found");
        }
      } catch (followErr) {
        console.error("Follow check error:", followErr);
        // If follow check fails (rate limit etc.), fall back to not_found
        setSearchResult("not_found");
      } finally {
        setCheckingFollows(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({ title: "Error", description: "Failed to search the guest list.", variant: "destructive" });
      setSearching(false);
    }
  };

  const handleTwitterAuth = async () => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.functions.invoke("twitter-oauth", {
        body: { action: "getAuthUrl", redirectUri: window.location.origin + "/guestlist" }
      });
      if (error) throw error;
      sessionStorage.setItem("twitter_code_verifier", data.codeVerifier);
      sessionStorage.removeItem("auth_intent");
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Twitter auth error:", error);
      toast({ title: "Error", description: "Failed to initiate Twitter authentication", variant: "destructive" });
      setAuthLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    const cleaned = handle.trim().replace(/^@/, "");
    if (!contactEmail.trim()) {
      toast({ title: "Email required", description: "Please enter your email so we can contact you.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-whitelist-request", {
        body: { twitter_handle: cleaned, contact_email: contactEmail.trim() }
      });
      if (error) throw error;
      if (data?.success === false) {
        toast({ title: "Already Submitted", description: data.message, variant: "destructive" });
      } else {
        setSubmitted(true);
        toast({ title: "Submitted", description: "We'll review your profile and get back to you." });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isEligible = searchResult === "found" || searchResult === "followed_by";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 font-mono">
      <img src={guestlistIcon} alt="Guest List" className="w-28 h-auto mb-8" />

      <Card className="w-full max-w-md p-8 bg-transparent border border-foreground/40 rounded-xl">
        <h1 className="text-lg font-bold text-center mb-6 font-display text-primary whitespace-nowrap">
          Is your Twitter on the Guest List?
        </h1>

        <div className="flex gap-2 mb-6">
          <Input
            placeholder="@handle"
            value={handle}
            onChange={(e) => { setHandle(e.target.value); setSearchResult(null); setSubmitted(false); setFollowedByHandle(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 text-base rounded-xl gl-input"
          />
          <Button onClick={handleSearch} disabled={searching || checkingFollows} className="h-12 px-5 rounded-xl gl-btn" variant="outline">
            {searching || checkingFollows ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {checkingFollows && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-muted-foreground/40 mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Checking if you're followed by someone on the Guest List...</span>
          </div>
        )}

        {isEligible && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/40">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-foreground">
                {searchResult === "found"
                  ? "You're on the Guest List"
                  : `You're followed by @${followedByHandle} who is on the Guest List`}
              </span>
            </div>
            <Button onClick={handleTwitterAuth} disabled={authLoading} className="w-full h-12 text-sm font-medium rounded-xl gl-btn" variant="outline">
              {authLoading ? "Authenticating..." : "Apply with Twitter Guest List"}
            </Button>
          </div>
        )}

        {searchResult === "not_found" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/40">
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-xs text-foreground">You're not on the Guest List</span>
            </div>

            <hr className="border-foreground/20" />

            <details className="group">
              <summary className="flex items-center justify-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-primary transition-colors py-1 list-none [&::-webkit-details-marker]:hidden">
                How to get onto the Guest List
                <svg className="w-3 h-3 transition-transform group-open:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
              </summary>
              <div className="text-center space-y-3 pt-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Think your Twitter should've been on the Guest List? Thought Leaders, OGs, KOLs — submit your account and we'll vet your profile and contact you if approved.
                </p>

                {!submitted ? (
                  <>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-12 text-base rounded-xl gl-input"
                    />
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={submitting}
                      className="w-full h-12 text-sm font-medium rounded-xl gl-btn"
                      variant="outline"
                    >
                      {submitting ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-primary">Submitted — we'll be in touch.</p>
                )}
              </div>
            </details>

            <hr className="border-foreground/20" />

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">Alternative Member Application Method</p>
              <Button onClick={() => navigate("/arubaito")} className="w-full h-12 text-sm font-medium rounded-xl gl-btn" variant="outline">
                Apply with CV Profile
              </Button>
              <p className="text-[11px] text-muted-foreground">Requires CV Profile Score of 80+</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => navigate("/arubaito")} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors">
            Back
          </button>
        </div>
      </Card>

      <style>{`
        .gl-btn {
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--foreground)) !important;
          background-color: transparent !important;
        }
        .gl-btn:hover {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--background)) !important;
          border-color: hsl(var(--primary)) !important;
        }
        .gl-input {
          border: 1px solid hsl(var(--foreground)) !important;
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default GuestList;
