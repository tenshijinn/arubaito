import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Check, Twitter, Wallet, FileText } from 'lucide-react';

interface TwitterUser {
  x_user_id: string;
  handle: string;
  display_name: string;
  profile_image_url?: string;
  verified: boolean;
}

type RoleTag = 'dev' | 'product' | 'research' | 'community' | 'design' | 'ops';

const ROLE_OPTIONS: { value: RoleTag; label: string }[] = [
  { value: 'dev', label: 'Developer' },
  { value: 'product', label: 'Product' },
  { value: 'research', label: 'Research' },
  { value: 'community', label: 'Community' },
  { value: 'design', label: 'Design' },
  { value: 'ops', label: 'Operations' },
];

export default function Rei() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [codeVerifier, setCodeVerifier] = useState<string>('');
  
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleTag[]>([]);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && !twitterUser && !isProcessingCallback) {
      setIsProcessingCallback(true);
      handleTwitterCallback(code);
    }
  }, []);

  // Auto-advance to step 2 when Twitter is connected
  useEffect(() => {
    if (twitterUser && step === 1) {
      setStep(2);
    }
  }, [twitterUser]);

  // Auto-advance to step 3 when wallet is connected
  useEffect(() => {
    if (connected && twitterUser && step === 2) {
      setStep(3);
    }
  }, [connected, twitterUser]);

  const handleTwitterLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/rei`;
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { action: 'getAuthUrl', redirectUri },
      });

      if (error) throw error;

      setCodeVerifier(data.codeVerifier);
      sessionStorage.setItem('twitter_code_verifier', data.codeVerifier);
      window.location.href = data.authUrl;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate Twitter login',
        variant: 'destructive',
      });
    }
  };

  const handleTwitterCallback = async (code: string) => {
    try {
      const storedVerifier = sessionStorage.getItem('twitter_code_verifier');
      const redirectUri = `${window.location.origin}/rei`;
      
      const { data, error } = await supabase.functions.invoke('twitter-oauth', {
        body: { 
          action: 'exchangeToken',
          code,
          codeVerifier: storedVerifier,
          redirectUri,
        },
      });

      if (error) throw error;

      setTwitterUser(data.user);
      sessionStorage.removeItem('twitter_code_verifier');
      setIsProcessingCallback(false);
      
      // Clean URL
      window.history.replaceState({}, '', '/rei');
      
      toast({
        title: 'Success',
        description: `Welcome, @${data.user.handle}!`,
      });
    } catch (error) {
      setIsProcessingCallback(false);
      toast({
        title: 'Error',
        description: 'Failed to complete Twitter login',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOCX, or TXT file',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const toggleRole = (role: RoleTag) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (!file || !twitterUser || !publicKey || !consent) return;

    setIsSubmitting(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${twitterUser.x_user_id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rei-contributor-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Submit registration
      const { data, error } = await supabase.functions.invoke('submit-rei-registration', {
        body: {
          x_user_id: twitterUser.x_user_id,
          handle: twitterUser.handle,
          display_name: twitterUser.display_name,
          profile_image_url: twitterUser.profile_image_url,
          verified: twitterUser.verified,
          wallet_address: publicKey.toString(),
          file_path: filePath,
          portfolio_url: portfolioUrl || null,
          role_tags: selectedRoles,
          consent: true,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: 'Success!',
        description: data.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = file && twitterUser && publicKey && consent && selectedRoles.length > 0;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>
              Your Proof-of-Talent NFT will be minted shortly to your wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
              <p className="text-xs font-mono break-all">{publicKey?.toString()}</p>
            </div>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Rei Proof-Of-Talent Portal</CardTitle>
          <CardDescription>
            Join the verified Web3 contributor registry and claim your Soul-Bound NFT
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`h-2 rounded-full flex-1 ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Twitter Login */}
          <div className={step !== 1 && twitterUser ? 'opacity-50' : ''}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${twitterUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {twitterUser ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <h3 className="text-lg font-semibold">Sign in with X (Twitter)</h3>
            </div>

            {!twitterUser ? (
              <Button onClick={handleTwitterLogin} size="lg" className="w-full">
                <Twitter className="mr-2 h-5 w-5" />
                Connect X Account
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {twitterUser.profile_image_url && (
                  <img src={twitterUser.profile_image_url} alt={twitterUser.handle} className="h-12 w-12 rounded-full" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{twitterUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{twitterUser.handle}</p>
                </div>
                {twitterUser.verified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Wallet Connection */}
          {twitterUser && (
            <div className={step !== 2 && connected ? 'opacity-50' : ''}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${connected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {connected ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <h3 className="text-lg font-semibold">Connect Solana Wallet</h3>
              </div>

              <WalletMultiButton className="!w-full !h-12 !bg-primary hover:!bg-primary/90" />
              
              {connected && publicKey && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Connected Wallet</p>
                  <p className="text-xs font-mono break-all">{publicKey.toString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Registration Form */}
          {twitterUser && connected && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
                  3
                </div>
                <h3 className="text-lg font-semibold">Submit Contributor Profile</h3>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="file">CV / Resume / Portfolio *</Label>
                  <div className="mt-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Portfolio URL */}
                <div>
                  <Label htmlFor="portfolio">Portfolio / Project URL (Optional)</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://..."
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>

                {/* Role Tags */}
                <div>
                  <Label>Role Tags *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ROLE_OPTIONS.map((role) => (
                      <Badge
                        key={role.value}
                        variant={selectedRoles.includes(role.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleRole(role.value)}
                      >
                        {role.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm cursor-pointer">
                    I consent to Rei storing this data for talent matching and NFT issuance.
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  size="lg"
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Register & Claim Proof-Of-Talent NFT'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}