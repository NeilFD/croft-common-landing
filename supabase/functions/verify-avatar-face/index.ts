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
Decide if the image is acceptable as a member's profile photo.

ACCEPT only if ALL of the following are true:
- A single human face is clearly visible
- The face is roughly front-facing (looking towards the camera, not in profile / not turned away)
- The face is well-lit and in focus
- The face fills a reasonable portion of the frame (not a tiny figure in the distance)
- It is a real photograph of a real person (not a cartoon, illustration, logo, animal, object, meme, screenshot, or AI-generated avatar)
- No heavy obscuring (sunglasses covering eyes, mask covering face, hands covering face, etc.)

REJECT for any of: no face, multiple people, side profile, looking away, blurry, too dark, sunglasses or mask hiding face, animal, object, cartoon, illustration, group shot, image of a screen, or anything that is not clearly the member's own face.

Respond with ONLY a compact JSON object, no prose, no markdown fences:
{"valid": true|false, "reason": "<short reason, max 18 words, suitable to show the user>"}`;

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
