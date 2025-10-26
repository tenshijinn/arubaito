import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'view_talent' | 'post_job' | 'post_task';
  details: any;
  treasuryWallet: string;
  onPaymentComplete: (signature: string) => void;
}

const PaymentModal = ({
  isOpen,
  onClose,
  action,
  details,
  treasuryWallet,
  onPaymentComplete
}: PaymentModalProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  
  const [solPrice, setSolPrice] = useState<number>(0);
  const [solAmount, setSolAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'confirming' | 'success'>('idle');

  useEffect(() => {
    fetchSolPrice();
  }, []);

  const fetchSolPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      const price = data.solana?.usd || 200; // Fallback to $200 if API fails
      setSolPrice(price);
      setSolAmount(5 / price);
    } catch (error) {
      console.error('Failed to fetch SOL price:', error);
      setSolPrice(200);
      setSolAmount(0.025);
    }
  };

  const getActionLabel = () => {
    switch (action) {
      case 'view_talent':
        return 'View Talent Profile';
      case 'post_job':
        return 'Post Job';
      case 'post_task':
        return 'Post Task';
      default:
        return 'Complete Action';
    }
  };

  const handlePayment = async () => {
    if (!publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setStatus('sending');

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(treasuryWallet),
          lamports: Math.floor(solAmount * LAMPORTS_PER_SOL)
        })
      );

      const signature = await sendTransaction(transaction, connection);
      
      setStatus('confirming');
      toast({
        title: "Transaction sent",
        description: "Waiting for confirmation...",
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      setStatus('success');
      toast({
        title: "Payment successful",
        description: "Processing your request...",
      });

      // Pass signature back to chatbot
      onPaymentComplete(signature);
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Transaction was cancelled or failed",
        variant: "destructive"
      });
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Required</DialogTitle>
          <DialogDescription>
            Send $5 worth of SOL to {getActionLabel()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount (USD)</span>
              <span className="font-medium">$5.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount (SOL)</span>
              <span className="font-medium">{solAmount.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SOL Price</span>
              <span className="font-medium">${solPrice.toFixed(2)}</span>
            </div>
          </div>

          {details && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Details:</p>
              <p className="text-sm">
                {action === 'view_talent' && `Viewing profile: ${details.display_name || details.handle}`}
                {action === 'post_job' && `Posting job: ${details.title || 'New Job'}`}
                {action === 'post_task' && `Posting task: ${details.title || 'New Task'}`}
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>Recipient: {treasuryWallet.slice(0, 8)}...{treasuryWallet.slice(-8)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading || !publicKey} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status === 'sending' && 'Sending...'}
                {status === 'confirming' && 'Confirming...'}
                {status === 'success' && 'Success!'}
              </>
            ) : (
              'Send Payment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;