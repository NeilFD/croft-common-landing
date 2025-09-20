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
      // Resolve delivery by token and perform first-open/click semantics
      const { data: delivery, error: delErr } = await admin
        .from('notification_deliveries')
        .select('id, notification_id, subscription_id, status, opened_at')
        .eq('click_token', token)
        .maybeSingle();

      if (delErr || !delivery) {
        console.warn(`[${requestId}] Click token not found or DB error`, { hasError: Boolean(delErr) });
      } else {
        // Get notification to resolve campaign
        const { data: notification } = await admin
          .from('notifications')
          .select('id, campaign_id')
          .eq('id', delivery.notification_id)
          .maybeSingle();

        // Resolve user_id from subscription if available
        let userId: string | null = null;
        if ((delivery as any).subscription_id) {
          const { data: sub } = await admin
            .from('push_subscriptions')
            .select('user_id')
            .eq('id', (delivery as any).subscription_id)
            .maybeSingle();
          userId = (sub?.user_id as string) || null;
        }

        if (type === 'notification_open') {
          // Handle notification opened/viewed
          const { data: updatedRows, error: updateErr } = await admin
            .from('notification_deliveries')
            .update({ opened_at: new Date().toISOString() } as any)
            .eq('id', (delivery as any).id)
            .is('opened_at', null)
            .select('id');

          const firstOpen = !updateErr && Array.isArray(updatedRows) && updatedRows.length > 0;

          if (firstOpen) {
            console.log(`[${requestId}] First open recorded for delivery ${(delivery as any).id}`);
            if (notification?.campaign_id) {
              // Record analytics
              const { error: insertErr } = await admin
                .from('campaign_analytics')
                .insert({
                  campaign_id: notification.campaign_id,
                  user_id: userId,
                  event_type: 'opened',
                  metadata: { source: 'track-notification-event' },
                } as any);
              if (insertErr) {
                console.error(`[${requestId}] Failed to insert opened analytics`, insertErr);
              }

              // Increment campaign opened_count
              const { data: camp } = await admin
                .from('campaigns')
                .select('id, opened_count')
                .eq('id', notification.campaign_id)
                .maybeSingle();

              const next = ((camp?.opened_count as number) || 0) + 1;
              const { error: campErr } = await admin
                .from('campaigns')
                .update({ opened_count: next })
                .eq('id', notification.campaign_id);
              if (campErr) {
                console.error(`[${requestId}] Failed to update campaign opened_count`, campErr);
              } else {
                console.log(`[${requestId}] Campaign ${notification.campaign_id} opened_count incremented to ${next}`);
              }
            }
          }
        } else if (type === 'notification_click') {
          // Handle notification clicked - same logic as before
          const { data: updatedRows, error: updateErr } = await admin
            .from('notification_deliveries')
            .update({ status: 'clicked', clicked_at: new Date().toISOString() } as any)
            .eq('id', (delivery as any).id)
            .neq('status', 'clicked')
            .select('id');

          const firstClick = !updateErr && Array.isArray(updatedRows) && updatedRows.length > 0;

          if (firstClick) {
            console.log(`[${requestId}] First click recorded for delivery ${(delivery as any).id}`);
            if (notification?.campaign_id) {
              // Record analytics
              const { error: insertErr } = await admin
                .from('campaign_analytics')
                .insert({
                  campaign_id: notification.campaign_id,
                  user_id: userId,
                  event_type: 'clicked',
                  metadata: { source: 'track-notification-event' },
                } as any);
              if (insertErr) {
                console.error(`[${requestId}] Failed to insert campaign analytics`, insertErr);
              }

              // Increment campaign clicked_count
              const { data: camp } = await admin
                .from('campaigns')
                .select('id, clicked_count')
                .eq('id', notification.campaign_id)
                .maybeSingle();

              const next = ((camp?.clicked_count as number) || 0) + 1;
              const { error: campErr } = await admin
                .from('campaigns')
                .update({ clicked_count: next })
                .eq('id', notification.campaign_id);
              if (campErr) {
                console.error(`[${requestId}] Failed to update campaign clicked_count`, campErr);
              } else {
                console.log(`[${requestId}] Campaign ${notification.campaign_id} clicked_count incremented to ${next}`);
              }
            }
          } else {
            // Ensure clicked_at is set at least once
            const { error: ensureErr } = await admin
              .from('notification_deliveries')
              .update({ clicked_at: new Date().toISOString() } as any)
              .eq('id', (delivery as any).id)
              .is('clicked_at', null);
            if (ensureErr) {
              console.error(`[${requestId}] Failed to ensure clicked_at`, ensureErr);
            }
          }
        }
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
