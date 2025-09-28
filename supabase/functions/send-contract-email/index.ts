import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendContractEmailRequest {
  eventId: string;
  pdfUrl: string;
  fileName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, pdfUrl, fileName }: SendContractEmailRequest = await req.json();

    if (!eventId || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending contract email for event:', eventId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('Event fetch error:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!eventData.client_email) {
      return new Response(
        JSON.stringify({ error: 'No client email found for this event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contract data for reference
    const { data: contractData } = await supabase
      .from('contracts')
      .select('*')
      .eq('event_id', eventId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Download PDF to attach
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Croft Common <hello@thehive-hospitality.com>",
      to: [eventData.client_email],
      subject: `Event Contract - ${eventData.code || eventData.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">CROFT COMMON</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Event Services Contract</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Event Contract Ready for Signature</h2>
            <p>Dear ${eventData.client_name || 'Valued Client'},</p>
            
            <p>Your event contract is now ready for review and signature. Please find the complete contract document attached to this email.</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #1a1a1a; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1a1a1a;">Contract Details:</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                <li><strong>Reference:</strong> ${eventData.code || eventData.id}</li>
                <li><strong>Event Type:</strong> ${eventData.event_type || 'Private Event'}</li>
                <li><strong>Date:</strong> ${eventData.primary_date ? new Date(eventData.primary_date).toLocaleDateString('en-GB') : 'TBC'}</li>
                <li><strong>Headcount:</strong> ${eventData.headcount || 'TBC'} guests</li>
                ${contractData ? `<li><strong>Contract Version:</strong> ${contractData.version}</li>` : ''}
              </ul>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Important Information</h4>
              <p style="margin: 0; color: #856404; font-size: 14px;">
                Please review all terms and conditions carefully before signing. This contract becomes legally binding upon signature by both parties.
              </p>
            </div>
            
            <h3 style="color: #1a1a1a;">Next Steps:</h3>
            <ol style="line-height: 1.6; color: #666;">
              <li>Review the attached contract document thoroughly</li>
              <li>Contact us with any questions or clarifications needed</li>
              <li>Return the signed contract to secure your booking</li>
              <li>Arrange payment as per the terms outlined in the contract</li>
            </ol>
            
            <p>If you have any questions about this contract or would like to discuss any terms, please don't hesitate to contact our events team. We're here to ensure your event is perfectly planned and executed.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>The Croft Common Events Team</strong></p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              <strong>Croft Common</strong><br>
              Unit 1-3, Croft Court, 48 Croft Street, London SE8 4EX<br>
              Email: hello@thehive-hospitality.com | Web: www.croftcommontest.com<br>
              Phone: 020 7946 0958
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: Array.from(new Uint8Array(pdfBuffer)),
        },
      ],
    });

    if (emailResponse.error) {
      console.error('Email sending error:', emailResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Contract email sent successfully:", emailResponse);

    // Log audit entry
    try {
      await supabase.rpc('log_audit_entry', {
        p_entity_id: eventId,
        p_entity: 'contracts',
        p_action: 'contract_emailed',
        p_actor_id: null,
        p_diff: { 
          email_id: emailResponse.data?.id,
          sent_to: eventData.client_email,
          contract_id: contractData?.id 
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        sentTo: eventData.client_email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);