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
  phone?: string;
  birthday?: string;
  dietaryPreferences?: string[];
  interests?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, consent, phone, birthday, dietaryPreferences, interests }: SubscribeRequest = await req.json();

    if (!email || !consent) {
      return new Response(
        JSON.stringify({ error: "Email and consent are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase clients
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if email already exists
    const { data: existingSubscriber } = await supabaseAnon
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

    // Parse first and last name
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create auth user with magic link
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: name,
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user account" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert or reactivate subscriber
    const { data: subscriber, error: insertError } = await supabaseAnon
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

    // Create enhanced profile with additional data
    if (authData.user) {
      const profileData = {
        user_id: authData.user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phone || null,
        birthday: birthday || null,
        dietary_preferences: dietaryPreferences && dietaryPreferences.length > 0 ? dietaryPreferences : null,
        interests: interests && interests.length > 0 ? interests : null,
        communication_preferences: {
          email: true,
          push: true,
          sms: !!phone
        }
      };

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail the whole process if profile creation fails
      }
    }

    // Send magic link for authentication
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://preview--croft-common-landing.lovable.app'}/`;
    
    const { error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (magicLinkError) {
      console.error("Error generating magic link:", magicLinkError);
    }

    // Send enhanced welcome email
    const welcomeResponse = await supabaseAnon.functions.invoke('send-welcome-email', {
      body: { 
        email: subscriber.email, 
        name: subscriber.name,
        firstName: firstName,
        subscriberId: subscriber.id,
        userId: authData.user?.id
      }
    });

    if (welcomeResponse.error) {
      console.error("Error sending welcome email:", welcomeResponse.error);
      // Don't fail the subscription if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Successfully subscribed! Check your email to complete setup and enable personalized notifications.",
      userId: authData.user?.id
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