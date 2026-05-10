import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { enquiryData, conversationHistory, additionalComments } = await req.json();
    console.log('Received enquiryData:', JSON.stringify(enquiryData, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const contactName = enquiryData.contactName || enquiryData.name;
    const contactEmail = enquiryData.contactEmail || enquiryData.email;
    const contactPhone = enquiryData.contactPhone || enquiryData.phone || null;

    if (!contactName || !contactEmail) {
      throw new Error('Missing required fields: name and email are required');
    }

    // Try to parse event date to ISO
    let eventDateIso: string | null = null;
    if (enquiryData.eventDate) {
      const raw = String(enquiryData.eventDate).trim();
      // Handle dd/mm/yyyy
      const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      const candidate = dmy ? new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`) : new Date(raw);
      if (!isNaN(candidate.getTime())) eventDateIso = candidate.toISOString().split('T')[0];
    }

    // Parse budget
    const parseBudget = (input?: string): number | null => {
      if (!input) return null;
      const n = String(input).toLowerCase().replace(/[£,\s]/g, '').replace(/k/g, '000').match(/\d+/);
      return n ? parseInt(n[0], 10) : null;
    };

    const enquiryDetails = {
      original_event_date_text: enquiryData.eventDate || null,
      event_time: enquiryData.eventTime || null,
      vibe: enquiryData.vibe || null,
      fb_style: enquiryData.fbStyle || null,
      fb_preferences: enquiryData.fbPreferences || null,
      budget_original: enquiryData.budget || null,
      property_preference: enquiryData.propertyPreference || null,
      ai_reasoning: enquiryData.aiReasoning || null,
      match_score: enquiryData.matchScore || null,
      key_features: enquiryData.keyFeatures || [],
      alternatives: enquiryData.alternatives || [],
      recommended_space_id: enquiryData.recommendedSpaceId || null,
      recommended_space_name: enquiryData.recommendedSpace?.name || null,
      additional_comments: additionalComments || null,
      conversation_summary: conversationHistory?.slice(-10) || [],
    };

    // 1. Insert into cb_enquiries (the actual enquiries table)
    const { data: enquiryRecord, error: enquiryError } = await supabase
      .from('cb_enquiries')
      .insert({
        full_name: contactName,
        email: contactEmail,
        phone: contactPhone,
        category: 'event',
        property: enquiryData.propertyPreference ? String(enquiryData.propertyPreference).toLowerCase() : null,
        message: additionalComments || enquiryData.aiReasoning || null,
        details: enquiryDetails,
        status: 'new',
      })
      .select()
      .single();

    if (enquiryError) {
      console.error('cb_enquiries insert error:', enquiryError);
      throw new Error(enquiryError.message || 'Failed to create enquiry');
    }

    // 2. Create lead in CRM using the canonical lead creation function
    const leadDescription = `
AI Event Enquiry - ${enquiryData.eventType || 'Event'}

Guests: ${enquiryData.guestCount || 'TBD'}
Date: ${enquiryData.eventDate || 'Flexible'}
Vibe: ${enquiryData.vibe || 'TBD'}
F&B style: ${enquiryData.fbStyle || 'TBD'}
F&B preferences: ${enquiryData.fbPreferences || 'None'}
Budget: ${enquiryData.budget || 'Not specified'}
Property: ${enquiryData.propertyPreference || 'No preference'}

Suggested space: ${enquiryData.recommendedSpace?.name || 'TBD'}
AI reasoning: ${enquiryData.aiReasoning || 'TBD'}

${additionalComments ? `Additional comments:\n${additionalComments}` : ''}
    `.trim();

    const { data: leadId, error: leadError } = await supabase.rpc('create_lead', {
      payload: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        event_type: enquiryData.eventType || null,
        preferred_space: enquiryData.recommendedSpaceId || null,
        preferred_date: eventDateIso,
        date_flexible: !eventDateIso,
        headcount: enquiryData.guestCount || null,
        budget_low: parseBudget(enquiryData.budget),
        budget_high: parseBudget(enquiryData.budget),
        message: leadDescription,
        source: 'ask_the_bear',
        details: enquiryDetails,
        event_enquiry_id: enquiryRecord.id,
        privacy_accepted: true,
        consent_marketing: false,
      },
      client_ip: req.headers.get('x-forwarded-for') || 'event-enquiry-chat',
    });

    if (leadError) {
      console.error('leads insert error:', leadError);
      // Don't fail — the cb_enquiries record is the source of truth
    }

    // 2b. Create a provisional all-day booking on the calendar (best-effort)
    let bookingId: string | null = null;
    if (leadId && eventDateIso && enquiryData.recommendedSpaceId) {
      try {
        const startTs = `${eventDateIso}T00:00:00Z`;
        const endTs = `${eventDateIso}T23:59:59Z`;
        const title = `[PROVISIONAL] ${contactName} — ${enquiryData.eventType || 'Event'}`;
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            space_id: enquiryData.recommendedSpaceId,
            lead_id: leadId,
            title,
            start_ts: startTs,
            end_ts: endTs,
            status: 'provisional',
            name: contactName,
            email: contactEmail,
            phone: contactPhone,
            date: eventDateIso,
            guests: enquiryData.guestCount || null,
            notes: leadDescription,
          })
          .select('id')
          .single();
        if (bookingError) {
          console.error('bookings insert error (non-fatal):', bookingError);
        } else {
          bookingId = booking?.id || null;
        }
      } catch (e) {
        console.error('Provisional booking failed (non-fatal):', e);
      }
    }

    // 3. Send confirmation emails (don't fail if this errors)
    try {
      const emailResponse = await supabase.functions.invoke('send-enquiry-confirmation', {
        body: { enquiryData: { ...enquiryData, additionalComments } },
      });
      if (emailResponse.error) {
        console.error('Failed to send confirmation emails:', emailResponse.error);
      } else {
        console.log('Confirmation emails sent:', emailResponse.data);
      }
    } catch (emailError) {
      console.error('Error invoking email function:', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      enquiryId: enquiryRecord.id,
      leadId: leadId || null,
      bookingId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Convert enquiry to lead error:', error);
    const err: any = error;
    return new Response(JSON.stringify({
      error: err?.message || 'Failed to submit enquiry',
      details: err?.details || err?.hint || err?.code || null,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
