import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from "https://esm.sh/@solana/web3.js@1.98.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, memo, payerPublicKey } = await req.json();

    if (!amount || !payerPublicKey) {
      throw new Error('Missing required fields: amount, payerPublicKey');
    }

    // Initialize Solana connection with Helius RPC
    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    if (!heliusApiKey) {
      throw new Error('HELIUS_API_KEY not configured');
    }

    const connection = new Connection(
      `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
      'confirmed'
    );

    // Treasury wallet (recipient)
    const TREASURY_WALLET = 'AXxW9KS6BkXCyXQmTJyxoKCeufARXoCQj6W7D5NEwkZY';
    const recipientPubkey = new PublicKey(TREASURY_WALLET);
    const payerPubkey = new PublicKey(payerPublicKey);

    // Generate unique reference for this payment
    const reference = Keypair.generate().publicKey;

    // Convert SOL amount to lamports
    const lamports = Math.floor(amount * 1e9);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

    // Create transaction
    const transaction = new Transaction({
      feePayer: payerPubkey,
      blockhash,
      lastValidBlockHeight,
    });

    // Add transfer instruction with reference for tracking
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payerPubkey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );

    // Add reference as a read-only key (standard Solana Pay pattern)
    transaction.instructions[0].keys.push({
      pubkey: reference,
      isSigner: false,
      isWritable: false,
    });

    // Serialize transaction (without signatures)
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    // Store payment record in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('payment_references')
      .insert({
        reference: reference.toString(),
        amount,
        memo: memo || null,
        payer: payerPublicKey,
        status: 'pending',
        payment_type: 'x402',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store payment reference');
    }

    return new Response(
      JSON.stringify({
        transaction: serializedTransaction.toString('base64'),
        reference: reference.toString(),
        amount,
        blockhash,
        lastValidBlockHeight,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('x402-create-payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
