import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle, XCircle } from "lucide-react";

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

const GuestList = () => {
  const [handle, setHandle] = useState("");
  const [searchResult, setSearchResult] = useState<"found" | "not_found" | null>(null);
  const [searching, setSearching] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const twitterProcessingRef = useRef(false);

  // Handle Twitter OAuth callback
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
            toast({
              title: "Not on Guest List",
              description: "Your Twitter account is not on the guest list.",
              variant: "destructive"
            });
            setAuthLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          const twitterEmail = `${data.user.handle}@twitter.oauth`;
          const twitterPassword = data.user.x_user_id + "_twitter_auth";

          // Check if account already exists
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: twitterEmail,
            password: twitterPassword
          });
          if (!signInError) {
            await supabase.auth.signOut();
            toast({
              title: "Account Already Exists",
              description: "You already have an account. Please use 'Guest Listed Twitter' sign in on /arubaito.",
              variant: "destructive"
            });
            setAuthLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          // Sign up new user
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
          navigate("/club");
        } catch (error) {
          console.error("Twitter OAuth error:", error);
          toast({
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "Failed to authenticate with Twitter",
            variant: "destructive"
          });
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
    try {
      const { data, error } = await supabase
        .from("twitter_whitelist")
        .select("id")
        .ilike("twitter_handle", cleaned)
        .limit(1);

      if (error) throw error;
      setSearchResult(data && data.length > 0 ? "found" : "not_found");
    } catch (error) {
      console.error("Search error:", error);
      toast({ title: "Error", description: "Failed to search the guest list.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleTwitterAuth = async () => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.functions.invoke("twitter-oauth", {
        body: {
          action: "getAuthUrl",
          redirectUri: window.location.origin + "/guestlist"
        }
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

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 font-mono">
      <Card className="w-full max-w-md p-8 bg-transparent border border-primary/40 rounded-xl">
        <h1 className="text-2xl font-bold text-center mb-8 font-display text-primary">
          Is your Twitter on the Guest List?
        </h1>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="@handle"
            value={handle}
            onChange={(e) => { setHandle(e.target.value); setSearchResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-14 text-lg rounded-xl cv-profile-button-input"
          />
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="h-14 px-6 rounded-xl cv-profile-button"
            variant="outline"
          >
            {searching ? "..." : <Search className="w-5 h-5" />}
          </Button>
        </div>

        {/* Result */}
        {searchResult === "found" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/40">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-foreground">You're on the Guest List</span>
            </div>

            <Button
              onClick={handleTwitterAuth}
              disabled={authLoading}
              className="w-full h-14 text-lg font-medium rounded-xl cv-profile-button"
              variant="outline"
            >
              {authLoading ? "Authenticating..." : "Apply with Twitter Guest List"}
            </Button>
          </div>
        )}

        {searchResult === "not_found" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/40">
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
              <span className="text-sm text-foreground">You're not on the Guest List</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              <button
                onClick={() => navigate("/arubaito")}
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Apply with CV Profile
              </button>
              {" "}instead — requires CV Profile Score of 80+
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/arubaito")}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Back
          </button>
        </div>
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
        .cv-profile-button-input {
          border: 1px solid hsl(var(--foreground)) !important;
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default GuestList;
