import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_NAME = "Crazy Bear · Bears Den";
const SENDER_DOMAIN = "notify.crazybear.dev";
const FROM_DOMAIN = "notify.crazybear.dev";
const FROM_ADDRESS = `Bears Den Cinema <cinema@${FROM_DOMAIN}>`;

type EmailPayload = {
  toEmail: string;
  primaryName: string;
  guestName?: string;
  quantity: number;
  ticketNumbers: number[];
  screeningDate: string;
  doorsTime: string;
  screeningTime: string;
  title?: string | null;
  walletToken?: string | null;
  forceResend?: boolean;
  bookingId?: string | null;
  releaseId?: string | null;
  resendReason?: string | null;
};

const fmtDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
};

const buildHtml = (p: EmailPayload) => {
  const title = (p.title || "Secret Cinema").toUpperCase();
  const dateStr = fmtDate(p.screeningDate);
  const namesLine =
    p.quantity === 2 && p.guestName
      ? `${p.primaryName} + ${p.guestName}`
      : p.primaryName;

  const walletUrl = p.walletToken
    ? `https://szokkwlleqndyiojhsll.supabase.co/functions/v1/create-cinema-wallet-pass?token=${encodeURIComponent(p.walletToken)}`
    : null;

  const ticketRow = (p.ticketNumbers || [])
    .map(
      (n) => `
      <td style="padding:0 8px 0 0;">
        <div style="display:inline-block; border:2px solid #000; padding:14px 18px; min-width:80px; text-align:center; background:#fff;">
          <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.18em; color:#000; margin-bottom:4px;">TICKET</div>
          <div style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:28px; line-height:1; color:#000;">#${n}</div>
        </div>
      </td>
    `,
    )
    .join("");

  const walletButton = walletUrl
    ? `
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
  `
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Secret Cinema ticket</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:'Space Grotesk',Helvetica,Arial,sans-serif; color:#000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:24px 12px;">
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
                    <td style="padding:4px 0;"><strong style="font-family:'Archivo Black',Arial Black,Helvetica,sans-serif; font-size:11px; letter-spacing:0.2em;">NAME${p.quantity === 2 ? "S" : ""}</strong></td>
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

const buildText = (p: EmailPayload) => {
  const title = (p.title || "Secret Cinema").toUpperCase();
  const dateStr = fmtDate(p.screeningDate);
  const namesLine =
    p.quantity === 2 && p.guestName
      ? `${p.primaryName} + ${p.guestName}`
      : p.primaryName;
  const tickets = (p.ticketNumbers || []).map((n) => `#${n}`).join(", ");
  const walletUrl = p.walletToken
    ? `https://szokkwlleqndyiojhsll.supabase.co/functions/v1/create-cinema-wallet-pass?token=${encodeURIComponent(p.walletToken)}`
    : null;
  return [
    `CRAZY BEAR · BEARS DEN — SECRET CINEMA`,
    ``,
    `You're in.`,
    title,
    ``,
    `Date: ${dateStr}`,
    `Doors: ${p.doorsTime}`,
    `Screening: ${p.screeningTime}`,
    `Name${p.quantity === 2 ? "s" : ""}: ${namesLine}`,
    `Ticket${p.ticketNumbers.length > 1 ? "s" : ""}: ${tickets}`,
    walletUrl ? `\nAdd to Apple Wallet: ${walletUrl}` : ``,
    ``,
    `One night. One screen. Fifty tickets.`,
    `Last Thursday of the month. Always uncommonly good.`,
  ].join("\n");
};

Deno.serve(async (req) => {
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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tickets = (payload.ticketNumbers || []).join(",");
    // Prefer the booking ID as the stable identity. Falls back to the
    // legacy email+date+tickets key only for very old callers.
    const baseKey = payload.bookingId
      ? `cinema-ticket-booking-${payload.bookingId}`
      : `cinema-ticket-${payload.toEmail}-${payload.screeningDate}-${tickets}`;
    const idempotencyKey = payload.forceResend
      ? `${baseKey}-resend-${Date.now()}`
      : baseKey;

    // Skip duplicates only on automatic sends; manual resends always go through
    if (!payload.forceResend) {
      const { data: latest } = await admin
        .from("email_send_log")
        .select("status")
        .eq("message_id", idempotencyKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.status === "sent") {
        return new Response(
          JSON.stringify({ ok: true, skipped: "already_sent" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    // Unsubscribe token (one per email)
    const { data: existingToken } = await admin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", payload.toEmail)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const unsubscribeToken = existingToken?.token ?? crypto.randomUUID();
    if (!existingToken?.token) {
      await admin.from("email_unsubscribe_tokens").insert({
        email: payload.toEmail,
        token: unsubscribeToken,
      });
    }

    const html = buildHtml(payload);
    const text = buildText(payload);
    const subject = `Secret Cinema · ${(payload.title || "Tonight").toUpperCase()} · Ticket${payload.ticketNumbers.length > 1 ? "s" : ""} #${payload.ticketNumbers.join(", ")}`;

    const logMetadata = {
      sender_domain: SENDER_DOMAIN,
      from_address: FROM_ADDRESS,
      booking_id: payload.bookingId ?? null,
      release_id: payload.releaseId ?? null,
      ticket_numbers: payload.ticketNumbers,
      screening_date: payload.screeningDate,
      title: payload.title ?? null,
      manual_resend: payload.forceResend === true,
      resend_reason: payload.resendReason ?? null,
    };

    await admin.from("email_send_log").insert({
      message_id: idempotencyKey,
      template_name: "cinema_ticket",
      recipient_email: payload.toEmail,
      status: "pending",
      metadata: logMetadata,
    });

    const { error: enqueueError } = await admin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: idempotencyKey,
        idempotency_key: idempotencyKey,
        to: payload.toEmail,
        from: FROM_ADDRESS,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: "transactional",
        label: "cinema_ticket",
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      await admin.from("email_send_log").insert({
        message_id: `${idempotencyKey}-err`,
        template_name: "cinema_ticket",
        recipient_email: payload.toEmail,
        status: "failed",
        error_message: enqueueError.message,
        metadata: logMetadata,
      });
      return new Response(
        JSON.stringify({ error: "Failed to enqueue", details: enqueueError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, queued: true, message_id: idempotencyKey }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-cinema-ticket-email error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
