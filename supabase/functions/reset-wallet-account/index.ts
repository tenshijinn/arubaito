import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { walletAddress } = await req.json();
    
    console.log('Reset wallet account called for:', walletAddress);

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    // Create user client to verify the requesting user's identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Verify the authenticated user owns this wallet
    // The user's email is ${walletAddress}@wallet.local for wallet auth
    const expectedEmail = `${walletAddress}@wallet.local`;
    const userWalletAddress = user.user_metadata?.wallet_address;
    
    if (user.email !== expectedEmail && userWalletAddress !== walletAddress) {
      console.error('Wallet ownership verification failed:', {
        userEmail: user.email,
        expectedEmail,
        userWalletAddress,
        requestedWallet: walletAddress
      });
      return new Response(
        JSON.stringify({ error: 'You can only reset your own wallet account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key for account deletion
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const email = `${walletAddress}@wallet.local`;
    console.log('Looking for user with email:', email);

    // List all users and find by email (more reliable than pagination)
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

    // Additional check: ensure the found user matches the authenticated user
    if (targetUser && targetUser.id !== user.id) {
      console.error('User ID mismatch - potential attack detected');
      return new Response(
        JSON.stringify({ error: 'Security verification failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
