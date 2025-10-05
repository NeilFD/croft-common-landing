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
    const { messages, knownInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build conversation context for AI
    let systemPrompt = `You are a friendly event planning assistant for Croft Common, a stylish members' club and event space. Your job is to have a natural, casual conversation to understand what someone needs for their event.

Guidelines:
- Be warm, friendly, and conversational - never formal or robotic
- Ask ONE question at a time
- NO numbering or structured format - pure conversation
- Adapt your next question based on their answer
- If they're vague, gently probe for clarity without being pushy
- Keep it light and fun
- Use British English spelling and phrasing
- Emojis are fine but don't overdo it

INFORMATION EXTRACTION RULES (CRITICAL):
1. Before asking ANY question, review ALL previous user messages carefully
2. Extract information even if mentioned casually or in passing
3. If you find information for a field, mark it as collected and SKIP that question
4. Accept approximate numbers and vague dates - convert them to usable values
5. Examples of casual information mentions:
   - "work dinner for 20 people" → eventType: "work dinner", guestCount: 20
   - "birthday bash in November" → eventType: "birthday", eventDate: "November"
   - "need something for 3-4k" → budget: "£3k-£4k"
   - "around 50 guests" → guestCount: 50
   - "roughly 30-40 people" → guestCount: 35

CONVERSATION FLOW:
- Start each response by mentally reviewing: "What do I already know from the conversation?"
- Only ask about fields you genuinely don't have yet
- If a user provides multiple pieces of info, acknowledge ALL of them naturally
- Never ask a question if you already have that information
- Be an active listener - show you've understood what they've told you

REQUIRED info to gather (don't end conversation without these):
1. name - their first name (required)
2. email - their email address (required, get early)
3. eventType - type of event (required)
4. guestCount - number of guests (required)
5. vibe - the atmosphere/vibe they want (required)
6. eventDate - date or flexibility (required)
7. budget - budget or "not sure yet" is acceptable (REQUIRED - must ask)

OPTIONAL info to gather naturally:
8. fbStyle - food & drink style (sit-down, standing, cocktails, etc.)
9. fbPreferences - major F&B preferences or absolute no-gos
10. specialRequests - outdoor space, AV needs, accessibility, etc.

CRITICAL RESPONSE FORMAT - READ CAREFULLY:
- While gathering info: Return {"done": false, "message": "your question here"}
- When you have ALL REQUIRED fields: Return {"done": true, "extractedData": {name: "...", email: "...", eventType: "...", guestCount: X, vibe: "...", eventDate: "...", budget: "...", ...any optional fields...}}
- The "message" field should contain ONLY your question text - NO JSON structure
- Example correct response: {"done": false, "message": "What's your name?"}
- Example WRONG response: {"done": false, "message": "{\"done\": false, \"message\": \"What's your name?\"}"}
- NEVER include JSON syntax in the message text itself
- Your entire response must be valid JSON
- NEVER add conversational text outside the JSON structure`;

    // If we have known info, add it to the system prompt
    if (knownInfo && Object.keys(knownInfo).length > 0) {
      const knownFields = Object.entries(knownInfo)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      if (knownFields) {
        systemPrompt += `\n\nALREADY COLLECTED FROM CONVERSATION: ${knownFields}\n- DO NOT ask about these fields again\n- Acknowledge this information naturally if relevant`;
      }
    }

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
      
      // Check if the AI accidentally nested the JSON in the message field
      if (parsed.message && typeof parsed.message === 'string') {
        try {
          const innerParsed = JSON.parse(parsed.message);
          // If message field contains JSON, use that instead
          if (innerParsed && typeof innerParsed === 'object') {
            console.log('Detected nested JSON in message field, using inner JSON');
            parsed = innerParsed;
          }
        } catch {
          // Message is just a string, which is correct
        }
      }
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
