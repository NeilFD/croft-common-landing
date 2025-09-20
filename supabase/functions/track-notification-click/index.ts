import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Support GET with query string and POST with JSON body
    const url = new URL(req.url);
    const isGet = req.method === 'GET';
    const body = isGet ? {} as any : await req.json().catch(() => ({} as any));
    const clickToken = (url.searchParams.get('ntk') || body.click_token || body.ntk || '').trim();
    const explicitUserId = (url.searchParams.get('user') || body.user_id || '').trim() || null;

    if (!clickToken) {
      return new Response(JSON.stringify({ error: 'Missing click token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find delivery by click token
    const { data: delivery, error: deliveryErr } = await supabase
      .from('notification_deliveries')
      .select('id, notification_id, subscription_id, status')
      .eq('click_token', clickToken)
      .maybeSingle();

    if (deliveryErr || !delivery) {
      return new Response(JSON.stringify({ error: 'Click token not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get notification to resolve campaign_id
    const { data: notification } = await supabase
      .from('notifications')
      .select('id, campaign_id')
      .eq('id', delivery.notification_id)
      .maybeSingle();

    // Resolve user_id from subscription if not explicitly provided
    let userId: string | null = explicitUserId;
    if (!userId && delivery.subscription_id) {
      const { data: sub } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .eq('id', delivery.subscription_id)
        .maybeSingle();
      userId = (sub?.user_id as string) || null;
    }

    // Record campaign click analytics if we know the campaign
    let analyticsRecorded = false;
    if (notification?.campaign_id) {
      // Check idempotency
      const { data: existing } = await supabase
        .from('campaign_analytics')
        .select('id')
        .eq('campaign_id', notification.campaign_id)
        .eq('user_id', userId)
        .eq('event_type', 'clicked')
        .maybeSingle();

      if (!existing) {
        const { error: insertErr } = await supabase
          .from('campaign_analytics')
          .insert({
            campaign_id: notification.campaign_id,
            user_id: userId,
            event_type: 'clicked',
            metadata: { source: 'track-notification-click' },
          } as any);
        if (!insertErr) analyticsRecorded = true;
      }
    }

    // Mark delivery as clicked (idempotent) and bump campaign clicked_count once
    let campaignUpdated = false;
    const shouldIncrement = delivery.status !== 'clicked';
    if (shouldIncrement) {
      await supabase
        .from('notification_deliveries')
        .update({ status: 'clicked' })
        .eq('id', delivery.id);

      // Increment campaign clicked_count once per unique click
      if (notification?.campaign_id) {
        const { data: camp } = await supabase
          .from('campaigns')
          .select('id, clicked_count')
          .eq('id', notification.campaign_id)
          .maybeSingle();
        const next = ((camp?.clicked_count as number) || 0) + 1;
        const { error: campErr } = await supabase
          .from('campaigns')
          .update({ clicked_count: next })
          .eq('id', notification.campaign_id);
        if (!campErr) campaignUpdated = true;
      }
    }

    return new Response(JSON.stringify({ success: true, analyticsRecorded, campaignUpdated }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('track-notification-click error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});