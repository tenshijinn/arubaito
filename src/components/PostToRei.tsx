import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SolanaPayQR } from '@/components/SolanaPayQR';
import { X402Payment } from '@/components/X402Payment';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'marketer', label: 'Marketer' },
  { value: 'community', label: 'Community' },
  { value: 'content', label: 'Content' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'other', label: 'Other' },
];

type PostType = 'job' | 'task';
type PaymentMethod = 'solana-pay' | 'x402' | null;

interface PaymentData {
  qrCodeUrl: string;
  reference: string;
  paymentUrl: string;
  amount: number;
  solAmount: number;
  recipient: string;
}

export const PostToRei = () => {
  const { publicKey } = useWallet();
  const [postType, setPostType] = useState<PostType>('job');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [compensation, setCompensation] = useState('');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const generatePayment = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsGeneratingPayment(true);
    try {
      // Fetch SOL price
      const solPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const solPriceData = await solPriceResponse.json();
      const solPrice = solPriceData.solana.usd;
      
      const usdAmount = 5;
      const solAmount = usdAmount / solPrice;
      
      // Generate truly unique reference using crypto keypair
      const { Keypair } = await import('@solana/web3.js');
      const keypair = Keypair.generate();
      const reference = keypair.publicKey.toString();
      
      const recipient = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
      const label = postType === 'job' ? 'Job Posting' : 'Task Posting';
      const message = `Post ${postType} to Rei Portal`;
      
      const paymentUrl = `solana:${recipient}?amount=${solAmount.toFixed(9)}&reference=${reference}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`;
      
      const qrCodeUrl = await QRCode.toDataURL(paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#181818',
          light: '#ed565a'
        }
      });
      
      setPaymentData({
        qrCodeUrl,
        reference,
        paymentUrl,
        amount: usdAmount,
        solAmount,
        recipient
      });
      
      setShowPaymentMethod(true);
    } catch (error) {
      console.error('Payment generation error:', error);
      toast.error('Failed to generate payment');
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handlePaymentMethodSelect = (method: 'solana-pay' | 'x402') => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethod(false);
  };

  const handlePaymentComplete = async (reference: string) => {
    setIsSubmitting(true);
    try {
      // Verify payment
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference,
          walletAddress: publicKey?.toString()
        }
      });

      if (verifyError || !verifyData?.verified) {
        throw new Error(verifyData?.error || 'Payment verification failed');
      }

      // Check if reference already used
      const table = postType === 'job' ? 'jobs' : 'tasks';
      const { data: existingPost } = await supabase
        .from(table)
        .select('id')
        .eq('solana_pay_reference', reference)
        .single();

      if (existingPost) {
        throw new Error('Payment already used for another posting');
      }

      // Insert job or task
      if (postType === 'job') {
        const { error: insertError } = await supabase
          .from('jobs')
          .insert({
            title,
            company_name: companyName,
            description,
            requirements: requirements || '',
            role_tags: selectedRoles,
            compensation: compensation || '',
            deadline: deadline || null,
            link: link || null,
            employer_wallet: publicKey?.toString(),
            payment_tx_signature: verifyData.signature,
            solana_pay_reference: reference,
            source: 'manual'
          });

        if (insertError) throw insertError;
      } else {
        // Task - requires link
        if (!link) {
          throw new Error('Link is required for tasks');
        }

        const { error: insertError } = await supabase
          .from('tasks')
          .insert({
            title,
            company_name: companyName,
            description,
            link,
            role_tags: selectedRoles,
            compensation: compensation || '',
            end_date: deadline || null,
            employer_wallet: publicKey?.toString(),
            payment_tx_signature: verifyData.signature,
            solana_pay_reference: reference,
            source: 'manual'
          });

        if (insertError) throw insertError;
      }

      // Award points
      await supabase.functions.invoke('award-payment-points', {
        body: {
          walletAddress: publicKey?.toString(),
          reference,
          amount: verifyData.amount,
          tokenMint: verifyData.tokenMint,
          tokenAmount: verifyData.tokenAmount
        }
      });

      toast.success(`${postType === 'job' ? 'Job' : 'Task'} posted successfully! 10 points awarded.`);
      
      // Reset form
      setTitle('');
      setCompanyName('');
      setDescription('');
      setRequirements('');
      setCompensation('');
      setLink('');
      setDeadline('');
      setSelectedRoles([]);
      setPaymentData(null);
      setSelectedPaymentMethod(null);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPayment = () => {
    setSelectedPaymentMethod(null);
    setShowPaymentMethod(true);
  };

  const canGeneratePayment = title && companyName && description && selectedRoles.length > 0 && (postType === 'job' || link);

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      <Card className="w-full bg-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="font-mono text-xl">&gt; Post Opportunity to Rei</CardTitle>
          <CardDescription className="font-mono text-sm">
            Post a job or task for $5 worth of SOL. Your posting will be accessible to talent through Rei.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Post Type Selection */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Type *</Label>
            <Select value={postType} onValueChange={(value) => setPostType(value as PostType)}>
              <SelectTrigger className="font-mono bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job" className="font-mono">Job Opening</SelectItem>
                <SelectItem value="task" className="font-mono">Task/Bounty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === 'job' ? 'e.g. Senior Solidity Developer' : 'e.g. Smart Contract Audit'}
              className="font-mono bg-background/50"
              maxLength={100}
            />
          </div>

          {/* Company/Project Name */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Company/Project *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Solana Labs"
              className="font-mono bg-background/50"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={postType === 'job' ? 'Describe the role, responsibilities, and what makes this opportunity great...' : 'Describe the task, deliverables, and success criteria...'}
              className="font-mono bg-background/50 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground font-mono">{description.length}/500</p>
          </div>

          {/* Requirements (Job only) */}
          {postType === 'job' && (
            <div className="space-y-2">
              <Label className="font-mono">&gt; Requirements</Label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List the required skills, experience, and qualifications..."
                className="font-mono bg-background/50"
                maxLength={500}
              />
            </div>
          )}

          {/* Link (Required for tasks) */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Link {postType === 'task' && '*'}</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={postType === 'job' ? 'Application/Details URL (optional)' : 'Task details URL (required)'}
              className="font-mono bg-background/50"
              type="url"
            />
          </div>

          {/* Compensation/Reward */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; {postType === 'job' ? 'Compensation' : 'Reward'}</Label>
            <Input
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder={postType === 'job' ? 'e.g. $80k-$120k or 0.5-1% equity' : 'e.g. 500 USDC or 2 SOL'}
              className="font-mono bg-background/50"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Deadline</Label>
            <Input
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              type="date"
              className="font-mono bg-background/50"
            />
          </div>

          {/* Role Tags */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Role Tags *</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <Badge
                  key={role.value}
                  variant={selectedRoles.includes(role.value) ? 'default' : 'outline'}
                  className="cursor-pointer font-mono"
                  onClick={() => toggleRole(role.value)}
                >
                  {role.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          {!paymentData && (
            <div className="pt-4 border-t border-primary/20 space-y-3">
              {/* Show wallet button when not connected */}
              {!publicKey && (
                <div className="flex flex-col items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground font-mono text-center">
                    Connect your wallet to post opportunities
                  </p>
                  <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !font-mono" />
                </div>
              )}
              
              {/* Generate Payment button */}
              <Button
                onClick={generatePayment}
                disabled={!canGeneratePayment || !publicKey || isGeneratingPayment}
                className="w-full font-mono"
                size="lg"
              >
                {isGeneratingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Payment...
                  </>
                ) : (
                  `Generate Payment ($5 USD)`
                )}
              </Button>
              
              {/* Helper text when form incomplete */}
              {!canGeneratePayment && publicKey && (
                <p className="text-xs text-muted-foreground text-center font-mono">
                  Fill all required fields (*) to continue
                </p>
              )}
            </div>
          )}

          {/* Payment Method Selection */}
          {paymentData && showPaymentMethod && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
              </div>
              <PaymentMethodSelector
                onMethodSelect={handlePaymentMethodSelect}
                amount={paymentData.amount}
                solAmount={paymentData.solAmount}
              />
            </div>
          )}

          {/* Solana Pay QR */}
          {paymentData && selectedPaymentMethod === 'solana-pay' && (
            <SolanaPayQR
              qrCodeUrl={paymentData.qrCodeUrl}
              reference={paymentData.reference}
              paymentUrl={paymentData.paymentUrl}
              amount={paymentData.amount}
              recipient={paymentData.recipient}
              walletAddress={publicKey?.toString() || ''}
              onPaymentComplete={handlePaymentComplete}
            />
          )}

          {/* x402 Payment */}
          {paymentData && selectedPaymentMethod === 'x402' && (
            <X402Payment
              amount={paymentData.amount}
              memo={`Post ${postType} to Rei`}
              onSuccess={handlePaymentComplete}
              onCancel={handleCancelPayment}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
