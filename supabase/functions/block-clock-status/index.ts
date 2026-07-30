import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase
      .from('block_clock_status')
      .select('*')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Status not available yet' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Snapshot is refreshed hourly, or every 5 minutes while signup is open.
    const ageSeconds = Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 1000)
    const maxAge = data.state === 'open' ? 15 * 60 : 2 * 60 * 60

    const body = {
      state: data.state,
      current_block: Number(data.current_block),
      target_block: Number(data.target_block),
      blocks_remaining: Number(data.blocks_remaining),
      seconds_remaining: Number(data.seconds_remaining),
      time_remaining_human: data.time_remaining_human,
      progress_percent: Number(data.progress_percent),
      signup_open: data.signup_open,
      signup_window_minutes: data.signup_window_minutes,
      signup_minutes_remaining: data.signup_minutes_remaining,
      unlocked_at: data.unlocked_at,
      updated_at: data.updated_at,
      age_seconds: ageSeconds,
      stale: ageSeconds > maxAge,
    }

    return new Response(JSON.stringify(body), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
      status: 200,
    })
  } catch (error) {
    console.error('block-clock-status error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
