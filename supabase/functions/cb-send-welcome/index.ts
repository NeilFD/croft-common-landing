import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { CBWelcomeEmail } from '../_shared/email-templates/cb-welcome.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'The Crazy Bear'
const SENDER_DOMAIN = 'notify.crazybeartest.com'
const FROM_DOMAIN = 'crazybeartest.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      },
    )

    // Identify caller via JWT
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = userData.user
    const recipient = user.email
    if (!recipient) {
      return new Response(JSON.stringify({ error: 'No email on user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service-role client for queue + log writes
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Idempotency: only send the welcome once per user
    const idempotencyKey = `cb-welcome-${user.id}`
    const { data: latestDelivery } = await admin
      .from('email_send_log')
      .select('status')
      .eq('message_id', idempotencyKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestDelivery?.status === 'sent') {
      return new Response(
        JSON.stringify({ success: true, skipped: 'already_sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (latestDelivery?.status === 'pending' || latestDelivery?.status === 'rate_limited') {
      return new Response(
        JSON.stringify({ success: true, skipped: 'already_queued' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Pull first name from cb_members if present
    let firstName: string | undefined
    const { data: member } = await admin
      .from('cb_members')
      .select('first_name')
      .eq('user_id', user.id)
      .maybeSingle()
    if (member?.first_name) firstName = member.first_name

    const { data: existingToken } = await admin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', recipient)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const unsubscribeToken = existingToken?.token ?? crypto.randomUUID()
    if (!existingToken?.token) {
      await admin.from('email_unsubscribe_tokens').insert({
        email: recipient,
        token: unsubscribeToken,
      })
    }

    const html = await renderAsync(
      React.createElement(CBWelcomeEmail, { recipient, firstName }),
    )
    const text = await renderAsync(
      React.createElement(CBWelcomeEmail, { recipient, firstName }),
      { plainText: true },
    )

    await admin.from('email_send_log').insert({
      message_id: idempotencyKey,
      template_name: 'cb_welcome',
      recipient_email: recipient,
      status: 'pending',
    })

    const { error: enqueueError } = await admin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: idempotencyKey,
        idempotency_key: idempotencyKey,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: "You're in. The den remembers.",
        html,
        text,
        purpose: 'transactional',
        label: 'cb_welcome',
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      await admin.from('email_send_log').insert({
        message_id: `${idempotencyKey}-err`,
        template_name: 'cb_welcome',
        recipient_email: recipient,
        status: 'failed',
        error_message: enqueueError.message,
      })
      return new Response(JSON.stringify({ error: 'Failed to enqueue' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ success: true, queued: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('cb-send-welcome error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
