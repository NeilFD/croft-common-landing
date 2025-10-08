import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { WebPush } from "jsr:@negrel/webpush";
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

// Very small recurrence helper
function computeNextOccurrence(
  currentISO: string,
  rule: any
): string | null {
  try {
    if (!rule || rule.type === "none") return null;
    const every = Math.max(1, Number(rule.every ?? 1));
    const dt = new Date(currentISO); // Work in UTC by ISO
    if (rule.type === "daily") {
      dt.setUTCDate(dt.getUTCDate() + every);
      return dt.toISOString();
    }
    if (rule.type === "weekly") {
      const weekdays: number[] = Array.isArray(rule.weekdays) ? rule.weekdays.map((n: any) => Number(n)) : [];
      // Map JS DOW 0..6 (Sun..Sat) -> 1..7 (Mon..Sun)
      const jsToIso = (js: number) => (js === 0 ? 7 : js);
      const current = new Date(currentISO);
      const currentIsoDow = jsToIso(current.getUTCDay());

      // Collect upcoming week days within 'every' weeks horizon
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
      // fallback: + every weeks
      const fallback = new Date(current);
      fallback.setUTCDate(fallback.getUTCDate() + (7 * every));
      return fallback.toISOString();
    }
    if (rule.type === "monthly") {
      const dayOfMonth = Number(rule.dayOfMonth ?? new Date(currentISO).getUTCDate());
      const current = new Date(currentISO);
      const year = current.getUTCFullYear();
      const month = current.getUTCMonth();
      // Move months forward
      const nextMonthIndex = month + every;
      const next = new Date(Date.UTC(year, nextMonthIndex, 1, current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds()));
      // Clamp DOM
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

async function buildFirstNameMap(supabaseAdmin: any, userIds: string[]): Promise<Map<string, string>> {
  const uniq = Array.from(new Set((userIds || []).filter(Boolean)));
  const map = new Map<string, string>();
  for (const uid of uniq) {
    try {
      // First check profiles table for first_name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name')
        .eq('user_id', uid)
        .maybeSingle();
      
      let name: string | undefined = profile?.first_name;
      
      // If not found in profiles, fallback to auth metadata
      if (!name) {
        const { data: res } = await supabaseAdmin.auth.admin.getUserById(uid);
        const u = res?.user as any;
        const meta: any = u?.user_metadata ?? {};
        name = meta.first_name || meta.given_name || meta.name;
        
        // If still not found, check subscribers table by email
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
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const webpush = new WebPush({
      subject: VAPID_SUBJECT,
      publicKey: VAPID_PUBLIC_KEY,
      privateKey: VAPID_PRIVATE_KEY,
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pick due notifications (simple batching)
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
      return new Response(JSON.stringify({ error: "Failed to fetch due notifications" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    let processed = 0;
    for (const n of due ?? []) {
      processed++;

      // Fetch recipients
      let query = supabase
      .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, user_id")
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

      // Build personalization map (first names) for user-linked subscriptions
      const userFirstNames = await buildFirstNameMap(
        supabase,
        (subs ?? []).map((s: any) => s.user_id as string).filter(Boolean)
      );

      for (const s of subs ?? []) {
        const clickToken = randomHex(16);
        const first = (s as any).user_id ? userFirstNames.get((s as any).user_id) : undefined;
        const personalizedTitle = renderTemplate(n.title, { first_name: first });
        const personalizedBody = renderTemplate(n.body, { first_name: first });
        
        // Generate relative tracking URL for CTR tracking
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

        try {
          await webpush.send({
            endpoint: s.endpoint,
            keys: {
              p256dh: s.p256dh,
              auth: s.auth,
            },
            payload: JSON.stringify(payloadForSub),
            ttl: 86400,
          });
          success++;

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

      // Determine if we should repeat
      const now = new Date().toISOString();
      const timesSent = Number(n.times_sent ?? 0) + 1;

      const shouldRepeat = !!n.repeat_rule;
      let nextISO: string | null = null;
      if (shouldRepeat) {
        nextISO = computeNextOccurrence(n.scheduled_for ?? now, n.repeat_rule);
      }

      // Respect occurrences limit and repeat_until (if present)
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
