import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
};

type SendScope = "all" | "self";

type SendPushRequest = {
  payload?: PushPayload;
  scope?: SendScope;
  dry_run?: boolean;
  user_ids?: string[];
  campaign_id?: string;
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
};

// Personalization helpers
function renderTemplate(str: string, vars: { [k: string]: string | undefined }): string {
  if (!str) return str;
  return str.replace(/\{\{\s*(first_name)\s*\}\}/gi, (_: any, k: string) => {
    const v = vars[k.toLowerCase()];
    return v ? String(v) : "";
  });
}

// APNs JWT Token Generation
async function createApnsJwt(keyId: string, teamId: string, privateKey: string): Promise<string> {
  const header = {
    alg: "ES256",
    kid: keyId
  };
  
  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000)
  };
  
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(JSON.stringify(header));
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  
  const headerB64 = btoa(String.fromCharCode(...headerBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(String.fromCharCode(...payloadBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const message = `${headerB64}.${payloadB64}`;
  
  // Import the private key
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(message)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${message}.${signatureB64}`;
}

// Send APNs notification
async function sendApnsNotification(token: string, payload: any, keyId: string, teamId: string, privateKey: string, environment: string = "production"): Promise<void> {
  const jwt = await createApnsJwt(keyId, teamId, privateKey);
  
  const apnsPayload = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body
      },
      badge: 1,
      sound: "default",
      'mutable-content': 1
    },
    url: payload.url,
    click_token: payload.click_token,
    notification_id: payload.notification_id
  };
  
  const apnsEndpoint = environment === "sandbox" 
    ? "https://api.sandbox.push.apple.com"
    : "https://api.push.apple.com";
  
  const response = await fetch(`${apnsEndpoint}/3/device/${token}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'apns-topic': 'com.croftcommon.beacon',
      'apns-priority': '10'
    },
    body: JSON.stringify(apnsPayload)
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`APNs error ${response.status}: ${errorBody}`);
  }
}

// Send FCM notification (Android)
async function sendFcmNotification(token: string, payload: any, fcmServerKey: string): Promise<void> {
  const fcmPayload = {
    to: token,
    priority: "high",
    notification: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/badge-72.png",
      click_action: payload.url || "/",
      tag: payload.notification_id
    },
    data: {
      url: payload.url,
      click_token: payload.click_token,
      notification_id: payload.notification_id
    }
  };
  
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${fcmServerKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fcmPayload)
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`FCM error ${response.status}: ${errorBody}`);
  }
}

