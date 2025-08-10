import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Result = {
  updated: number;
  total_active: number;
  remaining_unknown: number;
  users_linked: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify requester is authenticated and allowed-domain
    const auth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes, error: authError } = await auth.auth.getUser();
    if (authError || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const email = userRes.user.email ?? "";
    const domain = email.split("@")[1] ?? "";

    const admin = createClient(supabaseUrl, serviceKey);

    // Check allowed domain
    const { data: allowed, error: domErr } = await admin
      .from("allowed_domains")
      .select("domain")
      .eq("domain", domain)
      .maybeSingle();

    if (domErr) {
      console.error("backfill-push-user-links allowed domain check error", domErr);
      return new Response(JSON.stringify({ error: domErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active subscriptions and opt-in events with known user ids
    const [{ data: subs, error: subsErr }, { data: events, error: eventsErr }] = await Promise.all([
      admin.from("push_subscriptions").select("id, endpoint, user_id, is_active").eq("is_active", true),
      admin.from("push_optin_events").select("subscription_id, endpoint, user_id").not("user_id", "is", null),
    ]);

    if (subsErr) {
      console.error("backfill-push-user-links subs error", subsErr);
      return new Response(JSON.stringify({ error: subsErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (eventsErr) {
      console.error("backfill-push-user-links events error", eventsErr);
      return new Response(JSON.stringify({ error: eventsErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endpointToUser = new Map<string, string>();
    const subIdToUser = new Map<string, string>();
    for (const e of events ?? []) {
      if (e.endpoint && e.user_id && !endpointToUser.has(e.endpoint)) endpointToUser.set(e.endpoint, e.user_id);
      if (e.subscription_id && e.user_id && !subIdToUser.has(e.subscription_id)) subIdToUser.set(e.subscription_id, e.user_id);
    }

    const idsByUser = new Map<string, string[]>();
    let remainingUnknown = 0;
    let usersLinkedSet = new Set<string>();

    for (const s of subs ?? []) {
      if (s.user_id) continue; // already linked
      const uid = endpointToUser.get(s.endpoint) || subIdToUser.get(s.id);
      if (uid) {
        const arr = idsByUser.get(uid) ?? [];
        arr.push(s.id);
        idsByUser.set(uid, arr);
        usersLinkedSet.add(uid);
      } else {
        remainingUnknown++;
      }
    }

    let updated = 0;
    for (const [uid, ids] of idsByUser.entries()) {
      if (ids.length === 0) continue;
      const { error: updErr } = await admin
        .from("push_subscriptions")
        .update({ user_id: uid, last_seen: new Date().toISOString() } as any)
        .in("id", ids);
      if (updErr) {
        console.error("backfill-push-user-links update error", updErr, { uid, count: ids.length });
        continue;
      }
      updated += ids.length;
    }

    const totalActive = (subs ?? []).length;

    const result: Result = {
      updated,
      total_active: totalActive,
      remaining_unknown: remainingUnknown,
      users_linked: usersLinkedSet.size,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("backfill-push-user-links unexpected error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
