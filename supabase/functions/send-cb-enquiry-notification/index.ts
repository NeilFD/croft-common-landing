import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
const NOTIFY_TO = "neil.fincham-dukes@crazybear.co.uk";

interface Payload {
  category: string;
  property?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  details?: Record<string, any>;
}

const escape = (v: any) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function rows(obj: Record<string, any>) {
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;color:#000;width:160px;text-transform:capitalize;">${escape(
          k.replace(/_/g, " "),
        )}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;">${escape(v)}</td>
      </tr>`,
    )
    .join("");
}

function buildEmail(p: Payload) {
  const top = {
    Category: p.category,
    Property: p.property,
    Name: p.full_name,
    Email: p.email,
    Phone: p.phone,
  };
  return `
    <!DOCTYPE html>
    <html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8f8f8;">
      <div style="max-width:640px;margin:0 auto;background:#fff;">
        <div style="background:#000;padding:32px 24px;text-align:center;border-bottom:3px solid #FF1493;">
          <h1 style="margin:0;color:#fff;letter-spacing:0.2em;font-size:22px;text-transform:uppercase;">Crazy Bear</h1>
          <p style="margin:8px 0 0;color:#FF1493;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">New Enquiry</p>
        </div>
        <div style="padding:28px 24px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#000;">${escape(p.category.toUpperCase())} enquiry</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows(top)}${rows(p.details || {})}</table>
          ${
            p.message
              ? `<div style="margin-top:20px;padding:16px;background:#fff5f9;border-left:4px solid #FF1493;"><strong style="display:block;margin-bottom:6px;">Message</strong><div style="white-space:pre-wrap;color:#222;">${escape(p.message)}</div></div>`
              : ""
          }
        </div>
        <div style="background:#000;color:#fff;padding:16px;text-align:center;font-size:12px;letter-spacing:0.1em;">Submitted via crazybear.co.uk</div>
      </div>
    </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.email || !payload?.full_name || !payload?.category) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await resend.emails.send({
      from: "Crazy Bear Enquiries <neil@thehive-hospitality.com>",
      to: [NOTIFY_TO],
      replyTo: payload.email,
      subject: `New ${payload.category} enquiry: ${payload.full_name}${payload.property ? ` (${payload.property})` : ""}`,
      html: buildEmail(payload),
    });

    if ((result as any)?.error) {
      console.error("send-cb-enquiry-notification error:", (result as any).error);
      return new Response(JSON.stringify({ success: false, error: (result as any).error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-cb-enquiry-notification fatal:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
