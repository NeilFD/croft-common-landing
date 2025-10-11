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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({
        error: "Service configuration error",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get authenticated user
    const { data: userData, error: authError } = await authClient.auth.getUser();
    
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({
        error: "Authentication required",
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    console.log(`Reactivating most recent subscription for user ${userId}`);

    // Find the most recent push_subscription for this user
    const { data: subscriptions, error: fetchError } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(JSON.stringify({
        error: "Failed to fetch subscriptions",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({
        error: "No push subscriptions found for this user",
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const latestSubscription = subscriptions[0];

    // Deactivate all other subscriptions first
    const { error: deactivateError } = await adminClient
      .from("push_subscriptions")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (deactivateError) {
      console.error("Error deactivating old subscriptions:", deactivateError);
    }

    // Reactivate the most recent one
    const { error: reactivateError } = await adminClient
      .from("push_subscriptions")
      .update({ is_active: true, last_seen: new Date().toISOString() })
      .eq("id", latestSubscription.id);

    if (reactivateError) {
      console.error("Error reactivating subscription:", reactivateError);
      return new Response(JSON.stringify({
        error: "Failed to reactivate subscription",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully reactivated subscription ${latestSubscription.id} for user ${userId}`);

    return new Response(JSON.stringify({ 
      ok: true, 
      subscription_id: latestSubscription.id,
      endpoint: latestSubscription.endpoint
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
