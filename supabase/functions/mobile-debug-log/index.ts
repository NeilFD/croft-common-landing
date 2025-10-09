import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple IP-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 200; // 200 logs per minute per IP

function getRealIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

function sanitizePayload(data: any): any {
  if (!data) return null;
  
  const str = JSON.stringify(data);
  // Truncate if too large
  if (str.length > 5000) {
    return { _truncated: true, preview: str.substring(0, 500) };
  }
  return data;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const ip = getRealIP(req);
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const body = await req.json();
    const {
      session_id,
      step,
      data,
      error_message,
      platform,
      user_agent,
      ts
    } = body;

    // Validate required fields
    if (!session_id || !step) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, step' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase service role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Sanitize data
    const sanitizedData = sanitizePayload(data);
    const truncatedUserAgent = user_agent ? user_agent.substring(0, 500) : null;
    const truncatedError = error_message ? error_message.substring(0, 1000) : null;

    // Insert log with service role (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('mobile_debug_logs')
      .insert({
        session_id,
        step,
        data: sanitizedData,
        error_message: truncatedError,
        platform: platform || 'unknown',
        user_agent: truncatedUserAgent,
        user_id: null // No auth context for these logs
      });

    if (insertError) {
      console.error('❌ Failed to insert log:', insertError);
      return new Response(
        JSON.stringify({ error: 'Database insert failed', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Logged: ${step} (${platform}) [${session_id.substring(0, 8)}...]`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
