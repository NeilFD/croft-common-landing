import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requester is authenticated
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userData, error: authError } = await authClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: subs, error: subsError } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, user_id, is_active")
      .eq("is_active", true);

    if (subsError) {
      console.error("get-enabled-users-count subscriptions error", subsError);
      return new Response(JSON.stringify({ error: subsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: events, error: eventsError } = await adminClient
      .from("push_optin_events")
      .select("subscription_id, endpoint, user_id")
      .not("user_id", "is", null);

    if (eventsError) {
      console.error("get-enabled-users-count events error", eventsError);
      return new Response(JSON.stringify({ error: eventsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endpointToUser = new Map<string, string>();
    const subIdToUser = new Map<string, string>();
    for (const e of events ?? []) {
      if (e.endpoint && e.user_id && !endpointToUser.has(e.endpoint)) {
        endpointToUser.set(e.endpoint, e.user_id);
      }
      if (e.subscription_id && e.user_id && !subIdToUser.has(e.subscription_id)) {
        subIdToUser.set(e.subscription_id, e.user_id);
      }
    }

    const userSet = new Set<string>();
    let unknown = 0;
    for (const s of subs ?? []) {
      const uid = s.user_id || endpointToUser.get(s.endpoint) || subIdToUser.get(s.id);
      if (uid) userSet.add(uid);
      else unknown++;
    }

    const result = {
      count: userSet.size, // distinct users
      devices: (subs ?? []).length, // active endpoints
      unknown_endpoints: unknown, // active endpoints we can't map to a user
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-enabled-users-count unexpected error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
