import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

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

// Initialize Resend
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

      // Send OTP via email
      try {
        await resend.emails.send({
          from: 'Secret Kitchen Admin <admin@cityandsanctuary.com>',
          to: [email],
          subject: 'Secret Kitchen Admin - Login Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Secret Kitchen Admin Access</h2>
              <p>Your verification code is:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otpCode}</span>
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        });
        
        console.log(`OTP sent successfully to ${email}: ${otpCode}`);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Still log the OTP as fallback
        console.log(`OTP for ${email}: ${otpCode}`);
      }

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