import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching NFTs for wallet: ${walletAddress}`);

    const heliusApiKey = Deno.env.get('HELIUS_API_KEY');
    
    if (!heliusApiKey) {
      console.error('HELIUS_API_KEY not configured');
      return new Response(
        JSON.stringify({ nfts: [], error: 'NFT service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch NFTs using Helius DAS API
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'nft-fetch',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 20, // Limit to 20 NFTs for display
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('Helius API error:', response.status);
      return new Response(
        JSON.stringify({ nfts: [], error: 'Failed to fetch NFTs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Found ${data.result?.items?.length || 0} assets`);

    // Filter and format NFTs
    const nfts = (data.result?.items || [])
      .filter((item: any) => {
        // Only include NFTs with images
        return item.content?.files?.[0]?.uri || item.content?.links?.image;
      })
      .map((item: any) => ({
        id: item.id,
        name: item.content?.metadata?.name || 'Unknown NFT',
        image: item.content?.files?.[0]?.uri || item.content?.links?.image || '',
        collection: item.grouping?.[0]?.group_value || null,
        description: item.content?.metadata?.description || '',
      }))
      .slice(0, 12); // Limit to 12 for display

    console.log(`Returning ${nfts.length} NFTs with images`);

    return new Response(
      JSON.stringify({ nfts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return new Response(
      JSON.stringify({ nfts: [], error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});