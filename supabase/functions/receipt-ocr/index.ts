import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REF_LOGO_URL = "https://www.crazybear.dev/brand/crazy-bear-mark.png";

// ---- Helpers ---------------------------------------------------------------

async function sha256OfUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image for hashing: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return encodeHex(new Uint8Array(digest));
}

type RejectCode =
  | "duplicate_image"
  | "no_bear_logo"
  | "screen_capture"
  | "missing_datetime"
  | "duplicate_receipt"
  | "rate_limit"
  | "extraction_failed";

function reject(code: RejectCode, message: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error: code, code, message, ...extra }), {
    status: 422,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logRejection(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  code: RejectCode,
  message: string,
  imageUrl: string | null,
  imageHash: string | null,
  flags: Record<string, unknown> | null,
) {
  try {
    await supabase.from("receipt_rejections").insert({
      user_id: userId,
      image_url: imageUrl,
      image_sha256: imageHash,
      reason_code: code,
      reason_message: message,
      ai_flags: flags,
    });
  } catch (e) {
    console.error("Failed to log rejection", e);
  }
}

// ---- Vision call -----------------------------------------------------------

interface VisionResult {
  bear_logo_detected: boolean;
  bear_logo_confidence: number;
  screen_capture_score: number;
  date: string | null;
  receipt_time: string | null;
  total: number;
  currency: string;
  venue_location: string | null;
  receipt_number: string | null;
  covers: number | null;
  items: Array<{ name: string; quantity: number; price: number }>;
}

async function runVision(imageUrl: string, openAIKey: string): Promise<VisionResult> {
  const systemPrompt = `You are a strict receipt verification system for The Crazy Bear hotels and pubs.

You are shown TWO images:
  1. The official Crazy Bear bear-head logo (reference).
  2. A receipt the member uploaded.

Return ONE JSON object only, no markdown, with this exact shape:
{
  "bear_logo_detected": boolean,
  "bear_logo_confidence": number,        // 0..1, how sure you are the reference bear mark appears printed on the receipt
  "screen_capture_score": number,        // 0..1, 0 = real paper receipt, 1 = clearly a photo of a phone/computer screen (look for moir\u00e9, pixel grid, screen glare, browser/app chrome, PDF/digital artefacts)
  "date": "YYYY-MM-DD" | null,
  "receipt_time": "HH:MM:SS" | null,
  "total": number,
  "currency": "GBP",
  "venue_location": string | null,
  "receipt_number": string | null,
  "covers": number | null,
  "items": [{"name": string, "quantity": number, "price": number}]
}

Rules:
- Only set bear_logo_detected true if you can clearly see the Crazy Bear bear-head mark from the reference image actually printed on the receipt. The text "Crazy Bear" alone is NOT enough.
- If the receipt is blurry, cropped, or the logo is not visible, set bear_logo_detected false and confidence below 0.5.
- screen_capture_score must reflect whether the upload is a photograph of a screen rather than a real paper receipt.
- Currency defaults to GBP.
- If a field is genuinely not on the receipt, return null (or 0 for total).`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Reference: the official Crazy Bear logo." },
            { type: "image_url", image_url: { url: REF_LOGO_URL } },
            { type: "text", text: "Receipt to verify and extract:" },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("Vision API error", res.status, t);
    throw new Error("vision_failed");
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: VisionResult;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    throw new Error("vision_parse_failed");
  }
  // Defensive defaults
  parsed.bear_logo_detected = !!parsed.bear_logo_detected;
  parsed.bear_logo_confidence = Number(parsed.bear_logo_confidence) || 0;
  parsed.screen_capture_score = Number(parsed.screen_capture_score) || 0;
  parsed.items = Array.isArray(parsed.items) ? parsed.items : [];
  parsed.currency = parsed.currency || "GBP";
  parsed.total = Number(parsed.total) || 0;
  return parsed;
}

