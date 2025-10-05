import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enquiryData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active spaces with detailed characteristics
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select(`
        id, name, slug, description,
        capacity_seated, capacity_standing, min_guests, max_guests,
        ambience, natural_light, outdoor_access,
        av_capabilities, layout_flexibility,
        catering_style, ideal_event_types,
        unique_features, accessibility_features,
        pricing_tier, combinable_with
      `)
      .eq('is_active', true)
      .order('display_order');

    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
      throw spacesError;
    }

    if (!spaces || spaces.length === 0) {
      return new Response(JSON.stringify({
        error: 'No spaces available',
        message: "We don't have any spaces set up yet"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build comprehensive AI prompt with all characteristics
    const matchingPrompt = `You are an expert event planner at Croft Common. Based on the following event requirements, recommend the BEST MATCHING space from our available options.

EVENT REQUIREMENTS:
- Event Type: ${enquiryData.eventType || 'Not specified'}
- Guest Count: ${enquiryData.guestCount || 'Not specified'}
- Vibe/Atmosphere: ${enquiryData.vibe || 'Not specified'}
- Food & Beverage Style: ${enquiryData.fbStyle || 'Not specified'}
- Budget: ${enquiryData.budget || 'Not specified'}
- Special Requests: ${enquiryData.specialRequests || 'None'}

AVAILABLE SPACES WITH DETAILED CHARACTERISTICS:
${spaces.map((space, idx) => `
${idx + 1}. ${space.name} (ID: ${space.id})
   CAPACITY:
   - Seated: ${space.capacity_seated}, Standing: ${space.capacity_standing}
   - Guest Range: ${space.min_guests || 'No min'} - ${space.max_guests || 'No max'}
   
   ATMOSPHERE:
   - Ambience: ${space.ambience || 'Not specified'}
   - Natural Light: ${space.natural_light || 'Not specified'}
   - Outdoor Access: ${space.outdoor_access ? 'Yes' : 'No'}
   
   TECHNICAL:
   - AV: ${space.av_capabilities?.join(', ') || 'None specified'}
   - Layout: ${space.layout_flexibility || 'Not specified'}
   
   CATERING & EVENTS:
   - Catering: ${space.catering_style?.join(', ') || 'Not specified'}
   - Ideal For: ${space.ideal_event_types?.join(', ') || 'Various'}
   
   FEATURES:
   - Unique: ${space.unique_features?.join(', ') || 'None listed'}
   - Accessibility: ${space.accessibility_features?.join(', ') || 'Standard'}
   
   PRICING & OPTIONS:
   - Tier: ${space.pricing_tier || 'Not specified'}
   - Combinable: ${space.combinable_with?.length ? space.combinable_with.join(', ') : 'None'}
   - Description: ${space.description || 'No description'}
`).join('\n')}

MATCHING GUIDELINES:
1. Guest count MUST fit capacity (consider min/max ranges)
2. Match ambience and atmosphere to vibe requirements
3. Align technical capabilities (AV, layout) with event needs
4. Match catering style to F&B preferences
5. Consider ideal event types alignment
6. Match pricing tier to budget if specified
7. Leverage unique features that enhance the event
8. Consider accessibility requirements
9. If combining spaces works better, suggest it

Your response MUST be valid JSON in this EXACT format:
{
  "recommendedSpaceId": "space-uuid-here",
  "matchScore": 85,
  "reasoning": "We think [Space Name] could work really well for what you're looking for! Here's our initial thinking: [2-3 friendly sentences referencing specific characteristics like ambience, AV capabilities, or unique features. Use language like 'could be perfect', 'seems like a great fit'. Keep it warm and collaborative.]",
  "keyFeatures": ["Specific feature 1 that matches", "Specific feature 2 that matches", "Specific feature 3 that matches"],
  "alternatives": [
    {
      "spaceId": "alternative-uuid-1",
      "spaceName": "Alternative Space Name",
      "reasoning": "This could also work if..."
    }
  ]
}

Remember: Reference specific characteristics in your reasoning (e.g., "The excellent natural light", "The AV capabilities include...", "The ambience is..."). This is a starting point for discussion!`;

    console.log('Calling Lovable AI for space matching...');

    // Call Lovable AI for intelligent matching
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: matchingPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let proposal;

    try {
      proposal = JSON.parse(aiData.choices[0].message.content);
      console.log('AI Proposal:', proposal);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to first space
      proposal = {
        recommendedSpaceId: spaces[0].id,
        matchScore: 70,
        reasoning: "We think this space could work well for your event! Let's chat through the details together to make sure it's exactly right for you.",
        keyFeatures: ["Flexible layout", "Great atmosphere"],
        alternatives: []
      };
    }

    // Get the recommended space details
    const recommendedSpace = spaces.find(s => s.id === proposal.recommendedSpaceId);

    return new Response(JSON.stringify({
      proposal,
      recommendedSpace
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate proposal error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      message: 'Sorry, we had trouble generating a proposal. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});