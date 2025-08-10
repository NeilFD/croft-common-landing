import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  event: "prompt_shown" | "granted" | "denied" | "subscribed" | "unsubscribed";
  subscription_id?: string;
  platform?: string;
  user_agent?: string;
  endpoint?: string;
  details?: Record<string, unknown>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes } = await auth.auth.getUser();
    const userId = userRes.user?.id ?? null;

    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body?.event) {
      return new Response(JSON.stringify({ error: "Missing event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = {
      user_id: userId,
      subscription_id: body.subscription_id ?? null,
      event: body.event,
      platform: body.platform ?? null,
      user_agent: body.user_agent ?? null,
      endpoint: body.endpoint ?? null,
      details: body.details ?? null,
    } as const;

    const { error } = await admin.from("push_optin_events").insert(row as any);
    if (error) {
      console.error("track-push-optin insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-push-optin error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
