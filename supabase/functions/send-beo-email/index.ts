import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BEOEmailRequest {
  eventId: string;
  versionNo: number;
  pdfUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, versionNo, pdfUrl }: BEOEmailRequest = await req.json();

    console.log(`📧 Sending BEO email for event ${eventId}, version ${versionNo}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch event details to get client email
    console.log("🔎 Querying management_events for event", { eventId });
    const { data: event, error: eventError } = await supabase
      .from("management_events")
      .select("client_email, code, event_type")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("❌ Error fetching event:", eventError);
      throw new Error("Event not found");
    }

    if (!event.client_email) {
      console.error("❌ No client email found for event");
      throw new Error("No client email found for this event");
    }

    console.log(`✅ Found event: ${event.event_type}, sending to: ${event.client_email}`);

    // Download the PDF
    let pdfBuffer: ArrayBuffer;
    try {
      let url = pdfUrl;
      
      // Handle legacy public URLs (bucket is now private)
      if (pdfUrl.includes('/storage/v1/object/public/beo-documents/')) {
        const fileName = pdfUrl.split('/beo-documents/')[1];
        const { data: signedData } = await supabase.storage
          .from('beo-documents')
          .createSignedUrl(fileName, 300);

        if (signedData?.signedUrl) {
          url = signedData.signedUrl;
        }
      }

      console.log(`📥 Downloading PDF from: ${url.substring(0, 100)}...`);
      const pdfResponse = await fetch(url);
      
      if (!pdfResponse.ok) {
        throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
      
      pdfBuffer = await pdfResponse.arrayBuffer();
      console.log(`✅ PDF downloaded: ${pdfBuffer.byteLength} bytes`);
    } catch (downloadError) {
      console.error("❌ Error downloading PDF:", downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert ArrayBuffer to base64
    const base64Pdf = btoa(
      new Uint8Array(pdfBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // Send email with PDF attachment
    const emailSubject = `Banquet Event Order - ${event.code || event.event_type}`;
    const emailResponse = await resend.emails.send({
      from: "Croft Common <hello@thehive-hospitality.com>",
      to: [event.client_email],
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CROFT COMMON</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">Banquet Event Order</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Please find attached the Banquet Event Order (BEO) for your upcoming event at Croft Common.
            </p>
            
            <div style="background-color: #ffffff; border-left: 4px solid #1a1a1a; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #333;"><strong>Event:</strong> ${event.event_type || 'Your Event'}</p>
              ${event.code ? `<p style="margin: 5px 0 0 0; color: #333;"><strong>Reference:</strong> ${event.code}</p>` : ''}
              <p style="margin: 5px 0 0 0; color: #333;"><strong>BEO Version:</strong> ${versionNo}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              This document contains all the details of your event including menu selections, timings, 
              room layouts, and special requirements. Please review carefully and contact us if you have 
              any questions or require changes.
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              We look forward to hosting your event at Croft Common.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 12px; line-height: 1.5; margin: 0;">
                <strong>Croft Common</strong><br>
                The Hive, 51 Lever Street, Manchester, M1 1FN<br>
                Email: hello@thehive-hospitality.com
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `BEO-v${versionNo}-${event.code || eventId.substring(0, 8)}.pdf`,
          content: base64Pdf,
        },
      ],
    });

    console.log("✅ BEO email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        recipient: event.client_email 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in send-beo-email function:", error);
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
