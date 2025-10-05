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

    // Fetch all active spaces with their characteristics
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
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

    // Build AI prompt to match space with requirements
    const matchingPrompt = `You are an expert event planner at Croft Common. Based on the following event requirements, recommend the BEST MATCHING space from our available options.

EVENT REQUIREMENTS:
- Event Type: ${enquiryData.eventType || 'Not specified'}
- Guest Count: ${enquiryData.guestCount || 'Not specified'}
- Vibe/Atmosphere: ${enquiryData.vibe || 'Not specified'}
- Food & Beverage Style: ${enquiryData.fbStyle || 'Not specified'}
- Budget: ${enquiryData.budget || 'Not specified'}
- Special Requests: ${enquiryData.specialRequests || 'None'}

AVAILABLE SPACES:
${spaces.map((space, idx) => `
${idx + 1}. ${space.name} (ID: ${space.id})
   - Seated capacity: ${space.capacity_seated}
   - Standing capacity: ${space.capacity_standing}
   - Description: ${space.description || 'No description'}
   ${space.combinable_with && space.combinable_with.length > 0 ? `- Can be combined with: ${space.combinable_with.join(', ')}` : ''}
`).join('\n')}

GUIDELINES FOR MATCHING:
1. Guest count MUST fit within capacity (seated or standing based on event type)
2. Consider the vibe/atmosphere alignment
3. Match F&B style capabilities
4. Budget tier should align if specified
5. If no single space fits guest count, suggest a combination if available

Your response MUST be valid JSON in this EXACT format:
{
  "recommendedSpaceId": "space-uuid-here",
  "matchScore": 85,
  "reasoning": "We think [Space Name] could work really well for what you're looking for! Here's our initial thinking: [2-3 friendly, conversational sentences explaining why this is a good starting point. Use language like 'could be perfect', 'seems like a great fit', 'our suggestion would be'. Keep it warm and collaborative, not definitive.]",
  "keyFeatures": ["Feature 1 that matches", "Feature 2 that matches", "Feature 3 that matches"],
  "alternatives": [
    {
      "spaceId": "alternative-uuid-1",
      "spaceName": "Alternative Space Name",
      "reasoning": "This could also work if..."
    }
  ]
}

Remember: Use warm, suggestive language like "we think", "could work well", "our initial suggestion". This is a starting point for discussion, not a final decision!`;

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