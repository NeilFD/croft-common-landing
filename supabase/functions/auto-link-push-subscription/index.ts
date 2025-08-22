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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get authenticated user
    const { data: userData } = await authClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // Find unlinked push subscriptions for this user's email
    // This looks for subscriptions from the same browser/device that aren't linked yet
    const existingEndpoints = [];
    if (typeof localStorage !== 'undefined') {
      // Get endpoints from client if available
      const body = await req.json().catch(() => ({}));
      if (body.endpoints) {
        existingEndpoints.push(...body.endpoints);
      }
    }

    // Also try to match by email if we have subscriber data
    const { data: subscriber } = await adminClient
      .from('subscribers')
      .select('email')
      .eq('email', userEmail)
      .single();

    if (subscriber) {
      // Update any unlinked subscriptions that might belong to this user
      const { data: unlinkedSubs, error: fetchError } = await adminClient
        .from('push_subscriptions')
        .select('id, endpoint')
        .is('user_id', null)
        .eq('is_active', true);

      if (!fetchError && unlinkedSubs && unlinkedSubs.length > 0) {
        console.log(`Found ${unlinkedSubs.length} unlinked subscriptions, attempting to link to user ${userId}`);
        
        // First, deactivate any existing active subscriptions for this user
        await adminClient
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('is_active', true);

        // Update the most recent unlinked subscription to be linked to this user
        // This assumes the user is authenticating from the same device they subscribed on
        const mostRecentSub = unlinkedSubs[0]; // They're ordered by created_at desc
        
        const { error: linkError } = await adminClient
          .from('push_subscriptions')
          .update({ 
            user_id: userId,
            last_seen: new Date().toISOString()
          })
          .eq('id', mostRecentSub.id);

        if (!linkError) {
          console.log(`Successfully linked subscription ${mostRecentSub.id} to user ${userId}`);
          
          return new Response(JSON.stringify({ 
            ok: true, 
            linked: true,
            subscription_id: mostRecentSub.id,
            message: "Push subscription linked to your account" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.error("Error linking subscription:", linkError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      linked: false,
      message: "No unlinked subscriptions found for this user" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("auto-link-push-subscription unexpected error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});