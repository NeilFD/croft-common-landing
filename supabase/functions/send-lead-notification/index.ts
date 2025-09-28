import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationRequest {
  leadId: string;
  leadData: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    event_type?: string;
    space_name?: string;
    preferred_date?: string;
    date_flexible?: boolean;
    headcount?: number;
    budget_low?: number;
    budget_high?: number;
    message?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, leadData }: LeadNotificationRequest = await req.json();
    console.log("Sending lead notification for:", leadId);

    // Get notification recipients from org_settings
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from('org_settings')
      .select('setting_value')
      .eq('setting_key', 'leads_notify_recipients')
      .single();

    const recipients = settings?.setting_value?.split(',').map((email: string) => email.trim()) || ['neil@thehive-hospitality.com'];

    // Format the subject line
    let subject = `New enquiry: ${leadData.first_name} ${leadData.last_name}`;
    if (leadData.space_name) {
      subject += ` → ${leadData.space_name}`;
    }
    if (leadData.preferred_date) {
      subject += ` on ${new Date(leadData.preferred_date).toLocaleDateString('en-GB')}`;
    } else if (leadData.date_flexible) {
      subject += ` (flexible dates)`;
    }

    // Format budget range
    let budgetText = '';
    if (leadData.budget_low !== undefined && leadData.budget_high !== undefined) {
      budgetText = `£${leadData.budget_low.toLocaleString()} - £${leadData.budget_high.toLocaleString()}`;
    } else if (leadData.budget_low !== undefined) {
      budgetText = `£${leadData.budget_low.toLocaleString()}+`;
    } else if (leadData.budget_high !== undefined) {
      budgetText = `Up to £${leadData.budget_high.toLocaleString()}`;
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
            <tr><td style="padding: 5px 0; font-weight: bold; width: 120px;">Name:</td><td>${leadData.first_name} ${leadData.last_name}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Email:</td><td><a href="mailto:${leadData.email}" style="color: #e91e63;">${leadData.email}</a></td></tr>
            ${leadData.phone ? `<tr><td style="padding: 5px 0; font-weight: bold;">Phone:</td><td><a href="tel:${leadData.phone}" style="color: #e91e63;">${leadData.phone}</a></td></tr>` : ''}
          </table>
        </div>

        <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #000; font-size: 20px;">Event Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${leadData.event_type ? `<tr><td style="padding: 5px 0; font-weight: bold; width: 120px;">Event Type:</td><td>${leadData.event_type}</td></tr>` : ''}
            ${leadData.space_name ? `<tr><td style="padding: 5px 0; font-weight: bold;">Space:</td><td>${leadData.space_name}</td></tr>` : ''}
            ${leadData.preferred_date ? `<tr><td style="padding: 5px 0; font-weight: bold;">Date:</td><td>${new Date(leadData.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>` : ''}
            ${leadData.date_flexible ? `<tr><td style="padding: 5px 0; font-weight: bold;">Dates:</td><td>Flexible</td></tr>` : ''}
            ${leadData.headcount ? `<tr><td style="padding: 5px 0; font-weight: bold;">Headcount:</td><td>${leadData.headcount}</td></tr>` : ''}
            ${budgetText ? `<tr><td style="padding: 5px 0; font-weight: bold;">Budget:</td><td>${budgetText}</td></tr>` : ''}
          </table>
        </div>

        ${leadData.message ? `
        <div style="background: #f8f9fa; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; color: #000; font-size: 20px;">Message</h2>
          <p style="margin: 0; line-height: 1.5; white-space: pre-wrap;">${leadData.message}</p>
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

    let emailSuccess = true;
    let emailError = null;

    try {
      const emailResponse = await resend.emails.send({
        from: "Croft Common <noreply@thehive-hospitality.com>",
        to: recipients,
        subject: subject,
        html: htmlContent,
      });

      console.log("Lead notification email sent successfully:", emailResponse);
    } catch (emailErr: any) {
      console.error('Failed to send email:', emailErr);
      emailSuccess = false;
      emailError = emailErr.message;
    }

    // Log email activity to lead_activity
    await supabase
      .from('lead_activity')
      .insert({
        lead_id: leadId,
        type: 'email',
        body: `Notification email ${emailSuccess ? 'sent successfully' : 'failed to send'} to ${recipients.join(', ')}`,
        author_id: null,
        meta: {
          template: 'new_lead_notify',
          recipients,
          success: emailSuccess,
          error: emailError
        }
      });

    return new Response(JSON.stringify({ 
      success: emailSuccess, 
      recipients,
      error: emailError 
    }), {
      status: emailSuccess ? 200 : 500,
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