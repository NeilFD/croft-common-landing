import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

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

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const getEmailContent = async (keys: string[]) => {
  const { data, error } = await supabase
    .from('cms_global_content')
    .select('content_key, content_value')
    .eq('content_type', 'email_template')
    .in('content_key', keys)
    .eq('published', true);

  if (error) {
    console.error('Error fetching email content:', error);
    return {};
  }

  return data.reduce((acc, item) => {
    acc[item.content_key] = item.content_value;
    return acc;
  }, {} as Record<string, string>);
};

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

    // Fetch email content from CMS
    const contentKeys = [
      'event_email_from_address',
      'event_email_subject_new',
      'event_email_subject_update',
      'event_email_header_new',
      'event_email_header_update',
      'event_email_intro_new',
      'event_email_intro_update',
      'event_email_cta_text',
      'event_email_features_title',
      'event_email_feature_1',
      'event_email_feature_2',
      'event_email_feature_3',
      'event_email_feature_4',
      'event_email_security_warning',
      'event_email_support_text',
      'event_email_disclaimer'
    ];

    const content = await getEmailContent(contentKeys);
    const getContent = (key: string, fallback: string) => content[key] || fallback;

    const managementUrl = `https://410602d4-4805-4fdf-8c51-900e548d9b20.lovableproject.com/manage-event/${managementToken}`;
    
    const subjectTemplate = isNewEvent 
      ? getContent('event_email_subject_new', 'Event Management Link: {eventTitle}')
      : getContent('event_email_subject_update', 'Updated Management Link: {eventTitle}');
    
    const subject = subjectTemplate.replace('{eventTitle}', eventTitle);

    const emailResponse = await resend.emails.send({
      from: getContent('event_email_from_address', 'Events <events@thehive-hospitality.com>'),
      to: [organizerEmail],
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 24px;">
            ${isNewEvent 
              ? getContent('event_email_header_new', 'Event Created Successfully!')
              : getContent('event_email_header_update', 'Event Management Access')
            }
          </h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">${eventTitle}</h2>
            <p style="margin: 8px 0; color: #666;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Time:</strong> ${eventTime}</p>
            <p style="margin: 8px 0; color: #666;"><strong>Location:</strong> ${eventLocation}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="color: #333; margin-bottom: 16px;">
              ${isNewEvent 
                ? getContent('event_email_intro_new', 'Your event has been created! Use the secure link below to manage your event:')
                : getContent('event_email_intro_update', 'Use this secure link to manage your event:')
              }
            </p>
            
            <a href="${managementUrl}" 
               style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              ${getContent('event_email_cta_text', 'Manage Event')}
            </a>
          </div>

          <div style="background: #e3f2fd; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <h3 style="color: #1976d2; margin: 0 0 12px 0; font-size: 16px;">${getContent('event_email_features_title', 'What you can do:')}</h3>
            <ul style="color: #333; margin: 0; padding-left: 20px;">
              <li>${getContent('event_email_feature_1', 'Edit event details (title, description, time, location)')}</li>
              <li>${getContent('event_email_feature_2', 'Mark event as sold out')}</li>
              <li>${getContent('event_email_feature_3', 'Upload or change event images')}</li>
              <li>${getContent('event_email_feature_4', 'Delete the event if needed')}</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 16px; color: #666; font-size: 14px;">
            <p><strong>Important:</strong> ${getContent('event_email_security_warning', 'Keep this management link secure. Anyone with this link can edit your event.')}</p>
            <p>${getContent('event_email_support_text', 'If you lose this link, you can request a new one by contacting support with your event details.')}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>${getContent('event_email_disclaimer', 'This is an automated message. If you didn\'t create this event, please ignore this email.')}</p>
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