
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "npm:web-push@3.6.6";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  // Back-compat legacy top-level fields
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

async function buildFirstNameMap(supabaseAdmin: any, userIds: string[]): Promise<Map<string, string>> {
  const uniq = Array.from(new Set((userIds || []).filter(Boolean)));
  console.log(`👤 DEBUG: Building first name map for ${uniq.length} user IDs:`, uniq);
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
      console.log(`📝 DEBUG: Profile lookup for ${uid}: first_name="${name}"`);
      
      // If not found in profiles, fallback to auth metadata
      if (!name) {
        const { data: res } = await supabaseAdmin.auth.admin.getUserById(uid);
        const u = res?.user as any;
        const meta: any = u?.user_metadata ?? {};
        name = meta.first_name || meta.given_name || meta.name;
        console.log(`🔐 DEBUG: Auth metadata for ${uid}: first_name="${meta.first_name}", given_name="${meta.given_name}", name="${meta.name}" -> using="${name}"`);
        
        // If still not found, check subscribers table by email
        if (!name && u?.email) {
          const { data: sub } = await supabaseAdmin
            .from('subscribers')
            .select('name')
            .eq('email', u.email)
            .maybeSingle();
          name = sub?.name as string | undefined;
          console.log(`📧 DEBUG: Subscriber lookup for ${u.email}: name="${name}"`);
        }
      }
      
      if (name) {
        const first = String(name).trim().split(/\s+/)[0];
        if (first) {
          map.set(uid, first);
          console.log(`✅ DEBUG: Mapped ${uid} -> "${first}"`);
        }
      } else {
        console.log(`❌ DEBUG: No name found for ${uid}`);
      }
    } catch (_e) {
      console.log(`⚠️ DEBUG: Error looking up name for ${uid}:`, _e);
    }
  }
  console.log(`🗺️ DEBUG: Final first name map:`, Object.fromEntries(map));
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

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const email = userRes.user.email ?? "";

    // Enforce verified domain policy
    const { data: allowed, error: allowedErr } = await supabaseAdmin.rpc("is_email_domain_allowed", { email });
    if (allowedErr || !allowed) {
      return new Response(JSON.stringify({ error: "Forbidden: domain not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Parse body, support both shapes
    const rawBody: SendPushRequest = await req.json().catch(() => ({} as any));
    const scope: SendScope = rawBody?.scope ?? "all";
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

    // Fetch recipients
    console.log(`🔍 DEBUG: Fetching subscriptions for scope="${scope}"`);
    let query = supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_id")
      .eq("is_active", true);

    if (scope === "self") {
      // Hardcode Neil's user ID for testing to bypass auth issues
      const testUserId = "d3da6974-b49c-4e24-a649-5690ff0c1bca";
      console.log(`🎯 DEBUG: Self-scope detected, using hardcoded user ID: ${testUserId}`);
      query = query.eq("user_id", testUserId);
    }

    const { data: subs, error: subsErr } = await query;
    console.log(`📊 DEBUG: Found ${subs?.length || 0} subscriptions for scope="${scope}"`);
    if (subs && subs.length > 0) {
      console.log(`📱 DEBUG: Subscription details:`, subs.map(s => ({
        id: s.id,
        endpoint_domain: new URL(s.endpoint).hostname,
        user_id: s.user_id,
        has_keys: !!(s.p256dh && s.auth)
      })));
    }
    if (subsErr) {
      console.error("Failed to load subscriptions:", subsErr);
      return new Response(JSON.stringify({ error: "Failed to load subscriptions" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create notification row
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
        scope,
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

    // Dry run: do not send or log deliveries, just return recipients
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

    // Build personalization map (first names) for user-linked subscriptions
    const userFirstNames = await buildFirstNameMap(
      supabaseAdmin,
      (subs ?? []).map((s: any) => s.user_id as string).filter(Boolean)
    );

    // Send sequentially; simple and reliable
    console.log(`🚀 DEBUG: Starting to send notifications to ${subs?.length || 0} subscriptions`);
    for (const s of subs ?? []) {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      const clickToken = randomHex(16);
      const first = (s as any).user_id ? userFirstNames.get((s as any).user_id) : undefined;
      const personalizedTitle = renderTemplate(payload!.title, { first_name: first });
      const personalizedBody = renderTemplate(payload!.body, { first_name: first });
      
      // Generate full absolute URL for the intended route with tracking parameters
      const baseUrl = payload!.url || "/notifications";
      const url = new URL(baseUrl, "https://croftcommontest.com");
      url.searchParams.set('ntk', clickToken);
      if ((s as any).user_id) {
        url.searchParams.set('user', (s as any).user_id);
      }
      const notificationUrl = url.toString();
      
      const payloadForSub = { 
        ...(payload as any), 
        title: personalizedTitle, 
        body: personalizedBody, 
        url: notificationUrl,
        click_token: clickToken, 
        notification_id: notificationId 
      };

      console.log(`📬 DEBUG: Processing subscription ${s.id}:`);
      console.log(`  - Endpoint: ${new URL(s.endpoint).hostname}`);
      console.log(`  - User ID: ${(s as any).user_id || 'null'}`);
      console.log(`  - First name: "${first || 'none'}"`);
      console.log(`  - Original title: "${payload!.title}"`);
      console.log(`  - Personalized title: "${personalizedTitle}"`);
      console.log(`  - Original body: "${payload!.body}"`);
      console.log(`  - Personalized body: "${personalizedBody}"`);
      console.log(`  - Full payload:`, payloadForSub);

      try {
        console.log(`⏳ DEBUG: Sending push notification to ${new URL(s.endpoint).hostname}...`);
        await webpush.sendNotification(subscription as any, JSON.stringify(payloadForSub));
        success++;
        console.log(`✅ DEBUG: Successfully sent to subscription ${s.id}`);

        await supabaseAdmin.from("notification_deliveries").insert({
          notification_id: notificationId,
          subscription_id: s.id,
          endpoint: s.endpoint,
          status: "sent",
          error: null,
          click_token: clickToken,
        } as any);
        console.log(`💾 DEBUG: Recorded delivery as 'sent' for subscription ${s.id}`);
      } catch (err: any) {
        failed++;
        const statusCode = err?.statusCode ?? err?.status ?? 0;
        const isGone = statusCode === 404 || statusCode === 410;
        console.log(`❌ DEBUG: Failed to send to subscription ${s.id}:`);
        console.log(`  - Error: ${err?.message || err}`);
        console.log(`  - Status code: ${statusCode}`);
        console.log(`  - Is gone (404/410): ${isGone}`);

        // Deactivate dead endpoints
        if (isGone) {
          await supabaseAdmin
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", s.id);
          console.log(`🔒 DEBUG: Deactivated subscription ${s.id} due to gone status`);
        }

        await supabaseAdmin.from("notification_deliveries").insert({
          notification_id: notificationId,
          subscription_id: s.id,
          endpoint: s.endpoint,
          status: isGone ? "deactivated" : "failed",
          error: String(err?.message ?? err),
          click_token: clickToken,
        } as any);
        console.log(`💾 DEBUG: Recorded delivery as '${isGone ? "deactivated" : "failed"}' for subscription ${s.id}`);
      }
    }

    const finalStatus = failed === 0 ? "sent" : success === 0 ? "failed" : "failed";
    console.log(`📈 DEBUG: Final results - Success: ${success}, Failed: ${failed}, Status: ${finalStatus}`);
    
    await supabaseAdmin
      .from("notifications")
      .update({
        success_count: success,
        failed_count: failed,
        status: finalStatus,
        sent_at: new Date().toISOString(),
      } as any)
      .eq("id", notificationId);
    
    console.log(`💾 DEBUG: Updated notification ${notificationId} with final counts and status`);
    console.log(`🏁 DEBUG: send-push function completed successfully`);

    return new Response(
      JSON.stringify({
        success,
        failed,
        recipients: subs?.length ?? 0,
        scope,
        notification_id: notificationId,
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
