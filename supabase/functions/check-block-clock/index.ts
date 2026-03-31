import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get config
    const { data: config, error: configError } = await supabase
      .from('block_clock_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Config not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get current Solana slot
    let currentBlock = 0
    try {
      const rpcRes = await fetch(SOLANA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot',
          params: [{ commitment: 'finalized' }],
        }),
      })
      const rpcData = await rpcRes.json()
      currentBlock = rpcData.result || 0
    } catch (e) {
      console.error('Solana RPC error:', e)
      // Fall back to time-based estimate
      const elapsedMs = Date.now() - new Date(config.start_timestamp).getTime()
      currentBlock = config.start_block + Math.floor(elapsedMs / 400)
    }

    const targetBlock = Number(config.start_block) + Number(config.target_blocks)
    const isTargetReached = currentBlock >= targetBlock

    // If target reached and not yet unlocked, trigger unlock
    if (isTargetReached && !config.is_unlocked) {
      await supabase
        .from('block_clock_config')
        .update({ is_unlocked: true, unlocked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', 1)

      config.is_unlocked = true
      config.unlocked_at = new Date().toISOString()
    }

    // Determine if signup window is still open
    let isOpen = false
    if (config.is_unlocked && config.unlocked_at) {
      const unlockTime = new Date(config.unlocked_at).getTime()
      const windowEnd = unlockTime + config.signup_window_minutes * 60 * 1000
      isOpen = Date.now() < windowEnd
    }

    return new Response(
      JSON.stringify({
        currentBlock,
        targetBlock,
        startBlock: Number(config.start_block),
        targetBlocks: Number(config.target_blocks),
        startTimestamp: config.start_timestamp,
        isUnlocked: config.is_unlocked,
        unlockedAt: config.unlocked_at,
        signupWindowMinutes: config.signup_window_minutes,
        isOpen,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('check-block-clock error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
