import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 notification events per minute per IP
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

function validateNotificationType(type: string): boolean {
  const validTypes = ["notification_click", "notification_open"];
  return validTypes.includes(type);
}

function validateToken(token: string): boolean {
  // Basic token format validation (should be a hex string)
  return /^[a-f0-9]{32,}$/i.test(token) && token.length <= 128;
}

type Body = {
  type: "notification_click" | "notification_open";
  token?: string;
  url?: string;
};

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
        error: "Too many notification events. Please slow down.",
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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      console.error(`[${requestId}] Missing required environment variables`);
      return new Response(JSON.stringify({
        error: "Service configuration error",
        code: "CONFIG_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

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

    const requestBody = body as Body & { [k: string]: any };
    const { type, token, url } = requestBody;

    console.log(`[${requestId}] track-notification-event`, { type, hasToken: Boolean(token), url, ip });

    // Enhanced input validation
    if (!type || typeof type !== 'string') {
      return new Response(JSON.stringify({
        error: "Valid event type is required",
        code: "TYPE_REQUIRED"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!validateNotificationType(type)) {
      return new Response(JSON.stringify({
        error: "Invalid notification event type",
        code: "INVALID_TYPE"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type.startsWith("notification_") && token && !validateToken(token)) {
      return new Response(JSON.stringify({
        error: "Invalid token format",
        code: "INVALID_TOKEN"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL if provided
    if (url && typeof url === 'string') {
      try {
        new URL(url); // Will throw if invalid
        if (url.length > 2048) {
          return new Response(JSON.stringify({
            error: "URL too long",
            code: "URL_TOO_LONG"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        return new Response(JSON.stringify({
          error: "Invalid URL format",
          code: "INVALID_URL"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (token) {
      // Mark clicked when we receive a token (idempotent)
      const { error: updateError } = await admin
        .from("notification_deliveries")
        .update({ clicked_at: new Date().toISOString() } as any)
        .is("clicked_at", null)
        .eq("click_token", token);

      if (updateError) {
        console.error(`[${requestId}] Error updating notification delivery:`, updateError);
        // Don't fail the request - tracking is not critical
      } else {
        console.log(`[${requestId}] Successfully marked notification as clicked for token: ${token.substring(0, 8)}...`);
      }
    }

    console.log(`[${requestId}] Successfully tracked notification event: ${type}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[${requestId}] track-notification-event error`, err);
    
    // Sanitize error messages for production
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    const sanitizedMessage = errorMessage.includes("JWT") || errorMessage.includes("auth") ? 
      "Authentication error" : 
      errorMessage.includes("network") ? 
      "Network error" : 
      "Failed to track notification event";

    return new Response(JSON.stringify({
      error: sanitizedMessage,
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
