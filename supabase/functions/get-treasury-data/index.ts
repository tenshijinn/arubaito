import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching treasury data for wallet: ogcBwDkmQe3NggoUS2yQk7CJmXpQBdcyyn1Qb5PcCa5');

    // Import Solana Web3.js dynamically
    const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('https://esm.sh/@solana/web3.js@1.95.0');
    
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const walletAddress = new PublicKey('ogcBwDkmQe3NggoUS2yQk7CJmXpQBdcyyn1Qb5PcCa5');

    // Fetch wallet balance
    const balanceLamports = await connection.getBalance(walletAddress);
    const balance = balanceLamports / LAMPORTS_PER_SOL;
    console.log(`Wallet balance: ${balance} SOL`);

    // Fetch transaction signatures from the last 7 days
    const signatures = await connection.getSignaturesForAddress(walletAddress, { limit: 100 });
    console.log(`Found ${signatures.length} signatures`);

    // Aggregate deposits by day of week
    const dailyDeposits = new Map<string, number>();
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    daysOfWeek.forEach(day => dailyDeposits.set(day, 0));

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const sig of signatures) {
      if (!sig.blockTime) continue;
      const txTime = sig.blockTime * 1000;
      if (txTime < sevenDaysAgo) continue;

      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta) continue;

        // Check if this is an incoming transfer (postBalance > preBalance)
        const accountIndex = tx.transaction.message.accountKeys.findIndex(
          (key) => key.pubkey.toString() === walletAddress.toString()
        );

        if (accountIndex !== -1) {
          const preBalance = tx.meta.preBalances[accountIndex];
          const postBalance = tx.meta.postBalances[accountIndex];
          const diff = postBalance - preBalance;

          // Only count incoming transfers
          if (diff > 0) {
            const date = new Date(txTime);
            const dayOfWeek = daysOfWeek[date.getDay()];
            const currentAmount = dailyDeposits.get(dayOfWeek) || 0;
            dailyDeposits.set(dayOfWeek, currentAmount + (diff / LAMPORTS_PER_SOL));
          }
        }
      } catch (txError) {
        console.error(`Error parsing transaction ${sig.signature}:`, txError);
      }
    }

    // Format daily deposits for the chart
    const dailyDepositsArray = daysOfWeek.map(day => ({
      day,
      amount: parseFloat((dailyDeposits.get(day) || 0).toFixed(2)),
    }));

    console.log('Daily deposits:', dailyDepositsArray);

    return new Response(
      JSON.stringify({
        balance: parseFloat(balance.toFixed(1)),
        dailyDeposits: dailyDepositsArray,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching treasury data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        balance: 0,
        dailyDeposits: [],
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