async function buildFirstNameMap(supabaseAdmin: any, userIds: string[]): Promise<Map<string, string>> {
  const uniq = Array.from(new Set((userIds || []).filter(Boolean)));
  console.log(`👤 Building first name map for ${uniq.length} users`);
  const map = new Map<string, string>();
  for (const uid of uniq) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name')
        .eq('user_id', uid)
        .maybeSingle();
      
      let name: string | undefined = profile?.first_name;
      
      if (!name) {
        const { data: res } = await supabaseAdmin.auth.admin.getUserById(uid);
        const u = res?.user as any;
        const meta: any = u?.user_metadata ?? {};
        name = meta.first_name || meta.given_name || meta.name;
        
        if (!name && u?.email) {
          const { data: sub } = await supabaseAdmin
            .from('subscribers')
            .select('name')
            .eq('email', u.email)
            .maybeSingle();
          name = sub?.name as string | undefined;
        }
      }
      
      if (name) {
        const first = String(name).trim().split(/\s+/)[0];
        if (first) {
          map.set(uid, first);
        }
      }
    } catch (_e) {
      console.error(`Error looking up name for ${uid}:`, _e);
    }
  }
  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const hasAuth = !!req.headers.get("Authorization");
    console.log(`🔐 Auth header present: ${hasAuth}`);

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const email = userRes.user.email ?? "";
    console.log(`✅ Authenticated user: ${email}`);

    // Enforce verified domain policy
    const { data: allowed, error: allowedErr } = await supabaseAdmin.rpc("is_email_domain_allowed", { email });
    if (allowedErr || !allowed) {
      return new Response(JSON.stringify({ error: "Forbidden: domain not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Native push credentials
    const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID");
    const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID");
    const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY");
    const APNS_ENVIRONMENT = Deno.env.get("APNS_ENVIRONMENT") || "production";
    const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");

    console.log(`🔑 Native Push Configuration:`);
    console.log(`  - APNs Environment: ${APNS_ENVIRONMENT}`);
    console.log(`  - APNs configured: ${!!(APNS_KEY_ID && APNS_TEAM_ID && APNS_PRIVATE_KEY)}`);
    console.log(`  - FCM configured: ${!!FCM_SERVER_KEY}`);

    if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_PRIVATE_KEY) {
      console.error(`❌ Missing APNs configuration`);
      return new Response(JSON.stringify({ error: "APNs credentials not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse body
    const rawBody: SendPushRequest = await req.json().catch(() => ({} as any));
    const scope: SendScope = (rawBody?.scope as SendScope) ?? "all";
    const targetUserIds: string[] = Array.from(new Set((rawBody?.user_ids || []).filter(Boolean)));
    const campaignId: string | undefined = rawBody?.campaign_id;
    const dryRun: boolean = Boolean(rawBody?.dry_run);
    let payload: PushPayload | undefined = rawBody?.payload as PushPayload | undefined;

    if (!payload) {
      const maybe: any = rawBody ?? {};
      payload = {
        title: maybe.title,
        body: maybe.body,
        url: maybe.url,
        icon: maybe.icon,
        badge: maybe.badge,
        image: maybe.image,
      } as PushPayload;
    }

    if (!payload?.title || !payload?.body) {
      return new Response(JSON.stringify({ error: "Missing payload.title or payload.body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch native push subscriptions only
    console.log(`🔍 Fetching native subscriptions for scope="${scope}" (targetUserIds=${targetUserIds.length})`);
    if (targetUserIds.length > 0) {
      console.log(`🎯 Targeting explicit user_ids:`, targetUserIds.slice(0, 5), targetUserIds.length > 5 ? `... and ${targetUserIds.length - 5} more` : '');
    }
    
    let query = supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, user_id, platform")
      .eq("is_active", true)
      .or("endpoint.like.ios-token:%,endpoint.like.android-token:%");

    if (targetUserIds.length > 0) {
      query = query.in("user_id", targetUserIds);
    } else if (scope === "self") {
      console.log(`🎯 Self-scope detected, using authenticated user ID: ${userRes.user.id}`);
      query = query.eq("user_id", userRes.user.id);
    }

    const { data: subs, error: subsErr } = await query;
    console.log(`📊 Found ${subs?.length || 0} native subscriptions`);
    
    if (subs && subs.length > 0) {
      console.log(`📱 Subscription details:`, subs.map(s => ({
        id: s.id,
        platform: (s as any).platform || 'unknown',
        user_id: s.user_id,
        is_native: s.endpoint.startsWith('ios-token:') || s.endpoint.startsWith('android-token:')
      })));
    }
    
    if (subsErr) {
      console.error("Failed to load subscriptions:", subsErr);
      return new Response(JSON.stringify({ error: "Failed to load subscriptions" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!subs || subs.length === 0) {
      console.warn("⚠️ No active native push subscriptions found");
      return new Response(
        JSON.stringify({ error: "No active push subscriptions for target audience", recipients: 0, scope }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create notification record
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("notifications")
      .insert({
        created_by: userRes.user.id,
        created_by_email: email,
        title: payload.title,
        body: payload.body,
        url: payload.url ?? null,
        icon: payload.icon ?? null,
        badge: payload.badge ?? null,
        banner_message: (payload as any).banner_message ?? null,
        display_mode: (payload as any).display_mode ?? 'navigation',
        scope: scope,
        campaign_id: campaignId,
        dry_run: dryRun,
        recipients_count: subs?.length ?? 0,
        status: dryRun ? "sent" : "sending",
        sent_at: dryRun ? new Date().toISOString() : null,
      } as any)
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("Failed to insert notification:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create notification record" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const notificationId = inserted.id as string;

    if (dryRun) {
      return new Response(
        JSON.stringify({
          recipients: subs?.length ?? 0,
          scope,
          dry_run: true,
          notification_id: notificationId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let success = 0;
    let failed = 0;

    // Build personalization map
    const userFirstNames = await buildFirstNameMap(
      supabaseAdmin,
      (subs ?? []).map((s: any) => s.user_id as string).filter(Boolean)
    );

    // Send to each subscription
    console.log(`🚀 Starting to send native notifications to ${subs?.length || 0} devices`);
    for (const s of subs ?? []) {
      const clickToken = randomHex(16);
      const first = (s as any).user_id ? userFirstNames.get((s as any).user_id) : undefined;
      const personalizedTitle = renderTemplate(payload!.title, { first_name: first });
      const personalizedBody = renderTemplate(payload!.body, { first_name: first });
      
      const baseUrl = payload!.url || "/notifications";
      const userParam = (s as any).user_id ? `&user=${encodeURIComponent((s as any).user_id)}` : '';
      const notificationUrl = `/c/${clickToken}?u=${encodeURIComponent(baseUrl)}${userParam}`;
      
      const payloadForSub = { 
        title: personalizedTitle, 
        body: personalizedBody, 
        url: notificationUrl,
        icon: payload!.icon,
        badge: payload!.badge,
        click_token: clickToken, 
        notification_id: notificationId 
      };

      const isIos = s.endpoint.startsWith('ios-token:');
      const isAndroid = s.endpoint.startsWith('android-token:');
      
      console.log(`📬 Processing ${isIos ? 'iOS' : isAndroid ? 'Android' : 'Unknown'} device ${s.id}`);

      try {
        if (isIos) {
          const iosToken = s.endpoint.replace('ios-token:', '');
          console.log(`🍎 Sending APNs notification to ${APNS_ENVIRONMENT} environment...`);
          await sendApnsNotification(iosToken, payloadForSub, APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT);
          success++;
          console.log(`✅ Successfully sent APNs notification`);
        } else if (isAndroid) {
          if (!FCM_SERVER_KEY) {
            throw new Error("FCM credentials not configured");
          }
          const androidToken = s.endpoint.replace('android-token:', '');
          console.log(`🤖 Sending FCM notification...`);
          await sendFcmNotification(androidToken, payloadForSub, FCM_SERVER_KEY);
          success++;
          console.log(`✅ Successfully sent FCM notification`);
        } else {
          throw new Error("Unknown platform - not a native token");
        }

        await supabaseAdmin.from("notification_deliveries").insert({
          notification_id: notificationId,
          subscription_id: s.id,
          endpoint: s.endpoint,
          status: "sent",
          error: null,
          click_token: clickToken,
        } as any);
      } catch (err: any) {
        failed++;
        const statusCode = err?.statusCode ?? err?.status ?? 0;
        const isGone = statusCode === 404 || statusCode === 410;
        console.error(`❌ Failed to send to ${s.id}:`, err.message);

        if (isGone) {
          await supabaseAdmin.from("push_subscriptions").update({ is_active: false }).eq("id", s.id);
        }

        await supabaseAdmin.from("notification_deliveries").insert({
          notification_id: notificationId,
          subscription_id: s.id,
          endpoint: s.endpoint,
          status: isGone ? "deactivated" : "failed",
          error: String(err?.message ?? err),
          click_token: clickToken,
        } as any);
      }
    }

    // Update notification with final counts
    await supabaseAdmin
      .from("notifications")
      .update({
        status: failed === 0 ? "sent" : "failed",
        success_count: success,
        failed_count: failed,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    console.log(`✅ Notification complete: ${success} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        notification_id: notificationId,
        success,
        failed,
        recipients: subs?.length ?? 0,
        scope,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
