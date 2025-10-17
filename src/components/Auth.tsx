import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet } from "lucide-react";
import bs58 from 'bs58';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailMode, setEmailMode] = useState<'input' | 'password'>('input');
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { connect, disconnect, publicKey, signMessage, wallets, select } = useWallet();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred with Google login",
        variant: "destructive",
      });
    }
  };

  const handleEmailContinue = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    setEmailMode('password');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, try to sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Account created!",
          description: "You can now sign in.",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async (walletName: string) => {
    setLoading(true);
    try {
      // Select the wallet
      const wallet = wallets.find(w => w.adapter.name === walletName);
      if (!wallet) {
        throw new Error(`${walletName} wallet not found`);
      }

      select(wallet.adapter.name);
      await connect();

      if (!publicKey || !signMessage) {
        throw new Error("Wallet not connected properly");
      }

      // Create a message to sign
      const message = `Sign this message to authenticate with CV Checker.\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      // Use wallet address as identifier
      const walletAddress = publicKey.toBase58();
      
      // Create a deterministic password from signature
      const signatureString = bs58.encode(signature);
      const walletString = walletAddress + signatureString.slice(0, 32);
      const encoded = new TextEncoder().encode(walletString);
      const buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const password = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);

      // Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${walletAddress}@wallet.local`,
        password: password,
      });

      if (signInError) {
        // Sign up if user doesn't exist
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${walletAddress}@wallet.local`,
          password: password,
        });

        if (signUpError) throw signUpError;
      }

      toast({
        title: "Connected!",
        description: `Authenticated with ${walletName}`,
      });
    } catch (error) {
      await disconnect();
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1d29]">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Welcome to CV Checker
        </h1>
        
        <Card className="bg-[#242837] border-[#2a2d3d] p-6">
          <div className="space-y-6">
            {/* Google Login */}
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-14 bg-[#4A9FE8] hover:bg-[#3a8fd8] text-white text-lg font-medium rounded-xl"
              disabled={loading}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3a3d4d]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#242837] text-gray-400 font-medium">OR</span>
              </div>
            </div>

            {/* Email Input */}
            {emailMode === 'input' ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-[#1a1d29] border-[#2a2d3d] text-white placeholder:text-gray-500 rounded-xl text-lg"
                  />
                </div>
                <Button
                  onClick={handleEmailContinue}
                  className="h-14 px-8 bg-[#2a2d3d] hover:bg-[#3a3d4d] text-white rounded-xl text-lg font-medium"
                >
                  Continue
                </Button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <Input
                  type="email"
                  value={email}
                  readOnly
                  className="h-12 bg-[#1a1d29] border-[#2a2d3d] text-white rounded-xl"
                />
                <Input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-[#1a1d29] border-[#2a2d3d] text-white placeholder:text-gray-500 rounded-xl"
                  required
                  minLength={6}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setEmailMode('input')}
                    variant="outline"
                    className="flex-1 h-12 bg-transparent border-[#2a2d3d] text-white hover:bg-[#2a2d3d] rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-[#4A9FE8] hover:bg-[#3a8fd8] text-white rounded-xl"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Continue"}
                  </Button>
                </div>
              </form>
            )}

            {/* Wallet Options */}
            <div className="grid grid-cols-2 gap-3">
              {/* Phantom */}
              <Button
                onClick={() => handleWalletConnect('Phantom')}
                className="h-20 bg-[#2a2d3d] hover:bg-[#3a3d4d] rounded-xl flex flex-col items-center justify-center gap-2 border border-[#3a3d4d]"
                disabled={loading}
              >
                <div className="w-10 h-10 rounded-lg bg-[#AB9FF2] flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Phantom</span>
              </Button>

              {/* MetaMask */}
              <Button
                onClick={() => handleWalletConnect('MetaMask')}
                className="h-20 bg-[#2a2d3d] hover:bg-[#3a3d4d] rounded-xl flex flex-col items-center justify-center gap-2 border border-[#3a3d4d]"
                disabled={loading}
              >
                <div className="w-10 h-10 rounded-lg bg-[#F6851B] flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-sm font-medium">MetaMask</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
