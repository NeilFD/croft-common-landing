
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

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

const fmtDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return isoDate;
  }
};

const buildHtml = (p: EmailPayload) => {
  const title = p.title || "Secret Cinema Club";
  const dateStr = fmtDate(p.screeningDate);
  const namesLine = p.quantity === 2 && p.guestName
    ? `${p.primaryName} + ${p.guestName}`
    : p.primaryName;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color: #111; line-height: 1.55;">
    <h2 style="margin:0 0 8px 0;">Your tickets are confirmed 🎟️</h2>
    <p style="margin:0 0 16px 0;"><strong>${title}</strong></p>
    <p style="margin:0 0 8px 0;">
      <strong>When:</strong> ${dateStr}<br/>
      <strong>Doors:</strong> ${p.doorsTime} · <strong>Screening:</strong> ${p.screeningTime}
    </p>
    <p style="margin:0 0 8px 0;">
      <strong>Tickets:</strong> #${p.ticketNumbers.join(', ')}<br/>
      <strong>Name${p.quantity === 2 ? 's' : ''}:</strong> ${namesLine}
    </p>
    <p style="margin:16px 0 0 0; color:#444;">One night. One screen. Fifty tickets. The last Thursday of every month. Cult. Classic. Contemporary. Always uncommonly good.</p>
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

    const html = buildHtml(payload);
    const subject = `Your Cinema Ticket${payload.ticketNumbers.length > 1 ? 's' : ''}: #${payload.ticketNumbers.join(', ')}`;

    const res = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
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
