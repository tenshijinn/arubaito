import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'main' | 'signin' | 'register'>('main');
  const [walletIntent, setWalletIntent] = useState<'signin' | 'register'>('register');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { publicKey, signMessage, connected } = useWallet();

  const handleGoogleAuth = async (isSignUp: boolean) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `An error occurred with Google ${isSignUp ? 'registration' : 'sign in'}`,
        variant: "destructive",
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now sign in.",
        });
        setMode('signin');
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

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

  // Handle wallet authentication after connection
  useEffect(() => {
    const authenticateWallet = async () => {
      if (connected && publicKey && signMessage) {
        setLoading(true);
        try {
          // Create a consistent message to sign (no timestamp to ensure same signature)
          const message = `Sign this message to authenticate with CV Checker.\n\nWallet: ${publicKey.toBase58()}`;
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

          console.log('Wallet intent:', walletIntent);
          console.log('Attempting sign in...');
          
          // Try to sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: `${walletAddress}@wallet.local`,
            password: password,
          });

          if (signInError) {
            console.log('Sign in failed:', signInError.message);
            
            // Only proceed with registration if intent is to register
            if (walletIntent === 'register') {
              // If invalid credentials, try to reset the account
              if (signInError.message.includes('Invalid login credentials')) {
                console.log('Resetting wallet account...');
                
                toast({
                  title: "Resetting wallet account",
                  description: "Updating your wallet authentication...",
                });

                // Call edge function to reset the account
                const { data: resetData, error: resetError } = await supabase.functions.invoke('reset-wallet-account', {
                  body: { walletAddress }
                });

                console.log('Reset response:', { resetData, resetError });

                if (resetError) {
                  console.error('Reset failed:', resetError);
                  throw new Error('Failed to reset wallet account. Please try again.');
                }

                // Wait a moment for the deletion to propagate
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log('Attempting sign up after reset...');
                
                // Now try to sign up
                const { error: signUpError } = await supabase.auth.signUp({
                  email: `${walletAddress}@wallet.local`,
                  password: password,
                });

                if (signUpError) {
                  console.error('Sign up failed:', signUpError);
                  throw signUpError;
                }

                toast({
                  title: "Connected!",
                  description: `Authenticated with Phantom`,
                });
                return;
              }
            } else {
              // If intent is sign-in only, show appropriate error
              toast({
                title: "Wallet not registered",
                description: "This wallet hasn't been registered yet. Please register first.",
                variant: "destructive",
              });
              return;
            }

            throw signInError;
          }

          toast({
            title: "Connected!",
            description: `Authenticated with Phantom`,
          });
        } catch (error) {
          console.error('Wallet authentication error:', error);
          toast({
            title: "Authentication failed",
            description: error instanceof Error ? error.message : "Failed to authenticate wallet",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    authenticateWallet();
  }, [connected, publicKey, signMessage, toast, walletIntent]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1d29]">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Welcome to CV Checker
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Card - Email/Google Auth */}
          <Card className="bg-[#242837] border-[#2a2d3d] p-6">
            {mode === 'main' ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleGoogleAuth(true)}
                    className="w-full h-14 bg-[#4A9FE8] hover:bg-[#3a8fd8] text-white text-lg font-medium rounded-xl"
                    disabled={loading}
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Register with Google
                  </Button>
                  
                  <Button
                    onClick={() => setMode('register')}
                    className="w-full h-14 bg-[#2a2d3d] hover:bg-[#3a3d4d] text-white text-lg font-medium rounded-xl"
                  >
                    Register with Email
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#3a3d4d]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#242837] text-gray-400 font-medium">Already have an account?</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleGoogleAuth(false)}
                    variant="outline"
                    className="w-full h-12 bg-transparent border-[#2a2d3d] text-white hover:bg-[#2a2d3d] rounded-xl"
                    disabled={loading}
                  >
                    Sign in with Google
                  </Button>

                  <Button
                    onClick={() => setMode('signin')}
                    variant="outline"
                    className="w-full h-12 bg-transparent border-[#2a2d3d] text-white hover:bg-[#2a2d3d] rounded-xl"
                  >
                    Sign in with Email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {mode === 'register' ? 'Register with Email' : 'Sign in with Email'}
                </h2>
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-[#1a1d29] border-[#2a2d3d] text-white placeholder:text-gray-500 rounded-xl"
                  required
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-[#1a1d29] border-[#2a2d3d] text-white placeholder:text-gray-500 rounded-xl"
                  required
                  minLength={6}
                />
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setMode('main');
                      setEmail("");
                      setPassword("");
                    }}
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
                    {loading ? "Loading..." : mode === 'register' ? 'Register' : 'Sign in'}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Right Card - Wallet Auth */}
          <Card className="bg-[#242837] border-[#2a2d3d] p-6">
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Signup / Signin with Wallet
                </h2>
                <p className="text-gray-400 text-sm">
                  Connect your Phantom wallet to continue
                </p>
              </div>
              
              <WalletMultiButton 
                onClick={() => setWalletIntent('register')}
                className="!h-14 !bg-[#AB9FF2] hover:!bg-[#9b8fe2] !text-white !rounded-xl !font-medium !text-lg !w-full !max-w-sm" 
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
