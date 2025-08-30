import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPStorage {
  [email: string]: {
    code: string;
    expires: number;
  };
}

// In-memory storage for OTP codes (in production, use Redis or database)
const otpStore: OTPStorage = {};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, code } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'send-otp') {
      // Only allow neil@cityandsanctuary.com
      if (email !== 'neil@cityandsanctuary.com') {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 10-minute expiry
      otpStore[email] = {
        code: otpCode,
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes
      };

      // In production, send email via Resend or similar service
      // For now, we'll just log it (you can check function logs)
      console.log(`OTP for ${email}: ${otpCode}`);

      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent to email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-otp') {
      const stored = otpStore[email];
      
      if (!stored) {
        return new Response(
          JSON.stringify({ error: 'No OTP found for this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (Date.now() > stored.expires) {
        delete otpStore[email];
        return new Response(
          JSON.stringify({ error: 'OTP expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (stored.code !== code) {
        return new Response(
          JSON.stringify({ error: 'Invalid OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // OTP is valid, clean up and return success
      delete otpStore[email];
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Authentication successful',
          token: `admin_${Date.now()}` // Simple token for session
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secretkitchen-admin-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});