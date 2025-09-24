import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  name: string;
  message: string;
  isAnonymous: boolean;
  ratings?: {
    hospitality: number | null;
    food: number | null;
    drink: number | null;
    team: number | null;
    venue: number | null;
    price: number | null;
    overall: number | null;
  };
  sourcePage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, message, isAnonymous, ratings, sourcePage }: FeedbackRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!isAnonymous && (!name || name.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: "Name is required when not anonymous" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const displayName = isAnonymous ? "Anonymous" : name.trim();
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Store feedback in database
    const { data: feedbackData, error: dbError } = await supabase
      .from('feedback_submissions')
      .insert({
        name: isAnonymous ? null : name.trim(),
        message: message.trim(),
        is_anonymous: isAnonymous,
        source_page: sourcePage || 'unknown',
        hospitality_rating: ratings?.hospitality || null,
        food_rating: ratings?.food || null,
        drink_rating: ratings?.drink || null,
        team_rating: ratings?.team || null,
        venue_rating: ratings?.venue || null,
        price_rating: ratings?.price || null,
        overall_rating: ratings?.overall || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store feedback: ${dbError.message}`);
    }

    console.log('Feedback stored successfully:', feedbackData.id);

    // Format ratings for email display
    const formatRatings = (ratings: any) => {
      if (!ratings) return '';
      
      const ratingCategories = [
        { key: 'hospitality', label: 'Hospitality' },
        { key: 'food', label: 'Food' },
        { key: 'drink', label: 'Drink' },
        { key: 'team', label: 'Team' },
        { key: 'venue', label: 'Venue' },
        { key: 'price', label: 'Price' },
        { key: 'overall', label: 'Overall Experience' }
      ];
      
      const ratedCategories = ratingCategories.filter(cat => 
        ratings[cat.key] !== null && ratings[cat.key] !== undefined
      );
      
      if (ratedCategories.length === 0) return '';
      
      return `
        <div style="margin: 30px 0;">
          <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">Ratings:</h3>
          <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 15px; border-radius: 0 8px 8px 0;">
            ${ratedCategories.map(cat => {
              const stars = '★'.repeat(ratings[cat.key]) + '☆'.repeat(5 - ratings[cat.key]);
              return `<p style="margin: 5px 0;"><strong>${cat.label}:</strong> ${stars} (${ratings[cat.key]}/5)</p>`;
            }).join('')}
          </div>
        </div>
      `;
    };

    const emailResponse = await resend.emails.send({
      from: "Croft Common Feedback <feedback@croftcommon.com>",
      to: ["neil@croftcommon.co.uk"],
      subject: `Uncommon Standards Feedback from ${displayName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="border-bottom: 3px solid #ec4899; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1f2937; font-size: 24px; margin: 0; font-weight: bold;">Croft Common Feedback</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">From your Uncommon Standards page</p>
          </div>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #ec4899; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">Feedback Details</h2>
            <p style="margin: 8px 0;"><strong>From:</strong> ${displayName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${currentDate}</p>
            <p style="margin: 8px 0;"><strong>Source:</strong> Uncommon Standards page</p>
          </div>
          
          ${formatRatings(ratings)}
          
          <div style="margin: 30px 0;">
            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0;">Message:</h3>
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; line-height: 1.6; color: #374151;">
              ${message.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
            </div>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This feedback was submitted through the Croft Common website<br>
              <strong>Uncommon Standards</strong> page
            </p>
          </div>
        </div>
      `,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Feedback sent successfully" 
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
    console.error("Error in send-feedback-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send feedback",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);