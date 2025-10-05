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
    const { enquiryData, conversationHistory, additionalComments } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create event enquiry record
    const { data: enquiryRecord, error: enquiryError } = await supabase
      .from('event_enquiries')
      .insert({
        contact_name: enquiryData.contactName,
        contact_email: enquiryData.contactEmail,
        contact_phone: enquiryData.contactPhone,
        event_type: enquiryData.eventType,
        event_date: enquiryData.eventDate,
        event_time: enquiryData.eventTime,
        guest_count: enquiryData.guestCount,
        conversation_history: conversationHistory,
        key_requirements: enquiryData,
        recommended_space_id: enquiryData.recommendedSpaceId,
        ai_reasoning: enquiryData.aiReasoning,
        fb_style: enquiryData.fbStyle,
        fb_preferences: enquiryData.fbPreferences,
        budget_range: enquiryData.budget,
        additional_comments: additionalComments,
        status: 'new',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enquiryError) throw enquiryError;

    // 2. Create lead in CRM
    const leadDescription = `
AI Event Enquiry - ${enquiryData.eventType || 'Event'}

Guest Count: ${enquiryData.guestCount || 'TBD'}
Date: ${enquiryData.eventDate || 'Flexible'}
Vibe: ${enquiryData.vibe || 'TBD'}
F&B Style: ${enquiryData.fbStyle || 'TBD'}
Budget: ${enquiryData.budget || 'Not specified'}

AI Recommendation: ${enquiryData.aiReasoning || 'To be determined'}

${additionalComments ? `Additional Comments:\n${additionalComments}` : ''}
    `.trim();

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        title: `${enquiryData.eventType || 'Event'} - ${enquiryData.contactName}`,
        description: leadDescription,
        contact_name: enquiryData.contactName,
        email: enquiryData.contactEmail,
        phone: enquiryData.contactPhone,
        status: 'new',
        source: 'AI Enquiry',
        space_id: enquiryData.recommendedSpaceId,
        event_date: enquiryData.eventDate,
        guest_count: enquiryData.guestCount,
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // 3. Link enquiry to lead
    await supabase
      .from('event_enquiries')
      .update({ converted_to_lead_id: lead.id })
      .eq('id', enquiryRecord.id);

    // 4. Send notification email (optional - you can add edge function call here)
    console.log('New AI enquiry created:', {
      enquiryId: enquiryRecord.id,
      leadId: lead.id,
      contactName: enquiryData.contactName,
    });

    return new Response(JSON.stringify({ 
      success: true,
      enquiryId: enquiryRecord.id,
      leadId: lead.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Convert enquiry to lead error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
