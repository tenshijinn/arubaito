import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Connection, PublicKey } from "npm:@solana/web3.js@^1.98.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TREASURY_WALLET = '5JXJQSFZMxiQNmG4nx3bs2FnoZZsgz6kpVrNDxfBjb1s';
const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY') || '';
const SOLANA_RPC = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com'; // Fallback to public RPC
const REQUIRED_USD_AMOUNT = 5;
const AMOUNT_VARIANCE = 0.02; // 2% variance allowed
const MIN_MARKET_CAP = 100_000_000; // $100M minimum

interface VerifyPaymentRequest {
  reference: string;
  walletAddress: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, walletAddress }: VerifyPaymentRequest = await req.json();

    console.log('Verifying Solana Pay payment:', { reference, walletAddress });
    console.log('Using RPC:', HELIUS_API_KEY ? 'Helius' : 'Public mainnet');

    if (!reference || !walletAddress) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const referencePubkey = new PublicKey(reference);

    // Find transactions with this reference
    const signatures = await connection.getSignaturesForAddress(referencePubkey, { limit: 10 });

    if (signatures.length === 0) {
      console.log('No transaction found for reference');
      return new Response(
        JSON.stringify({ verified: false, error: 'Payment not found. Please wait a moment and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the most recent transaction
    const signature = signatures[0].signature;
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      console.log('Transaction details not found');
      return new Response(
        JSON.stringify({ verified: false, error: 'Transaction not confirmed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log sender for debugging (but don't block payment)
    const accountKeys = 'accountKeys' in tx.transaction.message 
      ? tx.transaction.message.accountKeys 
      : tx.transaction.message.staticAccountKeys;
    
    const txSender = accountKeys[0].toString();
    console.log('Payment sender:', txSender, 'Connected wallet:', walletAddress);

    // Find transfer to treasury
    const treasuryIndex = accountKeys.findIndex(
      (key: PublicKey) => key.toString() === TREASURY_WALLET
    );

    if (treasuryIndex < 0) {
      console.log('Treasury wallet not found in transaction');
      return new Response(
        JSON.stringify({ verified: false, error: 'Payment not sent to correct address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const preBalance = tx.meta?.preBalances[treasuryIndex] || 0;
    const postBalance = tx.meta?.postBalances[treasuryIndex] || 0;
    const transferAmount = (postBalance - preBalance) / 1e9; // Convert lamports to SOL

    console.log('Transfer amount:', transferAmount, 'SOL');

    // Determine if this is SOL or SPL token transfer
    let isSOL = transferAmount > 0;
    let tokenMint = 'SOL';
    let tokenAmount = transferAmount;
    let transferUSD = 0;

    if (isSOL) {
      // SOL transfer - get SOL price from CoinGecko
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const priceData = await priceResponse.json();
      const solPrice = priceData.solana?.usd || 0;

      if (solPrice === 0) {
        console.log('Failed to fetch SOL price');
        return new Response(
          JSON.stringify({ verified: false, error: 'Failed to verify payment amount' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      transferUSD = transferAmount * solPrice;
      console.log('SOL payment - USD value:', transferUSD);
    } else {
      // SPL token transfer - parse from transaction
      const postTokenBalances = tx.meta?.postTokenBalances || [];
      const preTokenBalances = tx.meta?.preTokenBalances || [];

      // Find token transfer to treasury
      let tokenTransfer = null;
      for (const postBalance of postTokenBalances) {
        if (postBalance.owner === TREASURY_WALLET) {
          const preBalance = preTokenBalances.find(
            (pre) => pre.accountIndex === postBalance.accountIndex
          );
          const preAmount = preBalance ? parseFloat(preBalance.uiTokenAmount.uiAmountString || '0') : 0;
          const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmountString || '0');
          const amount = postAmount - preAmount;

          if (amount > 0) {
            tokenTransfer = {
              mint: postBalance.mint,
              amount: amount,
              decimals: postBalance.uiTokenAmount.decimals
            };
            break;
          }
        }
      }

      if (!tokenTransfer) {
        console.log('No token transfer found');
        return new Response(
          JSON.stringify({ verified: false, error: 'No valid payment found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      tokenMint = tokenTransfer.mint;
      tokenAmount = tokenTransfer.amount;

      // Get token info and price from CoinGecko (via token address)
      const tokenInfoResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenMint}&vs_currencies=usd&include_market_cap=true`
      );
      const tokenInfoData = await tokenInfoResponse.json();
      const tokenData = tokenInfoData[tokenMint.toLowerCase()];

      if (!tokenData || !tokenData.usd) {
        console.log('Failed to fetch token price for:', tokenMint);
        return new Response(
          JSON.stringify({ verified: false, error: 'Unable to verify token payment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenPrice = tokenData.usd;
      const marketCap = tokenData.usd_market_cap || 0;

      // Verify market cap
      if (marketCap < MIN_MARKET_CAP) {
        console.log('Token market cap too low:', marketCap);
        return new Response(
          JSON.stringify({ 
            verified: false, 
            error: `Token market cap ($${(marketCap / 1e6).toFixed(1)}M) is below required $100M minimum` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      transferUSD = tokenAmount * tokenPrice;
      console.log('SPL token payment - Token:', tokenMint, 'Amount:', tokenAmount, 'USD value:', transferUSD);
    }

    // Verify amount is $5 ±2%
    const minAmount = REQUIRED_USD_AMOUNT * (1 - AMOUNT_VARIANCE);
    const maxAmount = REQUIRED_USD_AMOUNT * (1 + AMOUNT_VARIANCE);

    if (transferUSD < minAmount) {
      console.log('Amount too low:', transferUSD, 'vs required', REQUIRED_USD_AMOUNT);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: `Insufficient payment: $${transferUSD.toFixed(2)} (required: ~$${REQUIRED_USD_AMOUNT})`,
          amount: transferUSD
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (transferUSD > maxAmount) {
      console.log('Amount too high:', transferUSD, 'vs required', REQUIRED_USD_AMOUNT);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: `Payment amount too high: $${transferUSD.toFixed(2)} (expected: ~$${REQUIRED_USD_AMOUNT})`,
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
        tokenMint,
        tokenAmount,
        signature
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
