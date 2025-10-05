import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

interface EnquiryConfirmationRequest {
  enquiryData: {
    name: string;
    email: string;
    eventType: string;
    guestCount: number;
    eventDate?: string;
    budget?: string;
    vibe?: string;
    fbStyle?: string;
    specialRequests?: string;
    recommendedSpace?: {
      name: string;
      description?: string;
    };
    aiReasoning?: string;
  };
}

function buildEnquirerEmail(data: EnquiryConfirmationRequest['enquiryData']): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: #000000; padding: 40px 24px; text-align: center; border-bottom: 3px solid #FF69B4; }
          .logo { font-size: 24px; font-weight: 700; letter-spacing: 0.2em; color: #ffffff; margin: 0; text-transform: uppercase; }
          .content { padding: 40px 24px; }
          .greeting { font-size: 24px; font-weight: 700; color: #000000; margin: 0 0 16px 0; }
          .message { font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 24px 0; }
          .details-box { background: #f8f9fa; border-left: 4px solid #FF69B4; padding: 24px; margin: 24px 0; }
          .detail-row { margin: 12px 0; }
          .detail-label { font-weight: 700; color: #000000; display: inline-block; width: 140px; }
          .detail-value { color: #333333; }
          .recommendation-box { background: #fff5f9; border: 2px solid #FF69B4; border-radius: 8px; padding: 24px; margin: 24px 0; }
          .recommendation-title { font-size: 18px; font-weight: 700; color: #FF69B4; margin: 0 0 12px 0; }
          .recommendation-text { font-size: 14px; line-height: 1.6; color: #333333; margin: 0; }
          .cta-box { text-align: center; margin: 32px 0; }
          .cta-text { font-size: 16px; color: #333333; margin: 0 0 16px 0; }
          .contact-info { background: #000000; color: #ffffff; padding: 24px; text-align: center; font-size: 14px; line-height: 1.6; }
          .contact-link { color: #FF69B4; text-decoration: none; font-weight: 700; }
          .footer { background: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">CROFT COMMON</h1>
          </div>
          
          <div class="content">
            <h2 class="greeting">Thank you, ${data.name}!</h2>
            
            <p class="message">
              We've received your event enquiry and we're excited to help make your ${data.eventType} unforgettable.
            </p>
            
            <p class="message">
              Our events team will review your requirements and get back to you within 24 hours with a tailored proposal.
            </p>
            
            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Event Type:</span>
                <span class="detail-value">${data.eventType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Guest Count:</span>
                <span class="detail-value">${data.guestCount} guests</span>
              </div>
              ${data.eventDate ? `
              <div class="detail-row">
                <span class="detail-label">Event Date:</span>
                <span class="detail-value">${data.eventDate}</span>
              </div>
              ` : ''}
              ${data.budget ? `
              <div class="detail-row">
                <span class="detail-label">Budget:</span>
                <span class="detail-value">${data.budget}</span>
              </div>
              ` : ''}
              ${data.vibe ? `
              <div class="detail-row">
                <span class="detail-label">Vibe:</span>
                <span class="detail-value">${data.vibe}</span>
              </div>
              ` : ''}
              ${data.fbStyle ? `
              <div class="detail-row">
                <span class="detail-label">Food & Beverage:</span>
                <span class="detail-value">${data.fbStyle}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.recommendedSpace?.name ? `
            <div class="recommendation-box">
              <h3 class="recommendation-title">Our Initial Recommendation: ${data.recommendedSpace.name}</h3>
              ${data.aiReasoning ? `
              <p class="recommendation-text">${data.aiReasoning}</p>
              ` : ''}
            </div>
            ` : ''}
            
            <div class="cta-box">
              <p class="cta-text">In the meantime, have any questions?</p>
            </div>
          </div>
          
          <div class="contact-info">
            <p style="margin: 0 0 8px 0;">
              <strong>Croft Common Events Team</strong>
            </p>
            <p style="margin: 0;">
              Email: <a href="mailto:enquiries@croftcommon.co.uk" class="contact-link">enquiries@croftcommon.co.uk</a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} Croft Common. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildInternalNotificationEmail(data: EnquiryConfirmationRequest['enquiryData']): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: #FF69B4; padding: 32px 24px; text-align: center; }
          .header-title { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0; }
          .content { padding: 32px 24px; }
          .alert-box { background: #fff5f9; border: 2px solid #FF69B4; border-radius: 8px; padding: 20px; margin: 0 0 24px 0; text-align: center; }
          .alert-text { font-size: 16px; font-weight: 700; color: #000000; margin: 0; }
          .section { margin: 24px 0; }
          .section-title { font-size: 18px; font-weight: 700; color: #000000; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #f0f0f0; }
          .detail-row { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 700; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
          .detail-value { color: #000000; font-size: 16px; }
          .recommendation-box { background: #000000; color: #ffffff; padding: 20px; border-radius: 8px; margin: 24px 0; }
          .recommendation-title { font-size: 16px; font-weight: 700; color: #FF69B4; margin: 0 0 12px 0; }
          .recommendation-text { font-size: 14px; line-height: 1.6; margin: 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="header-title">🎉 New Event Enquiry Received</h1>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <p class="alert-text">Action Required: Respond within 24 hours</p>
            </div>
            
            <div class="section">
              <h2 class="section-title">Contact Information</h2>
              <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${data.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value"><a href="mailto:${data.email}" style="color: #FF69B4; text-decoration: none; font-weight: 700;">${data.email}</a></span>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">Event Details</h2>
              <div class="detail-row">
                <span class="detail-label">Event Type</span>
                <span class="detail-value">${data.eventType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Guest Count</span>
                <span class="detail-value">${data.guestCount} guests</span>
              </div>
              ${data.eventDate ? `
              <div class="detail-row">
                <span class="detail-label">Event Date</span>
                <span class="detail-value">${data.eventDate}</span>
              </div>
              ` : ''}
              ${data.budget ? `
              <div class="detail-row">
                <span class="detail-label">Budget</span>
                <span class="detail-value">${data.budget}</span>
              </div>
              ` : ''}
              ${data.vibe ? `
              <div class="detail-row">
                <span class="detail-label">Vibe</span>
                <span class="detail-value">${data.vibe}</span>
              </div>
              ` : ''}
              ${data.fbStyle ? `
              <div class="detail-row">
                <span class="detail-label">Food & Beverage</span>
                <span class="detail-value">${data.fbStyle}</span>
              </div>
              ` : ''}
              ${data.specialRequests ? `
              <div class="detail-row">
                <span class="detail-label">Special Requests</span>
                <span class="detail-value">${data.specialRequests}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.recommendedSpace?.name ? `
            <div class="recommendation-box">
              <h3 class="recommendation-title">AI Recommended Space: ${data.recommendedSpace.name}</h3>
              ${data.aiReasoning ? `
              <p class="recommendation-text">${data.aiReasoning}</p>
              ` : ''}
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p style="margin: 0;">
              This enquiry was submitted via the Croft Common website enquiry form.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enquiryData }: EnquiryConfirmationRequest = await req.json();

    if (!enquiryData || !enquiryData.email || !enquiryData.name) {
      return new Response(
        JSON.stringify({ error: 'Missing required enquiry data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending confirmation emails for enquiry from:', enquiryData.email);

    // Send confirmation email to enquirer
    const enquirerEmailResult = await resend.emails.send({
      from: "Croft Common Events Team <neil@thehive-hospitality.com>",
      to: [enquiryData.email],
      subject: "Thank you for your event enquiry - Croft Common",
      html: buildEnquirerEmail(enquiryData),
    });

    if ((enquirerEmailResult as any)?.error) {
      console.error('Failed to send enquirer confirmation:', (enquirerEmailResult as any).error);
    } else {
      console.log('Enquirer confirmation sent successfully');
    }

    // Send internal notification to Neil
    const internalEmailResult = await resend.emails.send({
      from: "Croft Common Events System <neil@thehive-hospitality.com>",
      to: ["neil@croftcommon.co.uk"],
      replyTo: enquiryData.email,
      subject: `New Event Enquiry: ${enquiryData.eventType} - ${enquiryData.guestCount} guests`,
      html: buildInternalNotificationEmail(enquiryData),
    });

    if ((internalEmailResult as any)?.error) {
      console.error('Failed to send internal notification:', (internalEmailResult as any).error);
    } else {
      console.log('Internal notification sent successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        enquirerEmailSent: !(enquirerEmailResult as any)?.error,
        internalEmailSent: !(internalEmailResult as any)?.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending enquiry confirmation emails:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send confirmation emails', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
