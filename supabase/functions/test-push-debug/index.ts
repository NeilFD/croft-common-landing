import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log("🔧 DEBUG: Starting test-push-debug function");
    
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT");

    console.log(`🔑 DEBUG: VAPID Configuration:`);
    console.log(`  - VAPID_SUBJECT: "${VAPID_SUBJECT}"`);
    console.log(`  - VAPID_PUBLIC_KEY present: ${!!VAPID_PUBLIC_KEY}`);
    console.log(`  - VAPID_PUBLIC_KEY length: ${VAPID_PUBLIC_KEY?.length || 0}`);
    console.log(`  - VAPID_PRIVATE_KEY present: ${!!VAPID_PRIVATE_KEY}`);
    console.log(`  - VAPID_PRIVATE_KEY length: ${VAPID_PRIVATE_KEY?.length || 0}`);

    // Try to call the actual send-push function to see what happens
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const authHeader = req.headers.get("Authorization");
    
    console.log(`📞 DEBUG: Attempting to call send-push function...`);
    console.log(`  - Auth header present: ${!!authHeader}`);
    console.log(`  - Supabase URL: ${SUPABASE_URL}`);

    const testPayload = {
      title: "Debug Test",
      body: "Testing push notification system",
      scope: "self",
      dry_run: true
    };

    console.log(`📦 DEBUG: Test payload:`, testPayload);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader || "",
        ...corsHeaders
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 DEBUG: Response status: ${response.status}`);
    console.log(`📊 DEBUG: Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📊 DEBUG: Response body: ${responseText}`);

    return new Response(JSON.stringify({
      vapid_config: {
        subject: VAPID_SUBJECT,
        public_key_present: !!VAPID_PUBLIC_KEY,
        private_key_present: !!VAPID_PRIVATE_KEY,
        public_key_length: VAPID_PUBLIC_KEY?.length || 0,
        private_key_length: VAPID_PRIVATE_KEY?.length || 0
      },
      send_push_test: {
        status: response.status,
        response_body: responseText
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("❌ DEBUG: Error in test-push-debug:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});