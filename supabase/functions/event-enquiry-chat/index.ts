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

CRITICAL JSON RESPONSE FORMAT:
- While gathering info: Return ONLY this JSON (no other text): {"done": false, "message": "your next question"}
- When you have enough info (at least name, email, event type, guest count, and vibe): Return ONLY this JSON (no other text): {"done": true, "extractedData": {...all collected info...}}
- NEVER mix conversational text with JSON
- NEVER add text before or after the JSON
- Your response must be PURE JSON ONLY`;

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
    let parsed;
    try {
      parsed = JSON.parse(aiMessage);
    } catch {
      // If parsing fails, try to extract JSON from mixed text
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Fallback to treating as regular message
          return new Response(JSON.stringify({ 
            done: false, 
            message: aiMessage 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // No JSON found, treat as regular message
        return new Response(JSON.stringify({ 
          done: false, 
          message: aiMessage 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    try {
      // If conversation is done, generate space proposal
      if (parsed.done && parsed.extractedData) {
        console.log('Conversation complete, generating space proposal...');
        
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        
        // Call generate-event-proposal function
        const proposalResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-event-proposal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enquiryData: parsed.extractedData
          })
        });

        if (proposalResponse.ok) {
          const proposalData = await proposalResponse.json();
          console.log('Proposal generated:', proposalData);
          
          // Add proposal details to extracted data
          parsed.extractedData.recommendedSpaceId = proposalData.proposal?.recommendedSpaceId;
          parsed.extractedData.recommendedSpace = proposalData.recommendedSpace;
          parsed.extractedData.aiReasoning = proposalData.proposal?.reasoning;
          parsed.extractedData.matchScore = proposalData.proposal?.matchScore;
          parsed.extractedData.keyFeatures = proposalData.proposal?.keyFeatures;
          parsed.extractedData.alternatives = proposalData.proposal?.alternatives;
        } else {
          console.error('Failed to generate proposal:', await proposalResponse.text());
        }
      }
      
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (innerError) {
      console.error('Error processing parsed JSON:', innerError);
      // Fallback to treating as regular message
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
