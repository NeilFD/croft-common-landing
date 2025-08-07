import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
  name?: string;
  consent: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, consent }: SubscribeRequest = await req.json();

    if (!email || !consent) {
      return new Response(
        JSON.stringify({ error: "Email and consent are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email)
      .single();

    if (existingSubscriber && existingSubscriber.is_active) {
      return new Response(
        JSON.stringify({ error: "Email already subscribed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert or reactivate subscriber
    const { data: subscriber, error: insertError } = await supabase
      .from('subscribers')
      .upsert({
        email,
        name: name || null,
        consent_given: consent,
        consent_timestamp: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting subscriber:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to subscribe" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send welcome email with secret gesture
    const welcomeResponse = await supabase.functions.invoke('send-welcome-email', {
      body: { 
        email: subscriber.email, 
        name: subscriber.name,
        subscriberId: subscriber.id
      }
    });

    if (welcomeResponse.error) {
      console.error("Error sending welcome email:", welcomeResponse.error);
      // Don't fail the subscription if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Successfully subscribed! Check your email for Common Room access." 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in subscribe-newsletter function:", error);
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