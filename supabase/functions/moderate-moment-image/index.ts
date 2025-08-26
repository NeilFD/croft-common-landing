import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationResult {
  approved: boolean;
  reason?: string;
  confidence: number;
  flags: string[];
}

const moderateImage = async (imageUrl: string): Promise<ModerationResult> => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI content moderator for a members' social photo board at Croft Common, a venue in Bristol. 

Your task is to analyze images and determine if they are appropriate for display. 

APPROVE images that show:
- People enjoying food, drinks, or social activities
- Venue interior/exterior shots
- Group photos and selfies
- Food and drink photos
- General social gatherings

REJECT images that contain:
- Nudity, partial nudity, or sexually explicit content
- Violence, weapons, or threatening gestures
- Illegal activities (drug use, underage drinking clearly visible)
- Hate symbols, offensive gestures, or discriminatory content
- Personal information (documents, screens with sensitive data)
- Poor quality images that are completely blurred or unrecognizable

NEEDS_REVIEW for:
- Borderline cases you're unsure about
- Images with alcohol where age verification might be needed
- Images with minor inappropriate elements that could be acceptable

Respond with JSON only: {"approved": boolean, "reason": "string", "confidence": number, "flags": ["flag1", "flag2"]}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image for content moderation:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const result = JSON.parse(data.choices[0].message.content);
    return {
      approved: result.approved,
      reason: result.reason,
      confidence: result.confidence,
      flags: result.flags || []
    };
  } catch (error) {
    console.error('Error in AI moderation:', error);
    // Default to needs review if AI fails
    return {
      approved: false,
      reason: 'AI moderation failed, needs manual review',
      confidence: 0,
      flags: ['ai_error']
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, momentId } = await req.json();

    if (!imageUrl || !momentId) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl or momentId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Moderating image for moment ${momentId}: ${imageUrl}`);

    // Perform AI moderation
    const moderationResult = await moderateImage(imageUrl);
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Determine moderation status based on result
    let status = 'approved';
    if (!moderationResult.approved) {
      status = moderationResult.confidence > 0.8 ? 'rejected' : 'needs_review';
    }

    // Update the moment with moderation results
    const { error: updateError } = await supabase
      .from('member_moments')
      .update({
        moderation_status: status,
        moderation_reason: moderationResult.reason,
        moderated_at: new Date().toISOString(),
        ai_confidence_score: moderationResult.confidence,
        ai_flags: moderationResult.flags
      })
      .eq('id', momentId);

    if (updateError) {
      console.error('Error updating moment:', updateError);
      throw updateError;
    }

    console.log(`Moment ${momentId} moderated with status: ${status}`);

    return new Response(
      JSON.stringify({
        status,
        ...moderationResult
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in moderate-moment-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});