import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔧 Starting simple-push-test");
    
    // Test VAPID configuration
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT");

    console.log(`🔑 VAPID Config: subject="${VAPID_SUBJECT}", public_len=${VAPID_PUBLIC_KEY?.length}, private_len=${VAPID_PRIVATE_KEY?.length}`);

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      const error = "Missing VAPID configuration";
      console.error(`❌ ${error}`);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Test webpush import
    console.log("📦 Testing webpush import...");
    let webpush;
    try {
      webpush = await import("https://esm.sh/web-push@3.6.6");
      console.log("✅ webpush imported successfully");
    } catch (webpushError) {
      console.error("❌ webpush import failed:", webpushError);
      return new Response(JSON.stringify({ error: `webpush import failed: ${webpushError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Test VAPID setting
    console.log("🔧 Testing VAPID configuration...");
    try {
      webpush.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      console.log("✅ VAPID details set successfully");
    } catch (vapidError) {
      console.error("❌ VAPID configuration failed:", vapidError);
      return new Response(JSON.stringify({ error: `VAPID configuration failed: ${vapidError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Test Supabase connection
    console.log("🔗 Testing Supabase connection...");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const error = "Missing Supabase configuration";
      console.error(`❌ ${error}`);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Test database query
    console.log("🗄️ Testing database query...");
    try {
      const { data: testQuery, error: queryError } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id")
        .eq("is_active", true)
        .limit(1);
      
      if (queryError) {
        console.error("❌ Database query failed:", queryError);
        return new Response(JSON.stringify({ error: `Database query failed: ${queryError.message}` }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      console.log("✅ Database query successful");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return new Response(JSON.stringify({ error: `Database connection failed: ${dbError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log("🎉 All tests passed!");
    
    return new Response(JSON.stringify({ 
      success: true,
      vapid_configured: true,
      webpush_loaded: true,
      database_connected: true,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("💥 Unexpected error:", error);
    console.error("Stack trace:", error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      name: error.name 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});