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

    // Build the insert object conditionally - only include event_date if it's valid ISO format
    console.log('Processing event date:', enquiryData.eventDate);
    
    const enquiryInsertData: any = {
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      event_type: enquiryData.eventType,
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
    };
    
    // Only include event_date if we can parse it to a valid ISO date
    // Otherwise, the date text will be available in key_requirements for the sales team
    if (enquiryData.eventDate) {
      try {
        // Try to create a valid Date object
        const testDate = new Date(enquiryData.eventDate);
        if (!isNaN(testDate.getTime())) {
          // Valid date - include it
          enquiryInsertData.event_date = testDate.toISOString().split('T')[0];
          console.log('Parsed date successfully:', enquiryInsertData.event_date);
        } else {
          console.log('Date is not parseable, omitting from insert');
        }
      } catch (e) {
        console.log('Date parsing failed, omitting from insert:', e);
      }
    }

    // 1. Create event enquiry record
    const { data: enquiryRecord, error: enquiryError } = await supabase
      .from('event_enquiries')
      .insert(enquiryInsertData)
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

    // Build leads insert data conditionally
    const leadsInsertData: any = {
      title: `${enquiryData.eventType || 'Event'} - ${contactName}`,
      description: leadDescription,
      contact_name: contactName,
      email: contactEmail,
      phone: contactPhone,
      status: 'new',
      source: 'AI Enquiry',
      space_id: enquiryData.recommendedSpaceId,
      guest_count: enquiryData.guestCount,
    };
    
    // Only add event_date if it was successfully parsed
    if (enquiryInsertData.event_date) {
      leadsInsertData.event_date = enquiryInsertData.event_date;
    }
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadsInsertData)
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
