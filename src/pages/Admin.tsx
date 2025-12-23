import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Shield, MessageSquare, Briefcase, Database, Trophy, History } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminUsersSection,
  AdminWhitelistSection,
  AdminCommunitySection,
  AdminJobsSection,
  AdminReiRegistrySection,
  AdminPointsSection,
  AdminAuditLogSection,
} from "@/components/admin";

// Twitter OAuth callback handler for admin path
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search);
  const twitterCode = urlParams.get("code");
  const twitterState = urlParams.get("state");

  if (
    twitterCode &&
    twitterState &&
    window.location.pathname === "/admin" &&
    sessionStorage.getItem("admin_twitter_code_verifier")
  ) {
    sessionStorage.setItem("admin_twitter_code", twitterCode);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [adminHandle, setAdminHandle] = useState<string>("admin");
  const twitterProcessingRef = useRef(false);

  // Handle Twitter OAuth callback
  useEffect(() => {
    const handleTwitterCallback = async () => {
      const twitterCode = sessionStorage.getItem("admin_twitter_code");
      const codeVerifier = sessionStorage.getItem("admin_twitter_code_verifier");

      if (twitterCode && codeVerifier && !twitterProcessingRef.current) {
        twitterProcessingRef.current = true;
        setIsAuthenticating(true);

        // Clear immediately to prevent reuse
        sessionStorage.removeItem("admin_twitter_code");
        sessionStorage.removeItem("admin_twitter_code_verifier");

        try {
          const { data, error } = await supabase.functions.invoke("twitter-oauth", {
            body: {
              action: "exchangeToken",
              code: twitterCode,
              codeVerifier,
              redirectUri: `${window.location.origin}/admin`,
              skipWhitelistCheck: true, // Admin doesn't need whitelist check
            },
          });

          if (error) throw error;

          // Check if user is wayneanthonyd (case-insensitive)
          if (data.user.handle?.toLowerCase() !== "wayneanthonyd") {
            toast({
              title: "Access Denied",
              description: "Only @wayneanthonyd can access the admin panel",
              variant: "destructive",
            });
            setIsAuthenticating(false);
            setLoading(false);
            twitterProcessingRef.current = false;
            return;
          }

          setAdminHandle(data.user.handle);

          // Create/sign in user with Twitter data
          const twitterEmail = `${data.user.handle}@twitter.oauth`;
          const twitterPassword = data.user.x_user_id + "_twitter_auth";

          // Try to sign in first
          let authResult = await supabase.auth.signInWithPassword({
            email: twitterEmail,
            password: twitterPassword,
          });

          if (authResult.error) {
            // If sign in fails, create account
            authResult = await supabase.auth.signUp({
              email: twitterEmail,
              password: twitterPassword,
              options: {
                data: {
                  twitter_username: data.user.handle,
                  twitter_id: data.user.x_user_id,
                  full_name: data.user.display_name,
                  avatar_url: data.user.profile_image_url,
                },
              },
            });
            if (authResult.error) throw authResult.error;
          }

          toast({
            title: "Welcome!",
            description: `Signed in as @${data.user.handle}`,
          });

          // Wait a moment for auth state to stabilize, then check admin status
          await new Promise((resolve) => setTimeout(resolve, 500));
          await checkAdminStatus();
        } catch (error) {
          console.error("Twitter OAuth error:", error);
          toast({
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "Failed to authenticate with Twitter",
            variant: "destructive",
          });
          setLoading(false);
        } finally {
          setIsAuthenticating(false);
          twitterProcessingRef.current = false;
        }
      }
    };
    handleTwitterCallback();
  }, [toast]);

  useEffect(() => {
    // Only check existing session if we're not processing a callback
    if (!sessionStorage.getItem("admin_twitter_code")) {
      checkTwitterAuth();
    }
  }, []);

  const checkTwitterAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user is logged in with Twitter and has correct username
      const twitterUsername = session.user.user_metadata?.twitter_username;

      if (twitterUsername?.toLowerCase() !== "wayneanthonyd") {
        toast({
          title: "Access Denied",
          description: "Only @wayneanthonyd can access the admin panel",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setAdminHandle(twitterUsername);
      // Valid Twitter user, now check admin role
      await checkAdminStatus();
    } catch (error) {
      console.error("Error checking Twitter auth:", error);
      setLoading(false);
    }
  };

  const handleTwitterLogin = async () => {
    setIsAuthenticating(true);
    try {
      const { data, error } = await supabase.functions.invoke("twitter-oauth", {
        body: {
          action: "getAuthUrl",
          redirectUri: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;

      sessionStorage.setItem("admin_twitter_code_verifier", data.codeVerifier);
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Twitter login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login with Twitter",
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground font-mono">ADMIN LOGIN</h1>
            <p className="text-sm text-muted-foreground">Restricted Access</p>
          </div>
          <Button onClick={handleTwitterLogin} disabled={isAuthenticating} className="w-full font-mono" size="lg">
            {isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Login with Twitter"
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform data and configurations</p>
        </div>

        <Tabs defaultValue="whitelist" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="whitelist" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Whitelist</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="registry" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">REI Registry</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Points</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsersSection adminHandle={adminHandle} />
          </TabsContent>

          <TabsContent value="whitelist">
            <AdminWhitelistSection adminHandle={adminHandle} />
          </TabsContent>

          <TabsContent value="community">
            <AdminCommunitySection adminHandle={adminHandle} />
          </TabsContent>

          <TabsContent value="jobs">
            <AdminJobsSection adminHandle={adminHandle} />
          </TabsContent>

          <TabsContent value="registry">
            <AdminReiRegistrySection adminHandle={adminHandle} />
          </TabsContent>

          <TabsContent value="points">
            <AdminPointsSection adminHandle={adminHandle} />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditLogSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
