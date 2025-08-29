import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 push subscription saves per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRealIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(',')[0] || 
         request.headers.get("x-real-ip") || 
         request.headers.get("cf-connecting-ip") ||
         "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  existing.count++;
  return false;
}

function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

function validateEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    // Check for valid push service domains
    const validDomains = [
      'fcm.googleapis.com',
      'updates.push.services.mozilla.com',
      'wns2-par02p.notify.windows.com',
      'notify.bugsnag.com',
      'web.push.apple.com' // Apple Push Service
    ];
    return validDomains.some(domain => url.hostname.includes(domain)) && 
           endpoint.length <= 2048; // Reasonable URL length limit
  } catch {
    return false;
  }
}

function sanitizeUserAgent(userAgent: string): string {
  if (!userAgent) return '';
  // Remove potentially dangerous characters and limit length
  return userAgent.replace(/[<>'"&]/g, '').trim().substring(0, 200);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = getRealIP(req);
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`);
      return new Response(JSON.stringify({
        error: "Too many subscription requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED"
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": "60" 
        },
      });
    }

    // Cleanup old rate limit entries periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanupRateLimit();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error(`[${requestId}] Missing required environment variables`);
      return new Response(JSON.stringify({
        error: "Service configuration error",
        code: "CONFIG_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({
        error: "Invalid request format",
        code: "INVALID_JSON"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { endpoint, p256dh, auth, user_agent, platform, user_id: providedUserId } = body as {
      endpoint?: string;
      p256dh?: string;
      auth?: string;
      user_agent?: string;
      platform?: string;
      user_id?: string;
    };

    // Enhanced input validation
    if (!endpoint || typeof endpoint !== 'string') {
      return new Response(JSON.stringify({
        error: "Valid push endpoint is required",
        code: "ENDPOINT_REQUIRED"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!validateEndpoint(endpoint)) {
      return new Response(JSON.stringify({
        error: "Invalid push endpoint format",
        code: "INVALID_ENDPOINT"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required push keys
    if (!p256dh || !auth) {
      return new Response(JSON.stringify({
        error: "Push subscription keys are required",
        code: "KEYS_REQUIRED"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs
    const sanitizedUserAgent = sanitizeUserAgent(user_agent || '');
    const sanitizedPlatform = platform ? platform.replace(/[<>'"&]/g, '').trim().substring(0, 20) : 'web';

    // Use provided user_id (from WebAuthn) or fallback to traditional auth
    let userId: string | null = providedUserId || null;
    
    if (!userId) {
      const { data: userData } = await authClient.auth.getUser();
      userId = userData?.user?.id ?? null;
    }

    console.log(`[${requestId}] Processing subscription for ${userId ? 'authenticated' : 'anonymous'} user${userId ? ` (${userId})` : ''} from IP: ${ip}`);
    if (providedUserId) {
      console.log(`[${requestId}] Using WebAuthn-provided user_id: ${providedUserId}`);
    }

    const row = {
      endpoint,
      p256dh: p256dh ?? null,
      auth: auth ?? null,
      user_agent: sanitizedUserAgent,
      platform: sanitizedPlatform,
      user_id: userId,
      is_active: true,
      last_seen: new Date().toISOString(),
    } as const;

    console.log(`[${requestId}] Upserting subscription for endpoint: ${new URL(endpoint).hostname}`);
    const { data: upserted, error } = await adminClient
      .from("push_subscriptions")
      .upsert(row, { onConflict: "endpoint" })
      .select("id, endpoint")
      .single();

    if (error) {
      console.error(`[${requestId}] save-push-subscription upsert error`, error);
      return new Response(JSON.stringify({
        error: "Failed to save push subscription",
        code: "DATABASE_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] Successfully upserted subscription ${upserted?.id}`);

    // AFTER successful upsert, deactivate any other active subscriptions for this user
    // This prevents race conditions where user is left with no active subscriptions
    if (userId && upserted?.id) {
      console.log(`[${requestId}] Deactivating other active subscriptions for user ${userId}`);
      const { error: deactivateError } = await adminClient
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true)
        .neq("id", upserted.id);

      if (deactivateError) {
        console.error(`[${requestId}] Error deactivating old subscriptions:`, deactivateError);
        // Don't fail the request - the new subscription was successfully created
      } else {
        console.log(`[${requestId}] Successfully deactivated old subscriptions for user ${userId}`);
      }
    }

    console.log(`[${requestId}] Subscription saved successfully - ID: ${upserted?.id}`);
    return new Response(JSON.stringify({ 
      ok: true, 
      subscription_id: upserted?.id, 
      endpoint: upserted?.endpoint 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[${requestId}] save-push-subscription unexpected error`, err);
    
    // Sanitize error messages for production
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    const sanitizedMessage = errorMessage.includes("JWT") || errorMessage.includes("auth") ? 
      "Authentication error" : 
      errorMessage.includes("network") ? 
      "Network error" : 
      "Failed to save push subscription";

    return new Response(JSON.stringify({
      error: sanitizedMessage,
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
