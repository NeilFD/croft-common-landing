import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
  walletToken?: string | null;
};

const fmtDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return isoDate;
  }
};

const buildHtml = (p: EmailPayload) => {
  const title = (p.title || 'Secret Cinema').toUpperCase();
  const dateStr = fmtDate(p.screeningDate);
  const namesLine = p.quantity === 2 && p.guestName
    ? `${p.primaryName} + ${p.guestName}`
    : p.primaryName;

  const walletUrl = p.walletToken
    ? `https://szokkwlleqndyiojhsll.supabase.co/functions/v1/create-cinema-wallet-pass?token=${encodeURIComponent(p.walletToken)}`
    : null;

  const ticketRow = (p.ticketNumbers || [])
    .map((n) => `
      <td style="padding:0 8px 0 0;">
        <div style="display:inline-block; border:2px solid #000; padding:14px 18px; min-width:80px; text-align:center; background:#fff;">
          <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.18em; color:#000; margin-bottom:4px;">TICKET</div>
          <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:28px; line-height:1; color:#000;">#${n}</div>
        </div>
      </td>
    `).join('');

  const walletButton = walletUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
      <tr>
        <td>
          <a href="${walletUrl}"
             style="display:inline-block; background:#000; color:#fff; text-decoration:none; padding:14px 22px; font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:13px; letter-spacing:0.22em; border:2px solid #000;">
            ADD TO APPLE WALLET
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px 0; font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:12px; color:#555; letter-spacing:0.04em;">
      Open this email on your iPhone, then tap the button above.
    </p>
  ` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Secret Cinema ticket</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:'Space Grotesk',Helvetica,Arial,sans-serif; color:#000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border:2px solid #000;">
          <tr>
            <td style="background:#000; color:#fff; padding:18px 24px;">
              <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.32em; color:#fff;">
                CRAZY BEAR · BEARS DEN
              </div>
              <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:22px; letter-spacing:0.08em; color:#fff; margin-top:6px;">
                SECRET CINEMA
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px 8px 24px;">
              <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.28em; color:#000; margin-bottom:10px;">
                YOU'RE IN.
              </div>
              <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:32px; line-height:1.05; letter-spacing:0.02em; color:#000; margin:0 0 18px 0;">
                ${title}
              </div>
              <div style="border-top:2px solid #000; border-bottom:2px solid #000; padding:14px 0; margin:14px 0 22px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:14px; color:#000;">
                  <tr>
                    <td style="padding:4px 0;"><strong style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.2em;">DATE</strong></td>
                    <td style="padding:4px 0; text-align:right;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><strong style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.2em;">DOORS</strong></td>
                    <td style="padding:4px 0; text-align:right;">${p.doorsTime}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><strong style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.2em;">SCREENING</strong></td>
                    <td style="padding:4px 0; text-align:right;">${p.screeningTime}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><strong style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.2em;">NAME${p.quantity === 2 ? 'S' : ''}</strong></td>
                    <td style="padding:4px 0; text-align:right;">${namesLine}</td>
                  </tr>
                </table>
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">
                <tr>${ticketRow}</tr>
              </table>
              ${walletButton}
              <p style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:14px; line-height:1.5; color:#000; margin:18px 0 4px 0;">
                One night. One screen. Fifty tickets.
              </p>
              <p style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:14px; line-height:1.5; color:#000; margin:0 0 4px 0;">
                Last Thursday of the month. Cult. Classic. Contemporary.
              </p>
              <p style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:14px; line-height:1.5; color:#000; margin:0 0 24px 0;">
                Always uncommonly good.
              </p>
              <p style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:12px; color:#555; margin:0 0 4px 0;">
                Show this email or your wallet pass on arrival.
              </p>
              <p style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-size:12px; color:#555; margin:0;">
                Late entry not guaranteed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#000; color:#fff; padding:14px 24px; text-align:center;">
              <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:10px; letter-spacing:0.32em; color:#fff;">
                CRAZY BEAR · STADHAMPTON · BEACONSFIELD
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
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
    const subject = `Secret Cinema · ${(payload.title || 'Tonight').toUpperCase()} · Ticket${payload.ticketNumbers.length > 1 ? 's' : ''} #${payload.ticketNumbers.join(', ')}`;

    const res = await resend.emails.send({
      from: "Bears Den Cinema <cinema@notify.crazybear.dev>",
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
