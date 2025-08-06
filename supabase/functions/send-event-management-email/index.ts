import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventManagementEmailRequest {
  eventTitle: string;
  organizerEmail: string;
  managementToken: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  isNewEvent?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Function called with request body");
    
    const { 
      eventTitle, 
      organizerEmail, 
      managementToken, 
      eventDate, 
      eventTime, 
      eventLocation,
      isNewEvent = true 
    }: EventManagementEmailRequest = await req.json();

    console.log("Parsed request data:", { eventTitle, organizerEmail, managementToken, eventDate, eventTime, eventLocation, isNewEvent });

    const managementUrl = `https://410602d4-4805-4fdf-8c51-900e548d9b20.lovableproject.com/manage-event/${managementToken}`;
    
    const subject = isNewEvent 
      ? `Event Management Link: ${eventTitle}` 
      : `Updated Management Link: ${eventTitle}`;

    const emailResponse = await resend.emails.send({
      from: "Events <events@thehive-hospitality.com>", // Using your verified domain
      to: [organizerEmail],
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 24px;">${isNewEvent ? 'Event Created Successfully!' : 'Event Management Access'}</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">${eventTitle}</h2>
            <p style="margin: 8px 0; color: #666;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Time:</strong> ${eventTime}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Location:</strong> ${eventLocation}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="color: #333; margin-bottom: 16px;">
              ${isNewEvent 
                ? 'Your event has been created! Use the secure link below to manage your event:'
                : 'Use this secure link to manage your event:'
              }
            </p>
            
            <a href="${managementUrl}" 
               style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Manage Event
            </a>
          </div>

          <div style="background: #e3f2fd; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <h3 style="color: #1976d2; margin: 0 0 12px 0; font-size: 16px;">What you can do:</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px;">
              <li>Edit event details (title, description, time, location)</li>
              <li>Mark event as sold out</li>
              <li>Upload or change event images</li>
              <li>Delete the event if needed</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 16px; color: #666; font-size: 14px;">
            <p><strong>Important:</strong> Keep this management link secure. Anyone with this link can edit your event.</p>
            <p>If you lose this link, you can request a new one by contacting support with your event details.</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>This is an automated message. If you didn't create this event, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    console.log("Management email sent successfully:", emailResponse);

    // Log the response details
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Email sending failed", details: emailResponse.error }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: "Management email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-event-management-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);