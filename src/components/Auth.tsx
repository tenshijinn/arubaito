import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import bs58 from 'bs58';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'main' | 'signin' | 'register'>('main');
  const [walletIntent, setWalletIntent] = useState<'signin' | 'register'>('register');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { publicKey, signMessage, connected } = useWallet();
  const navigate = useNavigate();

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
          description: "You are now signed in and can upload your CV.",
        });
        // User is now automatically logged in, no need to change mode or navigate
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
    <div className="min-h-screen flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8" style={{ color: 'hsl(var(--foreground))' }}>
          Welcome to CV Checker
        </h1>
        
        <div className="flex justify-center">
          <Card className="p-6 w-full max-w-md" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            {mode === 'main' ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Sign up/sign in with...
                  </p>
                  <Button
                    onClick={() => handleGoogleAuth(true)}
                    className="w-full h-14 text-lg font-medium rounded-xl"
                    variant="default"
                    disabled={loading}
                  >
                    Blue Chip Twitter
                  </Button>
                  
                  <div className="wallet-button-wrapper w-full">
                    <WalletMultiButton 
                      onClick={() => setWalletIntent('register')}
                      className="!h-14 !rounded-xl !font-medium !text-lg !w-full" 
                    />
                  </div>
                  <style>{`
                    .wallet-button-wrapper button {
                      height: 3.5rem !important;
                      border-radius: 0.75rem !important;
                      font-size: 1.125rem !important;
                      font-weight: 500 !important;
                      width: 100% !important;
                      background-color: transparent !important;
                      color: hsl(var(--primary)) !important;
                      border: 4px solid hsl(var(--primary)) !important;
                    }
                    .wallet-button-wrapper button::before {
                      content: 'Member NFT' !important;
                    }
                    .wallet-button-wrapper button span {
                      display: none !important;
                    }
                  `}</style>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: 'hsl(var(--border))' }}></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 font-medium" style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))' }}>or</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setMode('register')}
                    className="w-full h-14 text-lg font-medium rounded-xl"
                    variant="secondary"
                  >
                    Signup with CV Profile
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                  {mode === 'register' ? 'Register with Email' : 'Sign in with Email'}
                </h2>
                
                {mode === 'register' && (
                  <Button
                    type="button"
                    onClick={() => handleGoogleAuth(true)}
                    variant="outline"
                    className="w-full h-12 rounded-xl mb-4"
                    disabled={loading}
                  >
                    Register with Google
                  </Button>
                )}
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl"
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
                    className="flex-1 h-12 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : mode === 'register' ? 'Register' : 'Sign in'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
