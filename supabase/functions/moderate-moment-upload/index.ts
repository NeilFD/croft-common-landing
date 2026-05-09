// Pre-upload AI moderation for member moments.
// Uses Lovable AI Gateway (google/gemini-2.5-flash) for vision analysis.
// Returns { allowed, reason } - the client only commits the upload when allowed.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const imageUrl: string | undefined = body?.imageUrl;
    const imageBase64: string | undefined = body?.imageBase64;
    const mimeType: string = body?.mimeType || 'image/jpeg';

    if (!imageUrl && !imageBase64) {
      return new Response(JSON.stringify({ error: 'Provide imageUrl or imageBase64' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are reviewing a photo for the Crazy Bear members' Moments board.

ALLOW photos of:
- People enjoying food, drinks, social moments
- Venue interiors, exteriors, gardens, rooms
- Food and drink, plates, cocktails
- Group shots, selfies, candid moments
- Pets, scenery, decor

REJECT for any of:
- Nudity, partial nudity, sexual content
- Violence, weapons, gore, threatening gestures
- Visible drug use or paraphernalia
- Hate symbols, slurs, discriminatory imagery
- ID documents, passports, screens with personal data
- Spam, advertising, screenshots of memes
- Content that is clearly illegal

Respond with ONLY a compact JSON object, no prose, no markdown fences:
{"allowed": true|false, "reason": "<short reason, max 18 words, polite, suitable to show the user>"}`;

    const imagePart = imageBase64
      ? { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
      : { type: 'image_url', image_url: { url: imageUrl } };

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              imagePart,
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI gateway error', aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Too many checks right now. Try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'Photo check is temporarily unavailable.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Moderation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed: { allowed: boolean; reason: string } | null = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    if (!parsed || typeof parsed.allowed !== 'boolean') {
      // Fail-safe: block if we can't parse a clear answer
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'Could not check this photo. Try a different one.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      allowed: parsed.allowed,
      reason: (parsed.reason || '').toString().slice(0, 240),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('moderate-moment-upload error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
