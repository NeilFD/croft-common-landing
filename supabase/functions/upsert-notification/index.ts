
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Mode = "draft" | "schedule";

type NotificationInput = {
  title: string;
  body: string;
  url?: string | null;
  icon?: string | null;
  badge?: string | null;
  scope?: "all" | "self";
  dry_run?: boolean;
};

type ScheduleInput = {
  scheduled_for?: string | null; // ISO in UTC
  timezone?: string | null;
  repeat_rule?: any | null;
  occurrences_limit?: number | null;
  repeat_until?: string | null; // ISO in UTC
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
    const user = userRes.user;
    const email = user.email ?? "";

    // Enforce verified domain policy
    const { data: allowed, error: allowedErr } = await supabaseAdmin.rpc("is_email_domain_allowed", { email });
    if (allowedErr || !allowed) {
      return new Response(JSON.stringify({ error: "Forbidden: domain not allowed" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const body = await req.json().catch(() => ({}));
    const mode: Mode = body?.mode ?? "draft";
    const id: string | null = body?.id ?? null;
    const notification: NotificationInput = body?.notification ?? {};
    const schedule: ScheduleInput = body?.schedule ?? {};

    if (!notification?.title || !notification?.body) {
      return new Response(JSON.stringify({ error: "Missing notification.title or notification.body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const nowISO = new Date().toISOString();
    const baseRow: any = {
      created_by: user.id,
      created_by_email: email,
      title: notification.title,
      body: notification.body,
      url: notification.url ?? null,
      icon: notification.icon ?? null,
      badge: notification.badge ?? null,
      scope: (notification.scope ?? "all") as "all" | "self",
      dry_run: Boolean(notification.dry_run ?? false),
      updated_at: nowISO,
    };

    if (mode === "draft") {
      baseRow.status = "draft";
      baseRow.scheduled_for = null;
      baseRow.schedule_timezone = null;
      baseRow.repeat_rule = null;
      baseRow.repeat_until = null;
      baseRow.occurrences_limit = null;
    } else {
      // schedule
      const sf = schedule?.scheduled_for ?? null;
      if (!sf) {
        return new Response(JSON.stringify({ error: "scheduled_for is required to schedule" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      baseRow.status = "queued";
      baseRow.scheduled_for = sf;
      baseRow.schedule_timezone = schedule?.timezone ?? null;
      baseRow.repeat_rule = schedule?.repeat_rule ?? null;
      baseRow.repeat_until = schedule?.repeat_until ?? null;
      baseRow.occurrences_limit = schedule?.occurrences_limit ?? null;
    }

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .update(baseRow)
        .eq("id", id)
        .select("id, status")
        .single();

      if (error) {
        console.error("upsert-notification update error", error);
        return new Response(JSON.stringify({ error: "Failed to update notification" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      return new Response(JSON.stringify({ id: data.id, status: data.status }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    } else {
      baseRow.created_at = nowISO;
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .insert(baseRow)
        .select("id, status")
        .single();

      if (error) {
        console.error("upsert-notification insert error", error);
        return new Response(JSON.stringify({ error: "Failed to create notification" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      return new Response(JSON.stringify({ id: data.id, status: data.status }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
  } catch (e: any) {
    console.error("upsert-notification error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
