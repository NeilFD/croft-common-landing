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

    if (enquiryError) {
      console.error('event_enquiries insert error:', enquiryError);
      throw new Error(enquiryError.message || 'Failed to create event enquiry');
    }

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

    // Prepare name and budget for leads table schema
    const [firstName, ...lastParts] = contactName.split(' ');
    const lastName = lastParts.join(' ') || null;

    // Parse budget strings like "£3k-£4k", "3000/4000", "£2500"
    const parseBudgetRange = (input?: string): { low: number | null; high: number | null } => {
      if (!input) return { low: null, high: null };
      const normalised = String(input)
        .toLowerCase()
        .replace(/[,\s]/g, '') // remove commas and spaces
        .replace(/£/g, '')
        .replace(/gbp/g, '')
        .replace(/k/g, '000');

      // Split on common separators
      const parts = normalised.split(/-|–|—|to|\/|~/).map(p => p.trim()).filter(Boolean);
      const toNumber = (s: string) => {
        const m = s.match(/\d+/);
        return m ? parseInt(m[0], 10) : null;
      };

      if (parts.length >= 2) {
        const low = toNumber(parts[0]);
        const high = toNumber(parts[1]);
        return { low, high };
      }

      const single = toNumber(normalised);
      return { low: single, high: single };
    };

    const { low: budgetLow, high: budgetHigh } = parseBudgetRange(enquiryData.budget);

    // Build additional details JSONB for non-standard lead fields
    const enquiryDetails = {
      original_event_date_text: enquiryData.eventDate || null,
      vibe: enquiryData.vibe || null,
      fb_style: enquiryData.fbStyle || null,
      fb_preferences: enquiryData.fbPreferences || null,
      budget_original: enquiryData.budget || null,
      ai_reasoning: enquiryData.aiReasoning || null,
      match_score: enquiryData.matchScore || null,
      key_features: enquiryData.keyFeatures || [],
      alternatives: enquiryData.alternatives || [],
      recommended_space_name: enquiryData.recommendedSpace?.name || null,
      // Store a trimmed conversation history (last 5 messages to avoid bloat)
      conversation_summary: conversationHistory?.slice(-5) || [],
    };

    // Build leads insert data using actual schema
    const leadsInsertData: any = {
      first_name: firstName,
      last_name: lastName,
      email: contactEmail,
      phone: contactPhone,
      status: 'new',
      source: 'AI Enquiry',
      event_type: enquiryData.eventType || null,
      preferred_space: enquiryData.recommendedSpaceId || null,
      preferred_date: enquiryInsertData.event_date || null,
      headcount: enquiryData.guestCount || null,
      budget_low: budgetLow,
      budget_high: budgetHigh,
      message: leadDescription,
      event_enquiry_id: enquiryRecord.id,
      details: enquiryDetails,
    };
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadsInsertData)
      .select()
      .single();

    if (leadError) {
      console.error('leads insert error:', leadError, { leadsInsertData });
      throw new Error(leadError.message || 'Failed to create lead');
    }

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
    const err: any = error;
    const payload = {
      error: err?.message || 'Failed to submit enquiry',
      details: err?.details || err?.hint || err?.code || null,
    };
    return new Response(JSON.stringify(payload), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
