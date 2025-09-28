import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  eventId: string;
  managementToken: string;
  pdfUrl: string;
  fileName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, managementToken, pdfUrl, fileName }: SendEmailRequest = await req.json();

    if (!eventId || !managementToken || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify management token and get event details
    const { data: eventData, error: eventError } = await supabase
      .from('management_events')
      .select('*')
      .eq('id', eventId)
      .eq('management_token', managementToken)
      .single();

    if (eventError || !eventData) {
      return new Response(
        JSON.stringify({ error: 'Invalid event or management token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!eventData.contact_email) {
      return new Response(
        JSON.stringify({ error: 'No contact email found for this event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download PDF to attach
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Croft Common <hello@thehive-hospitality.com>",
      to: [eventData.contact_email],
      subject: `Event Proposal - ${eventData.code || eventData.id}`,
      html: `
        <h2>Event Proposal</h2>
        <p>Dear ${eventData.contact_name || 'Valued Client'},</p>
        
        <p>Please find attached your event proposal for <strong>${eventData.event_type || 'your event'}</strong> on <strong>${new Date(eventData.date).toLocaleDateString('en-GB')}</strong>.</p>
        
        <p><strong>Proposal Details:</strong></p>
        <ul>
          <li>Reference: ${eventData.code || eventData.id}</li>
          <li>Date: ${new Date(eventData.date).toLocaleDateString('en-GB')}</li>
          <li>Headcount: ${eventData.headcount || 'TBC'} guests</li>
          <li>Budget Range: £${eventData.budget_low || 0} - £${eventData.budget_high || 0}</li>
        </ul>
        
        <p>If you have any questions or would like to discuss this proposal further, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        The Croft Common Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          Croft Common<br>
          Email: hello@thehive-hospitality.com<br>
          Website: www.croftcommontest.com
        </p>
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        sentTo: eventData.contact_email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in send-proposal-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);