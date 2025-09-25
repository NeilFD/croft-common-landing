import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { userHandle, email } = await req.json();
    if (!userHandle || !email) {
      return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const normEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normEmail)) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check subscription status
    const { data: sub, error: subErr } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('is_active', true)
      .eq('email', normEmail)
      .maybeSingle();

    if (subErr) throw subErr;
    if (!sub) {
      return new Response(JSON.stringify({ error: 'not_subscribed' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create one-time code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: insErr } = await supabase
      .from('membership_codes')
      .insert({ user_handle: userHandle, email: normEmail, code });

    if (insErr) throw insErr;

    // Send email with code
    const originHeader = req.headers.get('origin') || '';
    const requestOrigin = originHeader || new URL(req.url).origin;
    const siteBase = Deno.env.get('SITE_BASE_URL') || requestOrigin;

    const emailRes = await resend.emails.send({
      from: "Croft Common <hello@thehive-hospitality.com>",
      to: [normEmail],
      subject: "Your Croft Common verification code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #eee">
          <h1 style="margin:0 0 12px 0;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:18px;color:#000">CROFT COMMON</h1>
          <p style="margin:0 0 8px 0;color:#111">Enter this code to link your device to your membership:</p>
          <div style="font-size:32px;letter-spacing:.2em;font-weight:700;margin:16px 0;color:#000">${code}</div>
          <p style="margin:8px 0;color:#555">This code expires in 10 minutes.</p>
          <p style="margin:16px 0;color:#555">Use it where you started from: <a href="${siteBase.replace(/\/$/, '')}/common-room">${siteBase.replace(/\/$/, '')}/common-room</a></p>
        </div>
      `,
    });

    if ((emailRes as any)?.error) {
      console.error('Resend error', (emailRes as any).error);
      return new Response(JSON.stringify({ error: 'email_failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('start-membership-link error', e);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
