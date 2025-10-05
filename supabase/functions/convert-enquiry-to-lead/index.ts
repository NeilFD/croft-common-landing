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
    
    console.log('Received enquiryData:', JSON.stringify(enquiryData, null, 2));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Map field names from AI output to database schema
    const contactName = enquiryData.contactName || enquiryData.name;
    const contactEmail = enquiryData.contactEmail || enquiryData.email;
    const contactPhone = enquiryData.contactPhone || enquiryData.phone || null;
    
    if (!contactName || !contactEmail) {
      throw new Error('Missing required fields: name and email are required');
    }

    // Parse date if it's in natural language format
    let parsedDate = null;
    if (enquiryData.eventDate) {
      // Try to parse natural language dates like "7th November" to ISO format
      try {
        // For now, just store as text in key_requirements and null in date field
        // The sales team can handle the natural language date
        console.log('Original date format:', enquiryData.eventDate);
      } catch (e) {
        console.log('Could not parse date, will store as text:', e);
      }
    }

    // 1. Create event enquiry record
    const { data: enquiryRecord, error: enquiryError } = await supabase
      .from('event_enquiries')
      .insert({
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        event_type: enquiryData.eventType,
        event_date: parsedDate, // Store null if we can't parse it
        event_time: enquiryData.eventTime,
        guest_count: enquiryData.guestCount,
        conversation_history: conversationHistory,
        key_requirements: enquiryData, // This will contain the original date text
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
        title: `${enquiryData.eventType || 'Event'} - ${contactName}`,
        description: leadDescription,
        contact_name: contactName,
        email: contactEmail,
        phone: contactPhone,
        status: 'new',
        source: 'AI Enquiry',
        space_id: enquiryData.recommendedSpaceId,
        event_date: parsedDate, // Store null if we can't parse it
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
      contactName: contactName,
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
