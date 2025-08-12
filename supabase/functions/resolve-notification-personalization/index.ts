import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function firstPart(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const space = trimmed.indexOf(" ");
  return (space > 0 ? trimmed.slice(0, space) : trimmed);
}

function fromEmailLocal(email?: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  if (!local) return null;
  // Capitalize first letter for niceness
  return local.charAt(0).toUpperCase() + local.slice(1);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({} as any));
    const token = (body?.token ?? "").toString();
    const refUrl = (body?.url ?? "").toString();

    if (!token) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Find the delivery row by click token -> gives us endpoint
    const { data: delivery, error: dErr } = await admin
      .from("notification_deliveries")
      .select("endpoint, subscription_id")
      .eq("click_token", token)
      .maybeSingle();

    if (dErr) console.warn("resolve-personalization delivery error", dErr);

    if (!delivery?.endpoint) {
      return new Response(JSON.stringify({ first_name: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Map endpoint -> user_id via push_subscriptions
    const { data: sub, error: sErr } = await admin
      .from("push_subscriptions")
      .select("user_id, endpoint")
      .eq("endpoint", delivery.endpoint)
      .order("last_seen", { ascending: false })
      .maybeSingle();

    if (sErr) console.warn("resolve-personalization subscription error", sErr);

    let firstName: string | null = null;

    if (sub?.user_id) {
      // 3) Try auth user metadata
      try {
        const { data: usr } = await admin.auth.admin.getUserById(sub.user_id);
        const meta = usr?.user?.user_metadata as Record<string, unknown> | undefined;
        const email = usr?.user?.email ?? null;
        const mFirst = (
          (meta?.["first_name"] as string | undefined) ||
          (meta?.["given_name"] as string | undefined) ||
          (meta?.["name"] as string | undefined)
        ) ?? null;
        firstName = firstPart(mFirst) || fromEmailLocal(email);

        // 4) If still nothing, try subscribers table by email match
        if (!firstName && email) {
          const { data: subr } = await admin
            .from("subscribers")
            .select("name, email")
            .eq("email", email)
            .maybeSingle();
          firstName = firstPart(subr?.name) || fromEmailLocal(email);
        }
      } catch (e) {
        console.warn("resolve-personalization auth lookup error", e);
      }
    }

    return new Response(
      JSON.stringify({ first_name: firstName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Referrer": refUrl } }
    );
  } catch (err) {
    console.error("resolve-notification-personalization error", err);
    return new Response(JSON.stringify({ error: "unexpected_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
