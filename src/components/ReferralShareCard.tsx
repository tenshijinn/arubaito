import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Twitter, Linkedin, Check, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReferralShareCardProps {
  walletAddress: string;
  xUserId?: string;
}

export const ReferralShareCard = ({ walletAddress, xUserId }: ReferralShareCardProps) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralUrl = referralCode ? `${baseUrl}/r/${referralCode}` : '';

  useEffect(() => {
    const fetchOrCreateCode = async () => {
      if (!walletAddress) return;

      try {
        const { data, error } = await supabase.functions.invoke('generate-referral-code', {
          body: { walletAddress, xUserId },
        });

        if (error) throw error;
        if (data?.referralCode) {
          setReferralCode(data.referralCode);
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
        toast.error('Failed to load referral code');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateCode();
  }, [walletAddress, xUserId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareToTwitter = () => {
    const text = `Join me on Rei and discover web3 opportunities! Use my referral link:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Rei',
          text: 'Join me on Rei and discover web3 opportunities!',
          url: referralUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyToClipboard();
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" />
          Share & Earn Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Earn 1 point per unique click, 25 points for new registrations, and 100 points when referrals post paid jobs!
        </p>
        
        {referralCode && (
          <>
            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="font-mono text-sm bg-background/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                className="flex-1 min-w-[120px]"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToLinkedIn}
                className="flex-1 min-w-[120px]"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareNative}
                className="flex-1 min-w-[120px]"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Your code: <span className="font-mono font-medium text-foreground">{referralCode}</span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
