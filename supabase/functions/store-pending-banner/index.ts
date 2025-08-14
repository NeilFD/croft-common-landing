import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  notificationToken: string;
  title: string;
  body: string;
  bannerMessage?: string;
  url?: string;
  icon?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => ({}))) as Body;
    const { notificationToken, title, body: messageBody, bannerMessage, url, icon } = body;

    console.log('store-pending-banner', { 
      hasToken: Boolean(notificationToken), 
      title, 
      hasBannerMessage: Boolean(bannerMessage),
      bannerMessage 
    });

    if (!notificationToken || !title || !messageBody) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the banner data in the database
    const { error } = await admin
      .from("pending_banners")
      .insert({
        notification_token: notificationToken,
        title,
        body: messageBody,
        banner_message: bannerMessage,
        url,
        icon,
      });

    if (error) {
      console.error("store-pending-banner error", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("store-pending-banner error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});