// ---- Main ------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAIKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { image_url, action } = body;
    if (!image_url || typeof image_url !== "string") {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Single combined action: verify + save ------------------------------
    // Both 'extract' (returns extracted_data + would-save preview) and 'save'
    // share the same strict pipeline. 'extract' stops before insert; 'save'
    // commits.
    const willCommit = action === "save";

    // [G] Rate limit: max 5 receipts in last 24h, 30s cooldown
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since30s = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("member_receipts")
      .select("id, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since24h)
      .order("created_at", { ascending: false });
    if (willCommit && recent) {
      if (recent.length >= 5) {
        await logRejection(supabase, user.id, "rate_limit", "Daily upload limit reached", image_url, null, null);
        return reject("rate_limit", "You've hit today's upload limit. Try again tomorrow.");
      }
      if (recent[0] && recent[0].created_at > since30s) {
        return reject("rate_limit", "Slow down — wait a few seconds between uploads.");
      }
    }

    // [A] sha256 dedupe
    let imageHash: string | null = null;
    try {
      imageHash = await sha256OfUrl(image_url);
    } catch (e) {
      console.warn("Hashing failed, continuing without:", e);
    }
    if (imageHash) {
      const { data: dup } = await supabase
        .from("member_receipts")
        .select("id, user_id")
        .eq("image_sha256", imageHash)
        .limit(1)
        .maybeSingle();
      if (dup) {
        await logRejection(supabase, user.id, "duplicate_image", "Same image already uploaded", image_url, imageHash, null);
        return reject("duplicate_image", "This exact image has already been uploaded.");
      }
    }

    // [B] Vision pass
    let v: VisionResult;
    try {
      v = await runVision(image_url, openAIKey);
    } catch (_e) {
      return reject("extraction_failed", "Couldn't read this receipt. Try a clearer photo.");
    }

    const flags = {
      bear_logo_detected: v.bear_logo_detected,
      bear_logo_confidence: v.bear_logo_confidence,
      screen_capture_score: v.screen_capture_score,
    };

    // [C] Bear logo gate
    if (!v.bear_logo_detected || v.bear_logo_confidence < 0.75) {
      await logRejection(supabase, user.id, "no_bear_logo", "Crazy Bear logo not detected", image_url, imageHash, flags);
      return reject(
        "no_bear_logo",
        "We couldn't find the Crazy Bear logo on this receipt. Only receipts printed by a Crazy Bear venue count.",
        { flags },
      );
    }

    // [D] Screen capture gate
    if (v.screen_capture_score > 0.6) {
      await logRejection(supabase, user.id, "screen_capture", "Photo of a screen detected", image_url, imageHash, flags);
      return reject(
        "screen_capture",
        "This looks like a photo of a screen. Please upload a photo of the original paper receipt.",
        { flags },
      );
    }

    // [E] Date + time required, not in future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (!v.date || !v.receipt_time) {
      await logRejection(supabase, user.id, "missing_datetime", "Date or time missing", image_url, imageHash, flags);
      return reject("missing_datetime", "Receipt must clearly show the date and the time.");
    }
    const receiptDate = new Date(v.date);
    if (isNaN(receiptDate.getTime()) || receiptDate > today) {
      await logRejection(supabase, user.id, "missing_datetime", "Future or invalid date", image_url, imageHash, flags);
      return reject("missing_datetime", "Receipt date must be today or earlier.");
    }

    // [F] receipt_number + date + time dedupe
    if (v.receipt_number) {
      const { data: dup } = await supabase
        .from("member_receipts")
        .select("id")
        .eq("receipt_number", v.receipt_number)
        .eq("receipt_date", v.date)
        .eq("receipt_time", v.receipt_time)
        .limit(1)
        .maybeSingle();
      if (dup) {
        await logRejection(supabase, user.id, "duplicate_receipt", "Receipt already used", image_url, imageHash, flags);
        return reject("duplicate_receipt", "This receipt has already been claimed.");
      }
    }

    const extracted = {
      date: v.date,
      receipt_time: v.receipt_time,
      total: v.total,
      currency: v.currency,
      venue_location: v.venue_location,
      receipt_number: v.receipt_number,
      covers: v.covers,
      items: v.items,
    };

    // ---- Extract-only: return preview, do not save -------------------------
    if (!willCommit) {
      return new Response(
        JSON.stringify({
          extracted_data: extracted,
          checks: flags,
          image_sha256: imageHash,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Save --------------------------------------------------------------
    const { data: newReceipt, error: insertError } = await supabase
      .from("member_receipts")
      .insert({
        user_id: user.id,
        image_url,
        receipt_date: v.date,
        receipt_time: v.receipt_time,
        receipt_number: v.receipt_number,
        venue_location: v.venue_location,
        merchant_name: v.venue_location,
        covers: v.covers,
        total_amount: v.total,
        currency: v.currency,
        items: v.items,
        raw_ocr_data: v as unknown as Record<string, unknown>,
        processing_status: "completed",
        image_sha256: imageHash,
        bear_logo_detected: v.bear_logo_detected,
        bear_logo_confidence: v.bear_logo_confidence,
        screen_capture_score: v.screen_capture_score,
      })
      .select()
      .single();

    if (insertError) {
      // Race condition on a unique index = duplicate
      if ((insertError as { code?: string }).code === "23505") {
        await logRejection(supabase, user.id, "duplicate_receipt", "Unique violation on save", image_url, imageHash, flags);
        return reject("duplicate_receipt", "This receipt has already been claimed.");
      }
      console.error("Insert error", insertError);
      return new Response(JSON.stringify({ error: "Failed to save receipt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ledger row
    await supabase.from("member_ledger").insert({
      user_id: user.id,
      receipt_id: newReceipt.id,
      amount: v.total,
      currency: v.currency,
      transaction_type: "receipt",
      description: v.venue_location || "Receipt",
    });

    return new Response(
      JSON.stringify({ message: "Receipt saved", receipt: newReceipt, checks: flags }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("receipt-ocr error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
