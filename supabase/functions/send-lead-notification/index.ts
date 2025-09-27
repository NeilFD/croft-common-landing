import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  eventType?: string;
  spaceName?: string;
  preferredDate?: string;
  dateFlexible?: boolean;
  headcount?: number;
  budgetLow?: number;
  budgetHigh?: number;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: LeadNotificationRequest = await req.json();
    console.log("Sending lead notification for:", payload.leadId);

    const {
      leadId,
      firstName,
      lastName,
      email,
      phone,
      eventType,
      spaceName,
      preferredDate,
      dateFlexible,
      headcount,
      budgetLow,
      budgetHigh,
      message
    } = payload;

    // Format the subject line
    let subject = `New enquiry: ${firstName} ${lastName}`;
    if (spaceName) {
      subject += ` → ${spaceName}`;
    }
    if (preferredDate) {
      subject += ` on ${new Date(preferredDate).toLocaleDateString('en-GB')}`;
    } else if (dateFlexible) {
      subject += ` (flexible dates)`;
    }

    // Format budget range
    let budgetText = '';
    if (budgetLow !== undefined && budgetHigh !== undefined) {
      budgetText = `£${budgetLow.toLocaleString()} - £${budgetHigh.toLocaleString()}`;
    } else if (budgetLow !== undefined) {
      budgetText = `£${budgetLow.toLocaleString()}+`;
    } else if (budgetHigh !== undefined) {
      budgetText = `Up to £${budgetHigh.toLocaleString()}`;
    }

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #000; color: #fff; padding: 20px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Croft Common</h1>
          <p style="margin: 10px 0 0 0; color: #ffd6e6;">New Lead Enquiry</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #000; font-size: 20px;">Contact Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; font-weight: bold; width: 120px;">Name:</td><td>${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Email:</td><td><a href="mailto:${email}" style="color: #e91e63;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 5px 0; font-weight: bold;">Phone:</td><td><a href="tel:${phone}" style="color: #e91e63;">${phone}</a></td></tr>` : ''}
          </table>
        </div>

        <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #000; font-size: 20px;">Event Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${eventType ? `<tr><td style="padding: 5px 0; font-weight: bold; width: 120px;">Event Type:</td><td>${eventType}</td></tr>` : ''}
            ${spaceName ? `<tr><td style="padding: 5px 0; font-weight: bold;">Space:</td><td>${spaceName}</td></tr>` : ''}
            ${preferredDate ? `<tr><td style="padding: 5px 0; font-weight: bold;">Date:</td><td>${new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
            ${dateFlexible ? `<tr><td style="padding: 5px 0; font-weight: bold;">Dates:</td><td>Flexible</td></tr>` : ''}
            ${headcount ? `<tr><td style="padding: 5px 0; font-weight: bold;">Headcount:</td><td>${headcount}</td></tr>` : ''}
            ${budgetText ? `<tr><td style="padding: 5px 0; font-weight: bold;">Budget:</td><td>${budgetText}</td></tr>` : ''}
          </table>
        </div>

        ${message ? `
        <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #000; font-size: 20px;">Message</h2>
          <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${message}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://app.')}/management/leads/${leadId}" 
             style="background: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Lead in Management
          </a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>This email was sent from the Croft Common enquiry system.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Croft Common <noreply@thehive-hospitality.com>",
      to: ["neil@thehive-hospitality.com"],
      subject: subject,
      html: htmlContent,
    });

    console.log("Lead notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailResponse.data?.id,
      leadId: leadId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error sending lead notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send notification",
        leadId: null
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);