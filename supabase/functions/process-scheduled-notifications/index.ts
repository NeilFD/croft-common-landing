import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Recurrence helper
function computeNextOccurrence(currentISO: string, rule: any): string | null {
  try {
    if (!rule || rule.type === "none") return null;
    const every = Math.max(1, Number(rule.every ?? 1));
    const dt = new Date(currentISO);
    
    if (rule.type === "daily") {
      dt.setUTCDate(dt.getUTCDate() + every);
      return dt.toISOString();
    }
    
    if (rule.type === "weekly") {
      const weekdays: number[] = Array.isArray(rule.weekdays) ? rule.weekdays.map((n: any) => Number(n)) : [];
      const jsToIso = (js: number) => (js === 0 ? 7 : js);
      const current = new Date(currentISO);
      const currentIsoDow = jsToIso(current.getUTCDay());

      for (let wk = 0; wk < 8 * every; wk++) {
        for (let d = 1; d <= 7; d++) {
          const candidate = new Date(current);
          candidate.setUTCDate(candidate.getUTCDate() + wk * 7 + d);
          const isoDow = jsToIso(candidate.getUTCDay());
          if (weekdays.includes(isoDow) && candidate > current) {
            return candidate.toISOString();
          }
        }
      }
      
      const fallback = new Date(current);
      fallback.setUTCDate(fallback.getUTCDate() + (7 * every));
      return fallback.toISOString();
    }
    
    if (rule.type === "monthly") {
      const dayOfMonth = Number(rule.dayOfMonth ?? new Date(currentISO).getUTCDate());
      const current = new Date(currentISO);
      const year = current.getUTCFullYear();
      const month = current.getUTCMonth();
      const nextMonthIndex = month + every;
      const next = new Date(Date.UTC(year, nextMonthIndex, 1, current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds()));
      const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(dayOfMonth, lastDay));
      return next.toISOString();
    }
    
    return null;
  } catch {
    return null;
  }
}

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
        if (first) map.set(uid, first);
      }
    } catch (_e) {}
  }
  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Native push credentials
    const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID");
    const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID");
    const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY");
    const APNS_ENVIRONMENT = Deno.env.get("APNS_ENVIRONMENT") || "production";
    const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
    
    console.log(`🔑 APNs Environment: ${APNS_ENVIRONMENT}`);
    
    if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "APNs credentials not configured" }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pick due notifications
    const nowISO = new Date().toISOString();
    const { data: due, error: dueErr } = await supabase
      .from("notifications")
      .select("*")
      .in("status", ["queued"])
      .lte("scheduled_for", nowISO)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (dueErr) {
      console.error("Scheduler: failed to fetch due notifications", dueErr);
      return new Response(JSON.stringify({ error: "Failed to fetch due notifications" }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    let processed = 0;
    for (const n of due ?? []) {
      processed++;

      // Fetch native subscriptions only
      let query = supabase
        .from("push_subscriptions")
        .select("id, endpoint, user_id, platform")
        .eq("is_active", true);

      if (n.scope === "self" && n.created_by) {
        query = query.eq("user_id", n.created_by);
      }

      const { data: subs, error: subsErr } = await query;
      if (subsErr) {
        console.error("Scheduler: Failed to load subscriptions:", subsErr);
        await supabase
          .from("notifications")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", n.id);
        continue;
      }

      let success = 0;
      let failed = 0;

      // Build personalization map
      const userFirstNames = await buildFirstNameMap(
        supabase,
        (subs ?? []).map((s: any) => s.user_id as string).filter(Boolean)
      );

      for (const s of subs ?? []) {
        const clickToken = randomHex(16);
        const first = (s as any).user_id ? userFirstNames.get((s as any).user_id) : undefined;
        const personalizedTitle = renderTemplate(n.title, { first_name: first });
        const personalizedBody = renderTemplate(n.body, { first_name: first });
        
        const baseUrl = n.url || "/notifications";
        const userParam = (s as any).user_id ? `&user=${encodeURIComponent((s as any).user_id)}` : '';
        const trackingUrl = `/c/${clickToken}?u=${encodeURIComponent(baseUrl)}${userParam}`;
        
        const payloadForSub = {
          title: personalizedTitle,
          body: personalizedBody,
          url: trackingUrl,
          icon: n.icon ?? undefined,
          badge: n.badge ?? undefined,
          notification_id: n.id,
          click_token: clickToken,
        };

        const isIos = s.endpoint.startsWith('ios-token:');
        const isAndroid = s.endpoint.startsWith('android-token:');

        try {
          if (isIos) {
            const iosToken = s.endpoint.replace('ios-token:', '');
            await sendApnsNotification(iosToken, payloadForSub, APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY, APNS_ENVIRONMENT);
            success++;
          } else if (isAndroid) {
            if (!FCM_SERVER_KEY) {
              throw new Error("FCM credentials not configured");
            }
            const androidToken = s.endpoint.replace('android-token:', '');
            await sendFcmNotification(androidToken, payloadForSub, FCM_SERVER_KEY);
            success++;
          } else {
            throw new Error("Unknown platform - not a native token");
          }

          await supabase.from("notification_deliveries").insert({
            notification_id: n.id,
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

          if (isGone) {
            await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", s.id);
          }

          await supabase.from("notification_deliveries").insert({
            notification_id: n.id,
            subscription_id: s.id,
            endpoint: s.endpoint,
            status: isGone ? "deactivated" : "failed",
            error: String(err?.message ?? err),
            click_token: clickToken,
          } as any);
        }
      }

      // Handle recurrence
      const now = new Date().toISOString();
      const timesSent = Number(n.times_sent ?? 0) + 1;

      const shouldRepeat = !!n.repeat_rule;
      let nextISO: string | null = null;
      if (shouldRepeat) {
        nextISO = computeNextOccurrence(n.scheduled_for ?? now, n.repeat_rule);
      }

      const occurrencesLimit = n.occurrences_limit as number | null;
      const repeatUntil = n.repeat_until as string | null;

      let finalStatus = "sent";
      let update: any = {
        success_count: Number(n.success_count ?? 0) + success,
        failed_count: Number(n.failed_count ?? 0) + failed,
        sent_at: now,
        updated_at: now,
        times_sent: timesSent,
      };

      const limitExceeded = occurrencesLimit ? timesSent >= occurrencesLimit : false;
      const dateExceeded = repeatUntil ? new Date(nextISO ?? now) > new Date(repeatUntil) : false;

      if (shouldRepeat && nextISO && !limitExceeded && !dateExceeded) {
        finalStatus = "queued";
        update.status = finalStatus;
        update.scheduled_for = nextISO;
      } else {
        finalStatus = failed === 0 ? "sent" : "failed";
        update.status = finalStatus;
        update.scheduled_for = null;
        update.repeat_rule = null;
        update.repeat_until = null;
        update.occurrences_limit = null;
      }

      await supabase.from("notifications").update(update).eq("id", n.id);
    }

    return new Response(JSON.stringify({ processed: processed, picked: due?.length ?? 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("process-scheduled-notifications error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
