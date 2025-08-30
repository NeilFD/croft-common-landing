import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


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

      // Clean up expired OTP codes first
      await supabase.rpc('cleanup_expired_otp_codes');

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database with 10-minute expiry
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      // Delete any existing OTP for this email
      await supabase.from('otp_codes').delete().eq('email', email);
      
      // Insert new OTP
      const { error: insertError } = await supabase
        .from('otp_codes')
        .insert({
          email,
          code: otpCode,
          expires_at: expiresAt
        });

      if (insertError) {
        console.error('Failed to store OTP:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store verification code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send OTP via email
      try {
        await resend.emails.send({
          from: 'Secret Kitchen Admin <admin@thehive-hospitality.com>',
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
      // Clean up expired OTP codes first
      await supabase.rpc('cleanup_expired_otp_codes');

      // Look up OTP in database
      const { data: otpData, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError || !otpData) {
        console.log('No OTP found for email:', email, fetchError);
        return new Response(
          JSON.stringify({ error: 'No OTP found for this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if OTP has expired
      if (new Date() > new Date(otpData.expires_at)) {
        // Delete expired OTP
        await supabase.from('otp_codes').delete().eq('email', email);
        return new Response(
          JSON.stringify({ error: 'OTP expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if OTP code matches
      if (otpData.code !== code) {
        console.log('Invalid OTP attempt:', { provided: code, stored: otpData.code });
        return new Response(
          JSON.stringify({ error: 'Invalid OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // OTP is valid, clean up and return success
      await supabase.from('otp_codes').delete().eq('email', email);
      
      console.log(`Successful OTP verification for ${email}`);
      
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