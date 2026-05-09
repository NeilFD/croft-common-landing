import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { enquiryData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: properties } = await supabase
      .from('properties').select('id, slug, name, location, positioning, signature_feel').eq('is_active', true);

    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select(`id, name, slug, description, property_id,
        capacity_seated, capacity_standing, capacity_dining, min_guests, max_guests,
        layouts, indoor_outdoor, step_free, av_included, music_curfew,
        event_types, combinable_with, hire_notes, min_spend_notes, exclusivity_notes, tone_blurb`)
      .eq('is_active', true).order('display_order');

    if (spacesError) throw spacesError;
    if (!spaces || spaces.length === 0) {
      return new Response(JSON.stringify({ error: 'No spaces available', message: "No spaces set up yet." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: bedrooms } = await supabase.from('bedrooms').select('property_id, tier, count, max_occupancy');
    const { data: fbVenues } = await supabase.from('fb_venues').select('property_id, name, formats, tone_blurb');

    const propMap = new Map((properties || []).map((p: any) => [p.id, p]));

    const matchingPrompt = `You are the Bear — Crazy Bear's event planner. Pick the best space for this enquiry.

VOICE: 'Bears Den' — short, staccato, confident, minimal. British English. No emojis. Never gushy.

EVENT REQUIREMENTS:
- Type: ${enquiryData.eventType || 'Not specified'}
- Guests: ${enquiryData.guestCount || 'Not specified'}
- Vibe: ${enquiryData.vibe || 'Not specified'}
- F&B style: ${enquiryData.fbStyle || 'Not specified'}
- F&B preferences: ${enquiryData.fbPreferences || 'None'}
- Date: ${enquiryData.eventDate || 'Not specified'}
- Budget: ${enquiryData.budget || 'Not specified'}
- Property preference: ${enquiryData.propertyPreference || 'No preference'}
- Special requests: ${enquiryData.specialRequests || 'None'}

PROPERTIES:
${(properties || []).map((p: any) => `- ${p.name} (${p.location}) — ${p.signature_feel}`).join('\n')}

AVAILABLE SPACES:
${spaces.map((s: any, i: number) => {
  const p: any = propMap.get(s.property_id);
  return `${i + 1}. ${s.name} @ ${p?.name || 'Unknown'}
   ID: ${s.id}
   Capacity — seated: ${s.capacity_seated ?? '-'}, standing: ${s.capacity_standing ?? '-'}, dining: ${s.capacity_dining ?? '-'}
   Layouts: ${(s.layouts || []).join(', ') || '-'}
   Indoor/outdoor: ${s.indoor_outdoor || '-'} | Step-free: ${s.step_free ? 'yes' : 'no'} | AV: ${s.av_included ? 'included' : 'no'} | Music: ${s.music_curfew || '-'}
   Best for: ${(s.event_types || []).join(', ') || '-'}
   Combinable with (slugs): ${(s.combinable_with || []).join(', ') || 'none'}
   Min spend: ${s.min_spend_notes || '-'} | Exclusivity: ${s.exclusivity_notes || 'none'}
   Tone: ${s.tone_blurb || ''}
   Description: ${s.description || ''}`;
}).join('\n\n')}

BEDROOMS (per property): ${(bedrooms || []).map((b: any) => {
  const p: any = propMap.get(b.property_id);
  return `${p?.name}: ${b.count}x ${b.tier}`;
}).join(' | ')}

F&B VENUES: ${(fbVenues || []).map((f: any) => {
  const p: any = propMap.get(f.property_id);
  return `${p?.name} — ${f.name} (${(f.formats || []).join('/')})`;
}).join(' | ')}

GUIDELINES:
1. Guest count must fit capacity (use seated/standing/dining as appropriate to fbStyle).
2. Respect property preference if given.
3. Match vibe and event type to space tone and best-fit list.
4. If two spaces combined work better (use combinable_with), suggest the combo in alternatives.
5. Note minimum spend or exclusivity if relevant.

OUTPUT — STRICT JSON:
{
  "recommendedSpaceId": "uuid",
  "matchScore": 0-100,
  "reasoning": "2-3 sentences in Bears Den voice. Use the space NAME (never the ID). Reference one or two specifics — capacity, vibe, layout, outdoor, exclusivity. Confident, minimal.",
  "keyFeatures": ["short feature 1", "short feature 2", "short feature 3"],
  "alternatives": [
    { "spaceId": "uuid", "spaceName": "Name", "reasoning": "one short line in Bears Den voice" }
  ]
}

NEVER include UUIDs in reasoning. Names only.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: matchingPrompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let proposal;
    try {
      proposal = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      console.error('Parse error:', e);
      proposal = {
        recommendedSpaceId: spaces[0].id, matchScore: 70,
        reasoning: "We've got a space that should fit. Let's talk through the detail.",
        keyFeatures: ['Flexible layout', 'Good vibe'], alternatives: [],
      };
    }

    const recommendedSpace = spaces.find((s: any) => s.id === proposal.recommendedSpaceId) || spaces[0];

    return new Response(JSON.stringify({ proposal, recommendedSpace }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Generate proposal error:', error);
    return new Response(JSON.stringify({
      error: (error as Error).message,
      message: 'Trouble generating a proposal. Try again.',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
