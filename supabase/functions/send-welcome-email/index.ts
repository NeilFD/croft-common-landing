import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  subscriberId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, subscriberId }: WelcomeEmailRequest = await req.json();

    const displayName = name || "Friend";
    const unsubscribeUrl = `https://410602d4-4805-4fdf-8c51-900e548d9b20.lovableproject.com/unsubscribe?token=${subscriberId}`;

    const emailResponse = await resend.emails.send({
      from: "Croft Common <hello@thehive-hospitality.com>",
      to: [email],
      subject: "You're In",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
          <title>You're In - Croft Common</title>
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); font-family: 'Work Sans', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-bottom: 4px solid #ff1b6b;">
              <!-- CSS Recreation of Croft Logo -->
              <div style="width: 60px; height: 60px; border: 3px solid #ffffff; margin: 0 auto 20px; display: inline-block; vertical-align: top;">
                <div style="width: 100%; height: 50%; border-bottom: 3px solid #ffffff; box-sizing: border-box;"></div>
                <div style="width: 100%; height: 50%; display: flex; box-sizing: border-box;">
                  <div style="width: 33.33%; height: 100%; border-right: 3px solid #ffffff; box-sizing: border-box;"></div>
                  <div style="width: 33.33%; height: 100%; border-right: 3px solid #ffffff; box-sizing: border-box;"></div>
                  <div style="width: 33.33%; height: 100%; box-sizing: border-box;"></div>
                </div>
              </div>
              <h1 style="color: #ffffff; font-family: 'Oswald', Arial Black, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">CROFT COMMON</h1>
              <div style="width: 40px; height: 3px; background: #ff1b6b; margin: 15px auto 0;"></div>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; background: #ffffff;">
              <h2 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: 0.05em; margin: 0 0 30px 0; text-transform: uppercase;">Hi ${displayName},</h2>
              
              <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 18px; line-height: 1.7; margin: 0 0 25px 0; font-weight: 400;">Thanks for stepping closer. You didn't just subscribe - you crossed the threshold.</p>
              
              <div style="padding: 30px 0; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; margin: 30px 0;">
                <p style="color: #1a1a1a; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">Seven's always meant something to us.</p>
                <p style="color: #1a1a1a; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">Seven days. Seven sins. Seven seas. Lucky number seven.</p>
                <p style="color: #1a1a1a; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0 0 15px 0;">It's everywhere.</p>
                <p style="color: #ff1b6b; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.8; margin: 0; font-weight: 600;">Now it opens something else, it's the key.</p>
              </div>
              
              <!-- Call to Action Box -->
              <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 35px; margin: 35px 0; border: 2px solid #ff1b6b; position: relative;">
                <div style="position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px; background: linear-gradient(45deg, #ff1b6b, #000000, #ff1b6b); z-index: -1; border-radius: inherit;"></div>
                <h3 style="color: #ffffff; font-family: 'Oswald', Arial Black, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; margin: 0 0 20px 0; text-transform: uppercase; text-align: center;">To unlock The Common Room:</h3>
                <p style="color: #e5e5e5; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">Visit <a href="https://410602d4-4805-4fdf-8c51-900e548d9b20.lovableproject.com/common-room" style="color: #ff1b6b; text-decoration: none; font-weight: 600;">croftcommontest.co.uk/common-room</a></p>
                <div style="background: rgba(255, 27, 107, 0.1); border: 1px solid #ff1b6b; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="color: #ffffff; font-family: 'Oswald', Arial, sans-serif; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: 0.05em;">Draw a seven. Boldly. A single line. One gesture. That's it. Sign in.</p>
                </div>
              </div>
              
              <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">Inside, you'll find what's not shouted. The stuff that doesn't always make it to the flyers, the feed, or the posters.</p>
              
              <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">We'll still drop into your inbox when it matters, but The Common Room is where the common knowledge lives. Quiet perks. First looks. An early heads-up.</p>
              
              <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.7; margin: 0 0 40px 0;">See you on the inside.</p>
              
              <div style="text-align: right; border-top: 1px solid #e5e5e5; padding-top: 25px;">
                <p style="color: #1a1a1a; font-family: 'Oswald', Arial, sans-serif; font-size: 16px; font-weight: 400; margin: 0; letter-spacing: 0.1em;">— CROFT COMMON</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%); padding: 30px; text-align: center; border-top: 2px solid #ff1b6b;">
              <div style="margin-bottom: 20px;">
                <!-- Small Logo -->
                <div style="width: 30px; height: 30px; border: 2px solid #666666; margin: 0 auto; display: inline-block;">
                  <div style="width: 100%; height: 50%; border-bottom: 2px solid #666666; box-sizing: border-box;"></div>
                  <div style="width: 100%; height: 50%; display: flex; box-sizing: border-box;">
                    <div style="width: 33.33%; height: 100%; border-right: 2px solid #666666; box-sizing: border-box;"></div>
                    <div style="width: 33.33%; height: 100%; border-right: 2px solid #666666; box-sizing: border-box;"></div>
                    <div style="width: 33.33%; height: 100%; box-sizing: border-box;"></div>
                  </div>
                </div>
              </div>
              <p style="color: #999999; font-family: 'Work Sans', Arial, sans-serif; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">Don't want these emails? <a href="${unsubscribeUrl}" style="color: #ff1b6b; text-decoration: none;">Unsubscribe here</a></p>
              <p style="color: #666666; font-family: 'Work Sans', Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0;">Croft Common, Stokes Croft, Bristol</p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

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
      message: "Welcome email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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