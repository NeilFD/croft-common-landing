import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, knownInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are the Bear: an event planning assistant for Crazy Bear, two boutique hotel/event venues.

PROPERTIES:
- Crazy Bear Town (Beaconsfield) — townhouse glamour, almost in London. Glam. Glitz. Show off. 33 bedrooms (Cosy / Boujee / Decadent).
- Crazy Bear Country (Stadhampton, Oxfordshire) — the original. Britpop nostalgia, glam, experiential. Not a normal country pub. 33 bedrooms (Cosy / Boujee / Decadent).

SPACES (for context only — don't list them, just know them):
Town: The Studio (up to 16, dining/meetings/screenings). The Pool (up to 120 standing, exclusive hire, parties/DJs/cocktails).
Country: The Glasshouse (up to 250, weddings/big parties). The Conservatory (up to 50, dining/conferences/yoga). The Log Cabin (up to 14, dining/meetings). The Board Room (up to 8, dining/meetings). The Oak Room (up to 50, private dining). Terraces & Woodland Garden (flexible outdoor, marquees in summer).

OPERATIONAL RULES:
- Step-free access everywhere. AV included. Music until 1am by request.
- Pool requires exclusive hire and minimum spend.
- Minimum spend in play in all areas. Pricing bespoke.
- Lead time: 7 days minimum for any event over 20 guests.

VOICE — 'Bears Den':
- Short. Staccato. Confident. Minimal.
- British English. No emojis. Never gushy. Never over-explain.
- Sample lines: "You're here to party. We're in." / "We can do anything. Test us." / "Set us a challenge."

CONVERSATION RULES:
- One question at a time. Natural, not a form.
- Read every prior user message. Extract info even if mentioned in passing. Never re-ask what you already have.
- Convert vague answers to usable values (e.g. "around 50" → 50, "summer" → eventDate: "summer").

REQUIRED INFO (must collect before completing):
1. name (first name)
2. email
3. eventType
4. guestCount
5. vibe (atmosphere)
6. eventDate
7. budget (or "not sure yet" is fine)
8. fbStyle (sit-down, canapes, sharing, cocktails, etc.)
9. fbPreferences (dietary / preferences, "no specific requirements" is fine)
10. propertyPreference (Town / Country / no preference) — ask naturally if not stated

OPTIONAL: specialRequests (outdoor, AV, accessibility, bedrooms needed, etc.)

RESPONSE FORMAT — STRICT JSON ONLY:
- Gathering: {"done": false, "message": "your one short question"}
- Complete: {"done": true, "extractedData": {name, email, eventType, guestCount, vibe, eventDate, budget, fbStyle, fbPreferences, propertyPreference, ...optional}}
- The "message" field is plain conversational text. Never nest JSON inside it.
- No text outside the JSON.`;

    let prompt = systemPrompt;
    if (knownInfo && Object.keys(knownInfo).length > 0) {
      const known = Object.entries(knownInfo)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`).join(', ');
      if (known) prompt += `\n\nALREADY COLLECTED: ${known}\n- Do not re-ask. Acknowledge naturally if relevant.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: prompt }, ...messages],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiMessage);
      if (parsed.message && typeof parsed.message === 'string') {
        try {
          const inner = JSON.parse(parsed.message);
          if (inner && typeof inner === 'object') parsed = inner;
        } catch { /* ok */ }
      }
    } catch {
      const m = aiMessage.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); }
        catch { return new Response(JSON.stringify({ done: false, message: aiMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
      } else {
        return new Response(JSON.stringify({ done: false, message: aiMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (parsed.done && parsed.extractedData) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
      try {
        const proposalResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-event-proposal`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ enquiryData: parsed.extractedData }),
        });
        if (proposalResponse.ok) {
          const p = await proposalResponse.json();
          parsed.extractedData.recommendedSpaceId = p.proposal?.recommendedSpaceId;
          parsed.extractedData.recommendedSpace = p.recommendedSpace;
          parsed.extractedData.aiReasoning = p.proposal?.reasoning;
          parsed.extractedData.matchScore = p.proposal?.matchScore;
          parsed.extractedData.keyFeatures = p.proposal?.keyFeatures;
          parsed.extractedData.alternatives = p.proposal?.alternatives;
        } else {
          console.error('Proposal failed:', await proposalResponse.text());
        }
      } catch (e) {
        console.error('Proposal call error:', e);
      }
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Event enquiry chat error:', error);
    return new Response(JSON.stringify({
      error: (error as Error).message,
      message: "The Bear's having a moment. Try again in a sec.",
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
