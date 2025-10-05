import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build conversation context for AI
    const systemPrompt = `You are a friendly event planning assistant for Croft Common, a stylish members' club and event space. Your job is to have a natural, casual conversation to understand what someone needs for their event.

Guidelines:
- Be warm, friendly, and conversational - never formal or robotic
- Ask ONE question at a time
- NO numbering or structured format - pure conversation
- Adapt your next question based on their answer
- If they're vague, gently probe for clarity without being pushy
- Keep it light and fun
- Use British English spelling and phrasing
- Emojis are fine but don't overdo it

Key info to gather naturally (not as a checklist):
1. Name
2. Email address (get this early for contact)
3. Event type (birthday, corporate, wedding, etc.)
4. Date/flexibility
5. Guest count (rough number is fine)
6. Vibe/atmosphere they want
7. Food & drink style (sit-down, standing, cocktails, etc.)
8. Major F&B preferences or absolute no-gos (NOT allergies at this stage)
9. Budget (be soft - "Not sure yet" is totally fine)
10. Special requests (outdoor space, AV needs, accessibility, etc.)

When you have enough info (at least name, email, event type, guest count, and vibe), end with: "That's brilliant! Let me find the perfect space for you..." and respond with JSON: {"done": true, "extractedData": {...}}

Otherwise, respond with JSON: {"done": false, "message": "your next question"}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Try to parse as JSON to see if conversation is done
    try {
      const parsed = JSON.parse(aiMessage);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      // Not JSON, just a regular message
      return new Response(JSON.stringify({ 
        done: false, 
        message: aiMessage 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Event enquiry chat error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Sorry, I'm having trouble right now. Could you try again?" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
