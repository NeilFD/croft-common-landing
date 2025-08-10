
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "npm:web-push@3.6.6";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

type SendScope = "all" | "self";

type SendPushRequest = {
  // Preferred shape
  payload?: PushPayload;
  scope?: SendScope;
  dry_run?: boolean;
  // Back-compat: allow top-level payload fields too
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
};

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const email = userRes.user.email ?? "";

    // Enforce verified domain policy
    const { data: allowed, error: allowedErr } = await supabaseAdmin.rpc("is_email_domain_allowed", { email });
    if (allowedErr || !allowed) {
      return new Response(JSON.stringify({ error: "Forbidden: domain not allowed" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!; // e.g., mailto:hello@croftcommon.co.uk

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Support both shapes: { payload, scope, dry_run } and legacy top-level payload
const rawBody: SendPushRequest = await req.json().catch(() => ({} as any));
let scope: SendScope = rawBody?.scope ?? "all";
let dryRun: boolean = Boolean(rawBody?.dry_run);
let payload: PushPayload | undefined = rawBody?.payload as PushPayload | undefined;

if (!payload) {
  // Legacy shape where fields are top-level
  const maybe: any = rawBody ?? {};
  payload = {
    title: maybe.title,
    body: maybe.body,
    url: maybe.url,
    icon: maybe.icon,
    badge: maybe.badge,
  } as PushPayload;
}

// Basic validation
if (!payload?.title || !payload?.body) {
  return new Response(JSON.stringify({ error: "Missing payload.title or payload.body" }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Fetch active subscriptions (optionally scoped to current user)
let query = supabaseAdmin
  .from("push_subscriptions")
  .select("id, endpoint, p256dh, auth")
  .eq("is_active", true);

if (scope === "self") {
  query = query.eq("user_id", userRes.user.id);
}

const { data: subs, error: subsErr } = await query;

if (subsErr) {
  console.error("Failed to load subscriptions:", subsErr);
  return new Response(JSON.stringify({ error: "Failed to load subscriptions" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

if (dryRun) {
  return new Response(
    JSON.stringify({ recipients: subs?.length ?? 0, scope, dry_run: true }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

    let success = 0;
    let failed = 0;

    // Send in sequence for simplicity; can batch/parallelize if needed
    for (const s of subs ?? []) {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };

      try {
        await webpush.sendNotification(subscription as any, JSON.stringify(payload));
        success++;
      } catch (err: any) {
        failed++;
        const status = err?.statusCode ?? err?.status ?? 0;
        console.warn("Push send error to", s.endpoint, "status:", status);

        // 404/410: endpoint gone -> deactivate
        if (status === 404 || status === 410) {
          await supabaseAdmin.from("push_subscriptions").update({ is_active: false }).eq("id", s.id);
        }
      }
    }

return new Response(JSON.stringify({ success, failed, recipients: (subs?.length ?? 0), scope }), {
  status: 200,
  headers: { "Content-Type": "application/json", ...corsHeaders },
});
  } catch (e: any) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
