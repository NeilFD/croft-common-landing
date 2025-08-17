
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailPayload = {
  toEmail: string;
  primaryName: string;
  guestName?: string;
  quantity: number;
  ticketNumbers: number[];
  screeningDate: string; // YYYY-MM-DD
  doorsTime: string;     // HH:mm
  screeningTime: string; // HH:mm
  title?: string | null;
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const getEmailContent = async (keys: string[]) => {
  const { data, error } = await supabase
    .from('cms_global_content')
    .select('content_key, content_value')
    .eq('content_type', 'email_template')
    .in('content_key', keys)
    .eq('published', true);

  if (error) {
    console.error('Error fetching email content:', error);
    return {};
  }

  return data.reduce((acc, item) => {
    acc[item.content_key] = item.content_value;
    return acc;
  }, {} as Record<string, string>);
};

const fmtDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return isoDate;
  }
};

const buildHtml = async (p: EmailPayload, assetsBase: string) => {
  // Fetch cinema email content from CMS
  const contentKeys = [
    'cinema_email_header_brand',
    'cinema_email_confirmation_title',
    'cinema_email_ticket_label',
    'cinema_email_tagline'
  ];

  const content = await getEmailContent(contentKeys);
  const getContent = (key: string, fallback: string) => content[key] || fallback;

  const title = p.title || "Croft Common Secret Cinema";
  const dateStr = fmtDate(p.screeningDate);
  const namesLine = p.quantity === 2 && p.guestName
    ? `${p.primaryName} + ${p.guestName}`
    : p.primaryName;

  const logoPath = "/lovable-uploads/63419cda-09bf-4b7a-a6d0-d276c42efc8f.png";
  const logoUrl = assetsBase
    ? `${assetsBase.replace(/\/$/, '')}${logoPath}`
    : logoPath;

  const ticketBadge = (num: number) => `
    <span style="display:inline-block; border:2px dashed #cfcfd4; padding:8px 12px; border-radius:999px; background:#f2f3f7; margin-right:16px; margin-bottom:12px;">
      <img src="${logoUrl}" alt="Croft Common cinema ticket" width="28" height="28" style="display:inline-block; vertical-align:middle; border-radius:6px; margin-right:8px;" />
      <span style="display:inline-block; vertical-align:middle; font-size:14px; font-weight:700; color:#111;">${getContent('cinema_email_ticket_label', 'Ticket #')}${num}</span>
    </span>`;

  const badges = (p.ticketNumbers || []).map(ticketBadge).join('');

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f7f7f9; padding:24px; color:#111; line-height:1.55;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #eee; overflow:hidden;">
      <div style="padding:14px 18px; border-bottom:1px solid #f0f0f0; background:#0b0b0c; color:#ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle; width:40px;">
              <img src="${logoUrl}" alt="Croft Common" width="32" height="32" style="display:block; background:#ffffff; border-radius:6px;" />
            </td>
            <td style="vertical-align:middle; padding-left:18px;">
              <div style="font-weight:700; font-size:16px; color:#ffffff;">${getContent('cinema_email_header_brand', 'Croft Common • Secret Cinema')}</div>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding:22px;">
        <h2 style="margin:0 0 10px 0; font-size:22px; color:#111;">${getContent('cinema_email_confirmation_title', 'Your tickets are confirmed')}</h2>
        <div style="margin:6px 0 14px 0;">${badges}</div>
        <p style="margin:0 0 8px 0; font-weight:700; font-size:16px;">${title}</p>
        <p style="margin:0 0 8px 0;">
          <strong>When:</strong> ${dateStr}<br/>
          <strong>Doors:</strong> ${p.doorsTime} · <strong>Screening:</strong> ${p.screeningTime}
        </p>
        <p style="margin:0 0 8px 0;">
          <strong>Name${p.quantity === 2 ? 's' : ''}:</strong> ${namesLine}
        </p>
        <p style="margin:16px 0 0 0; color:#555;">${getContent('cinema_email_tagline', 'One night. One screen. Fifty tickets. The last Thursday of every month. Cult. Classic. Contemporary. Always uncommonly good.')}</p>
      </div>
    </div>
  </div>
  `;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const payload: EmailPayload = await req.json();
    if (!payload?.toEmail) {
      return new Response(JSON.stringify({ error: "Missing toEmail" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch email settings from CMS
    const settingsKeys = ['cinema_email_from_address', 'cinema_email_subject_template'];
    const settings = await getEmailContent(settingsKeys);
    
    const assetsBase = Deno.env.get('EMAIL_ASSETS_BASE_URL') || req.headers.get('origin') || '';
    const html = await buildHtml(payload, assetsBase);
    
    // Build subject from template
    const subjectTemplate = settings.cinema_email_subject_template || '{title} Ticket{plural}: #{ticketNumbers}';
    const subject = subjectTemplate
      .replace('{title}', payload.title ? 'Your ' + payload.title : 'Your Cinema')
      .replace('{plural}', payload.ticketNumbers.length > 1 ? 's' : '')
      .replace('{ticketNumbers}', payload.ticketNumbers.join(', '));

    const res = await resend.emails.send({
      from: settings.cinema_email_from_address || "Secret Cinema <secretcinema@thehive-hospitality.com>",
      to: [payload.toEmail],
      subject,
      html,
    });

    return new Response(JSON.stringify({ ok: true, id: (res as any)?.id ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-cinema-ticket-email error:", error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
