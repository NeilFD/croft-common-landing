import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 newsletter subscriptions per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRealIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(',')[0] || 
         request.headers.get("x-real-ip") || 
         request.headers.get("cf-connecting-ip") ||
         "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);
  
  if (!existing || now > existing.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  existing.count++;
  return false;
}

function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  // Basic XSS prevention - strip HTML tags, normalize whitespace, limit length
  return input.replace(/<[^>]*>/g, '').replace(/[<>'"&]/g, '').trim().substring(0, 100);
}

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

  const ip = getRealIP(req);
  const requestId = crypto.randomUUID();
  
  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`);
      return new Response(JSON.stringify({
        error: "Too many subscription attempts. Please try again in a minute.",
        code: "RATE_LIMIT_EXCEEDED"
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": "60"
        }
      });
    }

    // Cleanup old rate limit entries periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanupRateLimit();
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({
        error: "Invalid request format",
        code: "INVALID_JSON"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { email, name, consent, phone, birthday, dietaryPreferences, interests }: SubscribeRequest = requestBody;

    // Enhanced input validation
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({
        error: "Valid email address is required",
        code: "EMAIL_REQUIRED"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!validateEmail(email)) {
      return new Response(JSON.stringify({
        error: "Please provide a valid email address",
        code: "INVALID_EMAIL"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!consent) {
      return new Response(JSON.stringify({
        error: "Consent is required to subscribe to our newsletter",
        code: "CONSENT_REQUIRED"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = sanitizeInput(name || '');
    const sanitizedPhone = phone ? sanitizeInput(phone) : null;

    console.log(`[${requestId}] Newsletter subscription attempt for: ${sanitizedEmail} from IP: ${ip}`);

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
      .eq('email', sanitizedEmail)
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

    // Parse first and last name from sanitized input
    const nameParts = sanitizedName.split(' ').filter(part => part.length > 0);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if auth user already exists
    let authData: any = null;
    let isNewUser = false;

    try {
      // Try to get existing user by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === sanitizedEmail);
      
      if (existingUser) {
        console.log(`[${requestId}] User ${sanitizedEmail} already exists in auth system`);
        authData = { user: existingUser };
      } else {
        // Create new auth user with magic link
        const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: sanitizedEmail,
          email_confirm: false,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            full_name: sanitizedName,
          }
        });

        if (authError) {
          console.error(`[${requestId}] Error creating auth user:`, authError);
          return new Response(JSON.stringify({
            error: "Failed to create user account",
            code: "AUTH_ERROR"
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        
        authData = newAuthData;
        isNewUser = true;
        console.log(`[${requestId}] Created new auth user for ${sanitizedEmail}`);
      }
    } catch (error) {
      console.error(`[${requestId}] Error handling auth user:`, error);
      return new Response(JSON.stringify({
        error: "Failed to process user account",
        code: "AUTH_PROCESSING_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Insert or reactivate subscriber (this should work for both new and existing users)
    const { data: subscriber, error: insertError } = await supabaseAdmin
      .from('subscribers')
      .upsert({
        email: sanitizedEmail,
        name: sanitizedName || null,
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
      console.error(`[${requestId}] Error inserting subscriber:`, insertError);
      return new Response(JSON.stringify({
        error: "Failed to process subscription",
        code: "DATABASE_ERROR"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse birthday into a proper date format (moved outside to fix scoping)
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

    // Create enhanced profile with additional data
    if (authData.user) {

      const profileData = {
        user_id: authData.user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        phone_number: sanitizedPhone,
        birthday: parsedBirthday,
        dietary_preferences: dietaryPreferences && dietaryPreferences.length > 0 ? dietaryPreferences : null,
        interests: interests && interests.length > 0 ? interests : null,
        communication_preferences: {
          email: true,
          push: true,
          sms: !!sanitizedPhone
        }
      };

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.error(`[${requestId}] Error creating profile:`, profileError);
        // Don't fail the whole process if profile creation fails
      }
    }

    // Send email verification for new users (replaces manual magic link generation)
    if (isNewUser) {
      const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://preview--croft-common-landing.lovable.app'}/`;
      
      const { error: emailError } = await supabaseAdmin.auth.signInWithOtp({
        email: sanitizedEmail,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: sanitizedName,
          }
        }
      });

      if (emailError) {
        console.error(`[${requestId}] Error sending verification email:`, emailError);
        return new Response(JSON.stringify({
          error: "Failed to send verification email",
          code: "EMAIL_ERROR"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      console.log(`[${requestId}] Verification email sent to ${sanitizedEmail}`);
    }

    // Note: Welcome email will be sent automatically after email verification via database trigger

    // Sync to Mailchimp in background (don't let Mailchimp failures break subscription)
    try {
      console.log(`[${requestId}] Attempting Mailchimp sync for ${sanitizedEmail} with birthday: ${parsedBirthday}`);
      
      const syncPayload = {
        email: sanitizedEmail,
        name: sanitizedName || null,
        phone: sanitizedPhone,
        birthday: parsedBirthday,
        interests: interests || [],
        consent_given: consent,
        consent_timestamp: new Date().toISOString(),
        action: existingSubscriber ? 'update' : 'create'
      };

      console.log('Sync payload:', JSON.stringify(syncPayload, null, 2));

      const mailchimpResponse = await supabaseAdmin.functions.invoke('sync-to-mailchimp', {
        body: syncPayload
      });

      if (mailchimpResponse.error) {
        console.error(`[${requestId}] Mailchimp sync failed:`, mailchimpResponse.error);
        console.error(`[${requestId}] Mailchimp response:`, JSON.stringify(mailchimpResponse, null, 2));
      } else {
        console.log(`[${requestId}] Successfully synced to Mailchimp:`, sanitizedEmail);
        console.log(`[${requestId}] Mailchimp response:`, JSON.stringify(mailchimpResponse, null, 2));
      }
    } catch (mailchimpError) {
      console.error(`[${requestId}] Error calling Mailchimp sync:`, mailchimpError);
      console.error(`[${requestId}] Full error details:`, JSON.stringify(mailchimpError, null, 2));
      // Continue with success response - don't fail subscription for Mailchimp issues
    }

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
    console.error(`[${requestId}] Error in subscribe-newsletter function:`, error);
    
    // Sanitize error messages for production
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    const sanitizedMessage = errorMessage.includes("JWT") || errorMessage.includes("auth") ? 
      "Authentication error - please try again" : 
      errorMessage.includes("network") || errorMessage.includes("fetch") ?
      "Network error - please check your connection" :
      "Unable to process subscription - please try again";

    return new Response(JSON.stringify({
      error: sanitizedMessage,
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);