import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Connection, PublicKey } from "npm:@solana/web3.js@^1.98.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TREASURY_WALLET = '6FmWdgfvBHeNjjg12cGuq3dPKLKh5BmEMiVSddtA1aU7';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const REQUIRED_USD_AMOUNT = 5;
const AMOUNT_VARIANCE = 0.05; // 5% variance allowed

interface VerifyPaymentRequest {
  txSignature: string;
  expectedAmount: number;
  senderWallet: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { txSignature, expectedAmount, senderWallet }: VerifyPaymentRequest = await req.json();

    console.log('Verifying payment:', { txSignature, expectedAmount, senderWallet });

    // Validate inputs
    if (!txSignature || !senderWallet) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    // Get transaction
    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      console.log('Transaction not found');
      return new Response(
        JSON.stringify({ verified: false, error: 'Transaction not found or not confirmed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check transaction age (must be within last 10 minutes)
    const txTime = tx.blockTime ? tx.blockTime * 1000 : 0;
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    if (now - txTime > tenMinutes) {
      console.log('Transaction too old');
      return new Response(
        JSON.stringify({ verified: false, error: 'Transaction expired (must be within 10 minutes)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify sender - handle versioned transactions
    const accountKeys = 'accountKeys' in tx.transaction.message 
      ? tx.transaction.message.accountKeys 
      : tx.transaction.message.staticAccountKeys;
    
    const txSender = accountKeys[0].toString();
    if (txSender !== senderWallet) {
      console.log('Sender mismatch:', txSender, 'vs', senderWallet);
      return new Response(
        JSON.stringify({ verified: false, error: 'Transaction sender does not match' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find transfer to treasury wallet
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    let transferAmount = 0;

    // Check post balances
    const treasuryIndex = accountKeys.findIndex(
      (key: PublicKey) => key.toString() === TREASURY_WALLET
    );

    if (treasuryIndex >= 0) {
      const preBalance = tx.meta?.preBalances[treasuryIndex] || 0;
      const postBalance = tx.meta?.postBalances[treasuryIndex] || 0;
      transferAmount = (postBalance - preBalance) / 1e9; // Convert lamports to SOL
    }

    console.log('Transfer amount:', transferAmount, 'SOL');

    // Fetch current SOL price
    const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const priceData = await priceResponse.json();
    const solPrice = priceData.solana?.usd || 0;

    if (solPrice === 0) {
      console.log('Failed to fetch SOL price');
      return new Response(
        JSON.stringify({ verified: false, error: 'Failed to fetch SOL price' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transferUSD = transferAmount * solPrice;
    console.log('Transfer value:', transferUSD, 'USD at', solPrice, 'USD/SOL');

    // Verify amount (allow 5% variance)
    const minAmount = REQUIRED_USD_AMOUNT * (1 - AMOUNT_VARIANCE);
    const maxAmount = REQUIRED_USD_AMOUNT * (1 + AMOUNT_VARIANCE);

    if (transferUSD < minAmount) {
      console.log('Amount too low:', transferUSD, 'vs required', REQUIRED_USD_AMOUNT);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: `Insufficient payment amount: $${transferUSD.toFixed(2)} (required: ~$${REQUIRED_USD_AMOUNT})`,
          amount: transferUSD
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment verified successfully');
    return new Response(
      JSON.stringify({ 
        verified: true, 
        amount: transferUSD,
        solAmount: transferAmount,
        solPrice
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});