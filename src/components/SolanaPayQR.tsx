import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { supabase } from '@/integrations/supabase/client';

interface SolanaPayQRProps {
  qrCodeUrl: string;
  reference: string;
  paymentUrl: string;
  amount: number;
  recipient: string;
  walletAddress: string;
  onPaymentComplete: (reference: string) => void;
}

export const SolanaPayQR = ({
  qrCodeUrl,
  reference,
  paymentUrl,
  amount,
  recipient,
  walletAddress,
  onPaymentComplete
}: SolanaPayQRProps) => {
  const [status, setStatus] = useState<'pending' | 'verifying' | 'confirmed' | 'error'>('pending');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingPayment, setPendingPayment] = useState(false);
  const { toast } = useToast();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const truncateAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recipient);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Watch for wallet connection after user clicks pay
  useEffect(() => {
    if (pendingPayment && publicKey && publicKey.toString() === walletAddress) {
      // Wallet connected and matches stored address, proceed with payment
      setPendingPayment(false);
      sendPayment();
    }
  }, [publicKey, pendingPayment, walletAddress]);

  const sendPayment = async () => {
    // If we have the stored wallet but no active connection
    if (!publicKey && walletAddress) {
      setPendingPayment(true);
      setVisible(true);
      toast({
        title: "Connect Your Wallet",
        description: "Please select your Phantom wallet to complete payment",
      });
      return;
    }

    // If no publicKey at all
    if (!publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send payment",
        variant: "destructive"
      });
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      // Parse the Solana Pay URL to extract amount
      const urlParams = new URLSearchParams(paymentUrl.split('?')[1]);
      const solAmount = parseFloat(urlParams.get('amount') || '0');
      
      if (solAmount === 0) {
        throw new Error('Invalid payment amount');
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
        })
      );

      // Add reference as a memo instruction (optional but helps with tracking)
      const referencePublicKey = new PublicKey(reference);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: referencePublicKey,
          lamports: 0, // Zero lamports to just add reference
        })
      );

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      toast({
        title: "Transaction Sent",
        description: "Waiting for confirmation...",
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Verify payment
      const response = await supabase.functions.invoke('verify-solana-pay', {
        body: {
          reference,
          walletAddress
        }
      });

      if (response.data?.verified) {
        setStatus('confirmed');
        toast({
          title: "Payment Confirmed! ✓",
          description: `Your payment of $${response.data.amount.toFixed(2)} has been confirmed`,
        });
        onPaymentComplete(reference);
      } else {
        throw new Error(response.data?.error || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Payment failed';
      setErrorMessage(message);
      toast({
        title: "Payment Failed",
        description: message,
        variant: "destructive"
      });
    }
  };

  const verifyPayment = async () => {
    setStatus('verifying');
    setErrorMessage('');

    try {
      if (!walletAddress) {
        throw new Error('No wallet connected');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-solana-pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            reference,
            walletAddress
          })
        }
      );

      const data = await response.json();

      if (data.verified) {
        setStatus('confirmed');
        toast({
          title: "Payment Verified! ✓",
          description: `Your payment of $${data.amount.toFixed(2)} has been confirmed`,
        });
        onPaymentComplete(reference);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Payment verification failed');
        toast({
          title: "Verification Failed",
          description: data.error || 'Unable to verify payment',
          variant: "destructive"
        });
      }
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };

  // Auto-poll for payment every 5 seconds
  useEffect(() => {
    if (status !== 'pending' || !walletAddress) return;

    const interval = setInterval(async () => {

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-solana-pay`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
              reference,
              walletAddress
            })
          }
        );

        const data = await response.json();

        if (data.verified) {
          setStatus('confirmed');
          toast({
            title: "Payment Detected! ✓",
            description: `Your payment of $${data.amount.toFixed(2)} has been confirmed`,
          });
          onPaymentComplete(reference);
          clearInterval(interval);
        }
      } catch (error) {
        // Silently fail auto-polling
        console.error('Auto-poll error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, reference, onPaymentComplete, toast]);

  return (
    <div className="my-4 border border-primary/30 bg-background/50 p-4 rounded font-mono text-sm">
      <div className="mb-3">
        <div className="text-primary mb-1">&gt; PAYMENT REQUIRED</div>
        <div className="text-muted-foreground text-xs mb-2">
          Scan QR code or click to open wallet
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center my-4">
        <img 
          src={qrCodeUrl} 
          alt="Solana Pay QR Code" 
          className="w-48 h-48 border border-primary/20 rounded"
        />
      </div>

      {/* Payment Details */}
      <div className="space-y-2 text-xs mb-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="text-primary font-bold">${amount.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-muted-foreground">Destination:</span>
          <div className="flex items-center gap-1">
            <span className="text-primary">{truncateAddress(recipient)}</span>
            <button
              onClick={copyToClipboard}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Copy address"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        {status === 'pending' && (
          <div className="text-yellow-500 text-xs flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Waiting for payment...
          </div>
        )}
        {status === 'verifying' && (
          <div className="text-blue-500 text-xs flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Verifying payment...
          </div>
        )}
        {status === 'confirmed' && (
          <div className="text-green-500 text-xs flex items-center gap-2">
            <Check className="w-3 h-3" />
            Payment confirmed! ✓
          </div>
        )}
        {status === 'error' && errorMessage && (
          <div className="text-destructive text-xs">
            Error: {errorMessage}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={sendPayment}
          size="sm"
          className="flex-1 font-mono text-xs"
          disabled={status === 'verifying' || status === 'confirmed' || !walletAddress}
        >
          {status === 'verifying' ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing...
            </>
          ) : status === 'confirmed' ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Paid
            </>
          ) : (
            <>
              <ExternalLink className="w-3 h-3 mr-1" />
              {publicKey ? "Pay Now with Wallet" : "Connect & Pay"}
            </>
          )}
        </Button>
        <Button
          onClick={verifyPayment}
          variant="outline"
          size="sm"
          className="flex-1 font-mono text-xs"
          disabled={status === 'verifying' || status === 'confirmed'}
        >
          {status === 'verifying' ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Checking...
            </>
          ) : status === 'confirmed' ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Verified
            </>
          ) : (
            "I've Paid"
          )}
        </Button>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Accepts SOL or SPL tokens with ≥$100M market cap
      </div>
    </div>
  );
};
