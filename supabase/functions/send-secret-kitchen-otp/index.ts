import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const normEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if email has secret kitchen access
    const { data: accessData, error: accessError } = await supabase
      .from('secret_kitchen_access')
      .select('email, is_active')
      .eq('email', normEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (accessError) {
      console.error('Access check error:', accessError);
      throw accessError;
    }

    if (!accessData) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing OTP codes for this email
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', normEmail);

    // Insert new OTP code
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        email: normEmail,
        code,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      throw insertError;
    }

    // Send email with OTP
    const originHeader = req.headers.get('origin') || '';
    const requestOrigin = originHeader || new URL(req.url).origin;
    const siteBase = Deno.env.get('SITE_BASE_URL') || requestOrigin;

    const emailRes = await resend.emails.send({
      from: "Croft Common <hello@thehive-hospitality.com>",
      to: [normEmail],
      subject: "Secret Kitchen Access Code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #eee">
          <h1 style="margin:0 0 12px 0;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:18px;color:#000">CROFT COMMON</h1>
          <h2 style="margin:0 0 16px 0;font-weight:600;font-size:16px;color:#000">Secret Kitchen Access</h2>
          <p style="margin:0 0 8px 0;color:#111">Enter this code to access the Secret Kitchen:</p>
          <div style="font-size:32px;letter-spacing:.2em;font-weight:700;margin:16px 0;color:#000">${code}</div>
          <p style="margin:8px 0;color:#555">This code expires in 10 minutes.</p>
          <p style="margin:16px 0;color:#555">Continue at: <a href="${siteBase.replace(/\/$/, '')}/secretkitchens">${siteBase.replace(/\/$/, '')}/secretkitchens</a></p>
        </div>
      `,
    });

    if ((emailRes as any)?.error) {
      console.error('Resend error', (emailRes as any).error);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    console.error('send-secret-kitchen-otp error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});