import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userEmail: string;
  userName: string;
  emailType: '6h' | '2h' | '1h' | 'expired';
  accessExpiresAt: string;
}

const getEmailContent = (emailType: string, userName: string) => {
  const brandColor = "#EC4899"; // Pink accent color
  
  const baseStyle = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { color: ${brandColor}; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .main-content { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 40px; text-align: center; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
    .message { color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
    .highlight { color: ${brandColor}; font-weight: 600; }
    .footer { text-align: center; margin-top: 40px; color: #999999; font-size: 14px; }
  `;

  switch (emailType) {
    case '6h':
      return {
        subject: "Six hours remain - Croft Common",
        html: `
          <html><head><style>${baseStyle}</style></head><body>
            <div class="container">
              <div class="header">
                <div class="logo">🍴 Croft Common</div>
              </div>
              <div class="main-content">
                <div class="title">Time is ticking, ${userName}</div>
                <div class="message">
                  You have <span class="highlight">6 hours remaining</span> to access your Secret Kitchen materials.<br><br>
                  Don't miss this opportunity to be part of something special.
                </div>
              </div>
              <div class="footer">
                Croft Common - Where culinary dreams take shape
              </div>
            </div>
          </body></html>
        `
      };

    case '2h':
      return {
        subject: "Two hours till access is denied - Croft Common",
        html: `
          <html><head><style>${baseStyle}</style></head><body>
            <div class="container">
              <div class="header">
                <div class="logo">🍴 Croft Common</div>
              </div>
              <div class="main-content">
                <div class="title">Final Notice, ${userName}</div>
                <div class="message">
                  <span class="highlight">Two hours till access is denied.</span><br><br>
                  Your window of opportunity is closing fast. Take action now.
                </div>
              </div>
              <div class="footer">
                Croft Common - Where culinary dreams take shape
              </div>
            </div>
          </body></html>
        `
      };

    case '1h':
      return {
        subject: "60 minutes to go. Don't be left behind - Croft Common",
        html: `
          <html><head><style>${baseStyle}</style></head><body>
            <div class="container">
              <div class="header">
                <div class="logo">🍴 Croft Common</div>
              </div>
              <div class="main-content">
                <div class="title">Last Call, ${userName}</div>
                <div class="message">
                  <span class="highlight">60 minutes to go. Don't be left behind.</span><br><br>
                  This is your final opportunity. Act now or miss out.
                </div>
              </div>
              <div class="footer">
                Croft Common - Where culinary dreams take shape
              </div>
            </div>
          </body></html>
        `
      };

    case 'expired':
      return {
        subject: "Times up. Timed Out. We move - Croft Common",
        html: `
          <html><head><style>${baseStyle}</style></head><body>
            <div class="container">
              <div class="header">
                <div class="logo">🍴 Croft Common</div>
              </div>
              <div class="main-content">
                <div class="title">Times up, ${userName}</div>
                <div class="message">
                  <span class="highlight">Timed Out. We move.</span><br><br>
                  Your access window has closed. Opportunities like this don't wait.
                </div>
              </div>
              <div class="footer">
                Croft Common - Where culinary dreams take shape
              </div>
            </div>
          </body></html>
        `
      };

    default:
      throw new Error(`Unknown email type: ${emailType}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, emailType, accessExpiresAt }: EmailRequest = await req.json();

    // Validate input
    if (!userEmail || !userName || !emailType || !accessExpiresAt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this email type has already been sent to this user for this expiry time
    const { data: existingLog, error: logCheckError } = await supabase
      .from('secret_kitchen_email_log')
      .select('id')
      .eq('user_email', userEmail)
      .eq('email_type', emailType)
      .eq('access_expires_at', accessExpiresAt)
      .single();

    if (logCheckError && logCheckError.code !== 'PGRST116') {
      console.error('Error checking email log:', logCheckError);
      throw logCheckError;
    }

    // If email already sent, return early
    if (existingLog) {
      return new Response(
        JSON.stringify({ message: "Email already sent", skipped: true }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Get email content
    const emailContent = getEmailContent(emailType, userName);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Croft Common <hello@stokescroft.co.uk>",
      to: [userEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`Email sent to ${userEmail} (${emailType}):`, emailResponse);

    // Log the email send
    const { error: logError } = await supabase
      .from('secret_kitchen_email_log')
      .insert({
        user_email: userEmail,
        email_type: emailType,
        access_expires_at: accessExpiresAt,
      });

    if (logError) {
      console.error('Error logging email send:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ 
        message: "Email sent successfully", 
        emailId: emailResponse.data?.id 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in send-access-reminder-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);