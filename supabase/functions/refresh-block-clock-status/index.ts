import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const BLOCK_TIME_MS = 400

const formatTime = (totalSeconds: number): string => {
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

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

    // Current Solana slot (read-only; never mutates block_clock_config)
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
      const elapsedMs = Date.now() - new Date(config.start_timestamp).getTime()
      currentBlock = Number(config.start_block) + Math.floor(elapsedMs / BLOCK_TIME_MS)
    }

    const startBlock = Number(config.start_block)
    const targetBlocks = Number(config.target_blocks) || 1
    const targetBlock = startBlock + targetBlocks

    const blocksRemaining = Math.max(0, targetBlock - currentBlock)
    const secondsRemaining = Math.floor((blocksRemaining * BLOCK_TIME_MS) / 1000)
    const elapsed = currentBlock - startBlock
    const progress = Math.min(100, Math.max(0, (elapsed / targetBlocks) * 100))

    const windowMinutes = Number(config.signup_window_minutes) || 60
    let state: 'countdown' | 'open' | 'closed' = 'countdown'
    let signupMinutesRemaining = 0

    if (config.is_unlocked && config.unlocked_at) {
      const windowEnd = new Date(config.unlocked_at).getTime() + windowMinutes * 60 * 1000
      const msLeft = windowEnd - Date.now()
      if (msLeft > 0) {
        state = 'open'
        signupMinutesRemaining = Math.max(0, Math.ceil(msLeft / 60000))
      } else {
        state = 'closed'
      }
    }

    const snapshot = {
      id: 1,
      state,
      current_block: currentBlock,
      target_block: targetBlock,
      blocks_remaining: blocksRemaining,
      seconds_remaining: secondsRemaining,
      time_remaining_human: formatTime(secondsRemaining),
      progress_percent: Number(progress.toFixed(2)),
      signup_open: state === 'open',
      signup_window_minutes: windowMinutes,
      signup_minutes_remaining: signupMinutesRemaining,
      unlocked_at: config.is_unlocked ? config.unlocked_at : null,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from('block_clock_status')
      .upsert(snapshot, { onConflict: 'id' })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ success: true, snapshot }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('refresh-block-clock-status error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
