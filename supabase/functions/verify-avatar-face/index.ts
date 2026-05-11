// Verifies that an uploaded avatar is a clear, face-on photo of a single person.
// Uses Lovable AI Gateway (google/gemini-2.5-flash) for vision analysis.

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
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing imageUrl' }), {
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

    const prompt = `You are reviewing a profile picture for a private members' club.
Be GENEROUS. The goal is only to filter out images that clearly are NOT a photo of the member.

ACCEPT if the image plausibly contains a real human person, in any of these situations:
- Any angle (front, side, three-quarter, looking away).
- Sunglasses, hats, scarves, masks, partial obscuring - all fine.
- Slightly blurry, dim, grainy, candid, or stylised photographs.
- Group shots where a person is clearly present.
- Selfies, full-body shots, distance shots, action shots.
- Black and white, filtered, or moody photography.

REJECT only if it is clearly NOT a photo of a person:
- No human at all (logo, object, blank wall, food, scenery, product shot).
- Animal, cartoon, illustration, meme, emoji, or obviously AI-generated avatar with no real person in it.
- Screenshot of an app, website, document, chart, or messaging thread.
- Pornographic or explicit content.
- So dark, broken or corrupted that nothing can be made out at all.

When in doubt, ACCEPT.

Respond with ONLY a compact JSON object, no prose, no markdown fences:
{"valid": true|false, "reason": "<short, gentle reason, max 18 words. For rejections say something like: Looks like that is not a photo of you - try one with you in it.>"}`;

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
              { type: 'image_url', image_url: { url: imageUrl } },
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
        return new Response(JSON.stringify({ error: 'Photo verification is temporarily unavailable.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed: { valid: boolean; reason: string } | null = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    if (!parsed || typeof parsed.valid !== 'boolean') {
      return new Response(JSON.stringify({
        valid: false,
        reason: 'Could not verify photo. Please try a clear face-on photo.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      valid: parsed.valid,
      reason: (parsed.reason || '').toString().slice(0, 240),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('verify-avatar-face error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
