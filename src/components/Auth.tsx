import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck } from "lucide-react";
import { Web3Auth } from "@web3auth/modal";
import { WEB3AUTH_NETWORK } from "@web3auth/base";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // Web3Auth demo client ID

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const web3AuthInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        });

        await web3AuthInstance.init();
        setWeb3auth(web3AuthInstance);
      } catch (error) {
        console.error("Web3Auth initialization error:", error);
      }
    };

    init();
  }, []);

  const handleLogin = async () => {
    if (!web3auth) {
      toast({
        title: "Error",
        description: "Web3Auth is not initialized yet. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const web3authProvider = await web3auth.connect();
      
      if (!web3authProvider) {
        throw new Error("Failed to connect to Web3Auth");
      }

      const userInfo = await web3auth.getUserInfo();
      
      // Create or sign in user with Supabase using the email from Web3Auth
      if (userInfo.email) {
        // Generate a deterministic password based on the email
        // This ensures the same email always generates the same password
        const encoder = new TextEncoder();
        const data = encoder.encode(userInfo.email + 'cv-checker-secret-salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const password = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
        
        // Try to sign in first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userInfo.email,
          password: password,
        });

        // If sign in fails, try to sign up
        if (signInError) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: userInfo.email,
            password: password,
          });

          if (signUpError) throw signUpError;
        }

        toast({
          title: "Welcome!",
          description: "You have successfully signed in with Web3Auth.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: 'var(--gradient-hero)' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 rounded-full w-fit" 
               style={{ background: 'var(--gradient-primary)' }}>
            <FileCheck className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">CV Checker</CardTitle>
            <CardDescription className="text-base mt-2">
              AI-powered CV analysis to help you land your dream job
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              Sign in securely using Web3Auth
            </p>
          </div>
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            disabled={loading || !web3auth}
            size="lg"
          >
            {loading ? "Connecting..." : !web3auth ? "Initializing..." : "Connect with Web3Auth"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Connect using social logins, wallets, or email
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
