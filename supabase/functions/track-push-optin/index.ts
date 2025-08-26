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
const RATE_LIMIT_MAX_REQUESTS = 20; // Max 20 tracking events per minute per IP
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

function validateEvent(event: string): boolean {
  const validEvents = ["prompt_shown", "granted", "denied", "subscribed", "unsubscribed"];
  return validEvents.includes(event);
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  return input.replace(/[<>'"&]/g, '').trim().substring(0, 100);
}

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

  const ip = getRealIP(req);
  const requestId = crypto.randomUUID();

  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`);
      return new Response(JSON.stringify({
        error: "Too many tracking requests. Please slow down.",
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

    const auth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes } = await auth.auth.getUser();
    const userId = userRes.user?.id ?? null;

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

    const requestBody = body as Body;
    
    // Enhanced input validation
    if (!requestBody?.event || typeof requestBody.event !== 'string') {
      return new Response(JSON.stringify({
        error: "Valid event type is required",
        code: "EVENT_REQUIRED"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!validateEvent(requestBody.event)) {
      return new Response(JSON.stringify({
        error: "Invalid event type",
        code: "INVALID_EVENT"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs
    const sanitizedPlatform = sanitizeInput(requestBody.platform || '');
    const sanitizedUserAgent = sanitizeInput(requestBody.user_agent || '');
    const sanitizedEndpoint = requestBody.endpoint ? 
      requestBody.endpoint.substring(0, 500) : null; // Limit endpoint length

    console.log(`[${requestId}] Tracking push opt-in event: ${requestBody.event} for ${userId ? 'authenticated' : 'anonymous'} user from IP: ${ip}`);

    const row = {
      user_id: userId,
      subscription_id: requestBody.subscription_id ?? null,
      event: requestBody.event,
      platform: sanitizedPlatform || null,
      user_agent: sanitizedUserAgent || null,
      endpoint: sanitizedEndpoint,
      details: requestBody.details && typeof requestBody.details === 'object' ? 
        requestBody.details : null,
    } as const;

    const { error } = await admin.from("push_optin_events").insert(row as any);
    if (error) {
      console.error(`[${requestId}] track-push-optin insert error`, error);
      return new Response(JSON.stringify({
        error: "Failed to record tracking event",
        code: "DATABASE_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${requestId}] Successfully tracked push opt-in event: ${requestBody.event}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[${requestId}] track-push-optin error`, err);
    
    // Sanitize error messages for production
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    const sanitizedMessage = errorMessage.includes("JWT") || errorMessage.includes("auth") ? 
      "Authentication error" : 
      errorMessage.includes("network") ? 
      "Network error" : 
      "Failed to track opt-in event";

    return new Response(JSON.stringify({
      error: sanitizedMessage,
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
