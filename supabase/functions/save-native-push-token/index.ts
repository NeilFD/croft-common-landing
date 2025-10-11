import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NativePushTokenRequest {
  platform: 'ios_native' | 'android_native';
  apns_token?: string;
  fcm_token?: string;
  device_model?: string;
  app_version?: string;
  session_id?: string;
  user_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body: NativePushTokenRequest = await req.json()
    
    console.log('[save-native-push-token] Received request:', {
      platform: body.platform,
      has_token: !!(body.apns_token || body.fcm_token),
      device_model: body.device_model,
      user_id: body.user_id
    })

    // Validation
    if (!body.platform || !['ios_native', 'android_native'].includes(body.platform)) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'Invalid platform. Must be ios_native or android_native' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = body.apns_token || body.fcm_token
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, reason: 'Missing token (apns_token or fcm_token required)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare upsert data
    const subscriptionData: any = {
      platform: body.platform,
      user_id: body.user_id || null,
      is_active: true,
      last_seen: new Date().toISOString(),
      device_info: {
        model: body.device_model,
        app_version: body.app_version,
        session_id: body.session_id
      }
    }

    // Set the appropriate token field
    if (body.platform === 'ios_native' && body.apns_token) {
      subscriptionData.apns_token = body.apns_token
    } else if (body.platform === 'android_native' && body.fcm_token) {
      subscriptionData.fcm_token = body.fcm_token
    }

    // Upsert into push_subscriptions
    // On conflict (platform + token), update last_seen and user_id
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: body.platform === 'ios_native' ? 'apns_token' : 'fcm_token',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('[save-native-push-token] Supabase error:', error)
      return new Response(
        JSON.stringify({ 
          ok: false, 
          reason: `Database error: ${error.message}`,
          code: error.code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[save-native-push-token] Success:', {
      id: data.id,
      platform: data.platform,
      user_linked: !!data.user_id
    })

    return new Response(
      JSON.stringify({ 
        ok: true, 
        subscription_id: data.id,
        user_linked: !!data.user_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[save-native-push-token] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        reason: `Unexpected error: ${error.message}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
