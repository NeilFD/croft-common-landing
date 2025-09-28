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

  const maxRetries = 3;
  const timeoutMs = 30000; // 30 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI moderation attempt ${attempt}/${maxRetries} for image: ${imageUrl}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4.1-mini-2025-04-14',
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
          max_completion_tokens: 500
        }),
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`OpenAI API error (attempt ${attempt}):`, data);
        
        if (attempt === maxRetries) {
          throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      const result = JSON.parse(data.choices[0].message.content);
      console.log(`AI moderation completed successfully on attempt ${attempt}`);
      
      return {
        approved: result.approved,
        reason: result.reason,
        confidence: result.confidence,
        flags: result.flags || []
      };

    } catch (error) {
      console.error(`AI moderation error (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        // Final fallback - default to needs review
        console.error('All AI moderation attempts failed, defaulting to needs_review');
        return {
          approved: false,
          reason: 'AI moderation failed after multiple attempts, needs manual review',
          confidence: 0,
          flags: ['ai_error', 'needs_manual_review']
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    approved: false,
    reason: 'Unexpected error in moderation flow',
    confidence: 0,
    flags: ['system_error']
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse request body once and store for use throughout function
  let requestData: { imageUrl?: string; momentId?: string } = {};
  try {
    requestData = await req.json();
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const { imageUrl, momentId } = requestData;

  try {

    if (!imageUrl || !momentId) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl or momentId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting moderation for moment ${momentId}: ${imageUrl}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // First check if the image URL is accessible
    try {
      const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
      if (!imageCheck.ok) {
        console.error(`Image not accessible: ${imageCheck.status} ${imageCheck.statusText}`);
        throw new Error(`Image not accessible: ${imageCheck.status}`);
      }
    } catch (error) {
      console.error('Error checking image accessibility:', error);
      // Continue with moderation anyway, let OpenAI handle the error
    }

    // Perform AI moderation with robust error handling
    const moderationResult = await moderateImage(imageUrl);
    
    // Determine moderation status based on result
    let status = 'approved';
    if (!moderationResult.approved) {
      // High confidence rejections go straight to rejected
      // Lower confidence or errors go to needs_review for human oversight
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
      console.error('Error updating moment moderation status:', updateError);
      throw updateError;
    }

    console.log(`Moment ${momentId} moderated successfully with status: ${status} (confidence: ${moderationResult.confidence})`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        confidence: moderationResult.confidence,
        reason: moderationResult.reason,
        flags: moderationResult.flags
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Critical error in moderate-moment-image function:', error);
    
    // Attempt to mark the moment as needing review if we have the momentId
    try {
      if (momentId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );
        
        await supabase
          .from('member_moments')
          .update({
            moderation_status: 'needs_review',
            moderation_reason: `System error: ${error instanceof Error ? error.message : String(error)}`,
            moderated_at: new Date().toISOString(),
            ai_confidence_score: 0,
            ai_flags: ['system_error']
          })
          .eq('id', momentId);
          
        console.log(`Marked moment ${momentId} as needs_review due to system error`);
      }
    } catch (fallbackError) {
      console.error('Failed to mark moment as needs_review:', fallbackError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Moderation system error',
        details: error.message,
        status: 'needs_review'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});