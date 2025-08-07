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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #000; font-size: 24px; font-weight: normal; letter-spacing: 0.1em; margin: 0;">CROFT COMMON</h1>
          </div>
          
          <div style="line-height: 1.6; font-size: 16px;">
            <p>Hi ${displayName},</p>
            
            <p>Thanks for stepping closer. You didn't just subscribe - you crossed the threshold.</p>
            
            <p>Seven's always meant something to us.<br>
            Seven days. Seven sins. Seven seas. Lucky number seven.<br>
            It's everywhere.<br>
            Now it opens something else, it's the key.</p>
            
            <div style="background: #f8f9fa; padding: 24px; margin: 24px 0; border-left: 4px solid #000;">
              <p style="margin: 0 0 12px 0; font-weight: bold;">To unlock The Common Room:</p>
              <p style="margin: 0 0 8px 0;">Visit <a href="https://410602d4-4805-4fdf-8c51-900e548d9b20.lovableproject.com/common-room" style="color: #000;">croftcommontest.co.uk/common-room</a></p>
              <p style="margin: 0; font-weight: bold;">Draw a seven. Boldly. A single line. One gesture. That's it. Sign in.</p>
            </div>
            
            <p>Inside, you'll find what's not shouted. The stuff that doesn't always make it to the flyers, the feed, or the posters.</p>
            
            <p>We'll still drop into your inbox when it matters, but The Common Room is where the common knowledge lives. Quiet perks. First looks. An early heads-up.</p>
            
            <p>See you on the inside.</p>
            
            <p style="margin-top: 32px;">— Croft Common</p>
          </div>
          
          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>Don't want these emails? <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe here</a></p>
            <p>Croft Common, Stokes Croft, Bristol</p>
          </div>
        </div>
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