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

    // Check if email already exists as an active subscriber
    const { data: existingSubscriber } = await supabaseAnon
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email)
      .single();

    // Only prevent subscription if they're already active AND this looks like a duplicate request
    // Allow updates to preferences/profile data
    if (existingSubscriber && existingSubscriber.is_active && (!phone && !birthday && (!dietaryPreferences || dietaryPreferences.length === 0) && (!interests || interests.length === 0))) {
      return new Response(
        JSON.stringify({ error: "Email already subscribed. Add preferences to update your profile." }),
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

    // Check if auth user already exists
    let authData: any = null;
    let isNewUser = false;

    try {
      // Try to get existing user by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`User ${email} already exists in auth system`);
        authData = { user: existingUser };
      } else {
        // Create new auth user with magic link
        const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
        
        authData = newAuthData;
        isNewUser = true;
        console.log(`Created new auth user for ${email}`);
      }
    } catch (error) {
      console.error("Error handling auth user:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process user account" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert or reactivate subscriber (this should work for both new and existing users)
    const { data: subscriber, error: insertError } = await supabaseAdmin
      .from('subscribers')
      .upsert({
        email,
        name: name || null,
        consent_given: consent,
        consent_timestamp: new Date().toISOString(),
        is_active: true,
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
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
      // Parse birthday into a proper date format
      let parsedBirthday = null;
      if (birthday) {
        try {
          // Handle various date formats like "7/October", "7th October", "Oct 7", etc.
          const cleanBirthday = birthday.replace(/(\d+)(st|nd|rd|th)/g, '$1');
          
          // Try to parse different formats
          let dateToparse = cleanBirthday;
          
          // Handle "7/October" format - convert to "October 7"
          if (dateToparse.includes('/')) {
            const parts = dateToparse.split('/');
            if (parts.length === 2 && !parts[1].match(/^\d+$/)) {
              dateToparse = `${parts[1]} ${parts[0]}`;
            }
          }
          
          // Parse with current year if no year provided
          const currentYear = new Date().getFullYear();
          const testDate = new Date(`${dateToparse} ${currentYear}`);
          
          if (!isNaN(testDate.getTime())) {
            // Format as YYYY-MM-DD for PostgreSQL
            parsedBirthday = testDate.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("Error parsing birthday:", e);
          // Leave as null if parsing fails
        }
      }

      const profileData = {
        user_id: authData.user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: phone || null,
        birthday: parsedBirthday,
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
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail the whole process if profile creation fails
      }
    }

    // Send email verification for new users (replaces manual magic link generation)
    if (isNewUser) {
      const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://preview--croft-common-landing.lovable.app'}/`;
      
      const { error: emailError } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: name,
          }
        }
      });

      if (emailError) {
        console.error("Error sending verification email:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send verification email" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      console.log(`Verification email sent to ${email}`);
    }

    // Note: Welcome email will be sent automatically after email verification via database trigger

    const successMessage = isNewUser 
      ? "Successfully subscribed! Check your email to complete setup and enable personalized notifications."
      : "Successfully updated your subscription! Your profile has been enhanced with your preferences.";

    return new Response(JSON.stringify({ 
      success: true, 
      message: successMessage,
      userId: authData.user?.id,
      isNewUser: isNewUser
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