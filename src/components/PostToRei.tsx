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

// Opportunity types with their target tables
const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Job', description: 'Full-time or part-time position', table: 'jobs' },
  { value: 'contract', label: 'Contract', description: 'Fixed-term freelance work', table: 'jobs' },
  { value: 'task', label: 'Task', description: 'One-time deliverable', table: 'tasks' },
  { value: 'bounty', label: 'Bounty', description: 'Open/competitive task', table: 'tasks' },
  { value: 'gig', label: 'Gig', description: 'Short-term work', table: 'tasks' },
  { value: 'quest', label: 'Quest', description: 'Gamified campaign', table: 'tasks' },
];

type OpportunityType = 'job' | 'contract' | 'task' | 'bounty' | 'gig' | 'quest';
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
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('job');
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
      const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunityType);
      const label = `${typeConfig?.label || 'Opportunity'} Posting`;
      const message = `Post ${opportunityType} to Rei Portal`;
      
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
      // Check if payment reference already completed (x402 case)
      const { data: paymentRef, error: refError } = await supabase
        .from('payment_references')
        .select('*')
        .eq('reference', reference)
        .maybeSingle();

      if (refError) {
        throw new Error('Payment reference not found');
      }

      let verifyData;

      if (paymentRef && paymentRef.status === 'completed') {
        // x402 payment - already verified
        console.log('Using pre-verified x402 payment');
        verifyData = {
          verified: true,
          signature: paymentRef.tx_signature,
          amount: Number(paymentRef.amount),
          tokenMint: 'So11111111111111111111111111111111111111112', // Native SOL
          tokenAmount: Number(paymentRef.amount)
        };
      } else {
        // Solana Pay - needs verification
        const { data, error: verifyError } = await supabase.functions.invoke('verify-solana-pay', {
          body: {
            reference,
            walletAddress: publicKey?.toString()
          }
        });

        if (verifyError || !data?.verified) {
          throw new Error(data?.error || 'Payment verification failed');
        }

        verifyData = data;
      }

      // Check if reference already used - determine target table based on opportunity type
      const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunityType);
      const targetTable = typeConfig?.table as 'jobs' | 'tasks' || 'jobs';
      
      const { data: existingPost } = await supabase
        .from(targetTable)
        .select('id')
        .eq('solana_pay_reference', reference)
        .maybeSingle();

      if (existingPost) {
        throw new Error('Payment already used for another posting');
      }

      // Insert based on target table (jobs or tasks)
      if (targetTable === 'jobs') {
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
            source: 'manual',
            opportunity_type: opportunityType
          });

        if (insertError) throw insertError;
      } else {
        // Tasks table - requires link
        if (!link) {
          throw new Error('Link is required for tasks, bounties, gigs, and quests');
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
            source: 'manual',
            opportunity_type: opportunityType
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

      const typeLabel = OPPORTUNITY_TYPES.find(t => t.value === opportunityType)?.label || 'Opportunity';
      toast.success(`${typeLabel} posted successfully! 10 points awarded.`);
      
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

  // Determine if link is required based on opportunity type (tasks table items need links)
  const typeConfig = OPPORTUNITY_TYPES.find(t => t.value === opportunityType);
  const isTasksTable = typeConfig?.table === 'tasks';
  const canGeneratePayment = title && companyName && description && selectedRoles.length > 0 && (!isTasksTable || link);

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
          {/* Opportunity Type Selection */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Type *</Label>
            <Select value={opportunityType} onValueChange={(value) => setOpportunityType(value as OpportunityType)}>
              <SelectTrigger className="font-mono bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="font-mono">
                    <span>{type.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">— {type.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={!isTasksTable ? 'e.g. Senior Solidity Developer' : 'e.g. Smart Contract Audit'}
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
              placeholder={!isTasksTable ? 'Describe the role, responsibilities, and what makes this opportunity great...' : 'Describe the task, deliverables, and success criteria...'}
              className="font-mono bg-background/50 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground font-mono">{description.length}/500</p>
          </div>

          {/* Requirements (Jobs table only) */}
          {!isTasksTable && (
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

          {/* Link (Required for tasks table items) */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; Link {isTasksTable && '*'}</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={!isTasksTable ? 'Application/Details URL (optional)' : 'Details URL (required)'}
              className="font-mono bg-background/50"
              type="url"
            />
          </div>

          {/* Compensation/Reward */}
          <div className="space-y-2">
            <Label className="font-mono">&gt; {!isTasksTable ? 'Compensation' : 'Reward'}</Label>
            <Input
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              placeholder={!isTasksTable ? 'e.g. $80k-$120k or 0.5-1% equity' : 'e.g. 500 USDC or 2 SOL'}
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
              memo={`Post ${opportunityType} to Rei`}
              onSuccess={handlePaymentComplete}
              onCancel={handleCancelPayment}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
