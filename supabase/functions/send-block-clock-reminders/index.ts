const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get un-notified reminders
    const { data: reminders, error: remindersError } = await supabase
      .from('block_clock_reminders')
      .select('id, email')
      .eq('notified', false)

    if (remindersError) throw remindersError
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No pending reminders' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get existing members from twitter_whitelist to exclude
    const { data: members } = await supabase
      .from('twitter_whitelist')
      .select('twitter_handle')

    // We don't have email-to-handle mapping so we send to all non-notified
    // In the future, cross-reference can be improved

    let sent = 0
    let failed = 0

    for (const reminder of reminders) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Arubaito Club <notify@notify.arubaito.app>',
            to: [reminder.email],
            subject: '🔓 Arubaito Club Signup is NOW OPEN!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #ed565a; font-size: 24px; margin-bottom: 16px;">
                  The Block Clock Has Unlocked!
                </h1>
                <p style="color: #333; font-size: 14px; line-height: 1.6;">
                  The 1 Million Solana Block countdown is complete. The Arubaito Club signup window is now open for a limited time.
                </p>
                <p style="color: #333; font-size: 14px; line-height: 1.6;">
                  Apply now before the window closes!
                </p>
                <a href="https://arubaito.lovable.app/arubaito" 
                   style="display: inline-block; background-color: #ed565a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  Apply Now
                </a>
                <p style="color: #999; font-size: 11px; margin-top: 24px;">
                  You're receiving this because you set a reminder on Arubaito Club.
                </p>
              </div>
            `,
          }),
        })

        if (res.ok) {
          await supabase
            .from('block_clock_reminders')
            .update({ notified: true })
            .eq('id', reminder.id)
          sent++
        } else {
          console.error(`Failed to send to ${reminder.email}:`, await res.text())
          failed++
        }
      } catch (e) {
        console.error(`Error sending to ${reminder.email}:`, e)
        failed++
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total: reminders.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-block-clock-reminders error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
