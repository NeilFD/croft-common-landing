import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendlyWebhookPayload {
  created_at: string;
  created_by: string;
  event: string;
  payload: {
    event_type: {
      name: string;
      slug: string;
    };
    invitee: {
      email: string;
      name: string;
      created_at: string;
      updated_at: string;
      uri: string;
    };
    event: {
      start_time: string;
      end_time: string;
      location: {
        type: string;
        location?: string;
        join_url?: string;
      };
    };
    questions_and_answers: Array<{
      question: string;
      answer: string;
    }>;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData: CalendlyWebhookPayload = await req.json();
    console.log('Received Calendly webhook:', webhookData.event);

    // Only process invitee.created events (new bookings)
    if (webhookData.event !== 'invitee.created') {
      console.log('Ignoring non-booking event:', webhookData.event);
      return new Response('Event ignored', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const { invitee, event: meetingEvent } = webhookData.payload;
    const inviteeEmail = invitee.email;
    const inviteeName = invitee.name;
    const meetingStartTime = new Date(meetingEvent.start_time);

    console.log(`Processing booking for ${inviteeEmail} at ${meetingStartTime}`);

    // Update the secret_kitchen_access table to mark meeting as booked
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_meeting_status', {
        user_email: inviteeEmail,
        booking_status: true,
        booking_date: meetingStartTime.toISOString()
      });

    if (updateError) {
      console.error('Error updating meeting status:', updateError);
      throw updateError;
    }

    console.log('Meeting status updated successfully for:', inviteeEmail);

    // Send confirmation email to the applicant
    try {
      const meetingUrl = meetingEvent.location?.join_url || meetingEvent.location?.location || 'Details will be provided separately';
      
      await resend.emails.send({
        from: "Secret Kitchens <noreply@cityandsanctuary.com>",
        to: [inviteeEmail],
        subject: "Your Secret Kitchens Consultation is Confirmed!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E85A9B;">Thank you for booking your consultation!</h1>
            <p>Hi ${inviteeName},</p>
            <p>We're excited to confirm your consultation meeting for Secret Kitchens.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Meeting Details:</h3>
              <p><strong>Date & Time:</strong> ${meetingStartTime.toLocaleString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}</p>
              <p><strong>Location:</strong> ${meetingUrl}</p>
            </div>
            
            <p>We'll discuss your application and explore how Secret Kitchens can help grow your food business.</p>
            
            <p>If you need to reschedule or have any questions, please don't hesitate to reach out.</p>
            
            <p>Looking forward to speaking with you!</p>
            <p>The Secret Kitchens Team</p>
          </div>
        `,
      });

      console.log('Confirmation email sent to:', inviteeEmail);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Booking processed successfully' 
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error processing Calendly webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);