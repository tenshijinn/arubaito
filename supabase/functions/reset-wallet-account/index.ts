import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://esm.sh/@noble/ed25519@2.0.0';
import { decode } from 'https://esm.sh/bs58@5.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { walletAddress, message, signature } = await req.json();
    
    console.log('Reset wallet account called for:', walletAddress);

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    if (!message || !signature) {
      throw new Error('Message and signature are required for verification');
    }

    // Verify the signature proves wallet ownership
    console.log('Verifying wallet signature...');
    
    try {
      const publicKeyBytes = decode(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = decode(signature);

      const isValid = await verify(signatureBytes, messageBytes, publicKeyBytes);
      
      if (!isValid) {
        console.error('Signature verification failed');
        return new Response(
          JSON.stringify({ error: 'Invalid wallet signature - you can only reset your own wallet account' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Signature verified successfully');
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Signature verification failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the message contains the correct wallet address
    if (!message.includes(walletAddress)) {
      console.error('Message does not contain wallet address');
      return new Response(
        JSON.stringify({ error: 'Invalid message - wallet address mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key for account deletion
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const email = `${walletAddress}@wallet.local`;
    console.log('Looking for user with email:', email);

    // List all users and find by email
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000
      });
      
      if (getUserError) {
        console.error('Error listing users:', getUserError);
        throw getUserError;
      }
      
      allUsers = [...allUsers, ...users];
      hasMore = users.length === 1000;
      page++;
    }

    const targetUser = allUsers.find(u => u.email === email);
    console.log('User found:', targetUser ? targetUser.id : 'none', 'out of', allUsers.length, 'users');

    if (targetUser) {
      console.log('Deleting user:', targetUser.id);
      
      // Delete the user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw deleteError;
      }

      console.log('User deleted successfully');
      
      return new Response(
        JSON.stringify({ message: 'Wallet account reset successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No account found');
      return new Response(
        JSON.stringify({ message: 'No account found for this wallet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
