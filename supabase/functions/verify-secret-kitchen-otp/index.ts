import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    console.log('🔍 Starting OTP verification process');
    
    const { email, code } = await req.json();
    console.log('📧 Request data:', { email, code: code ? '******' : null });
    
    if (!email || !code) {
      console.log('❌ Missing email or code');
      return new Response(JSON.stringify({ error: 'Email and code are required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const normEmail = String(email).trim().toLowerCase();
    console.log('📧 Normalized email:', normEmail);
    
    if (!isValidEmail(normEmail)) {
      console.log('❌ Invalid email format');
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Verify OTP code
    console.log('🔐 Checking OTP code in database');
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', normEmail)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (otpError) {
      console.error('❌ OTP verification error:', otpError);
      throw otpError;
    }

    if (!otpData) {
      console.log('❌ Invalid or expired OTP code');
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('✅ OTP verified successfully');

    // Check if user already exists
    console.log('👤 Checking if user exists');
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${normEmail}`
    });
    
    if (userCheckError) {
      console.error('❌ User check error:', userCheckError);
      throw userCheckError;
    }
    
    console.log('👤 User check result:', { userCount: existingUser?.users?.length || 0 });
    
    let userId: string;
    let accessToken: string;

    if (existingUser?.users && existingUser.users.length > 0) {
      // User exists, generate magic link for sign in
      userId = existingUser.users[0].id;
      console.log('👤 Existing user found, generating magic link for:', userId);
      
      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: normEmail,
          options: {
            redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://') || 'http://localhost:54321'}/auth/v1/verify?redirect_to=${encodeURIComponent(window?.location?.origin || 'http://localhost:8080')}/secretkitchens`
          }
        });

        if (linkError) {
          console.error('❌ Magic link generation error:', linkError);
          throw linkError;
        }

        console.log('✅ Magic link generated successfully');
        accessToken = linkData.properties.access_token;
      } catch (linkErr) {
        console.error('❌ Failed to generate magic link:', linkErr);
        throw linkErr;
      }
    } else {
      // Create new user with magic link
      console.log('👤 Creating new user with magic link');
      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: normEmail,
          options: {
            data: {
              secret_kitchen_access: true
            },
            redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://') || 'http://localhost:54321'}/auth/v1/verify?redirect_to=${encodeURIComponent(window?.location?.origin || 'http://localhost:8080')}/secretkitchens`
          }
        });

        if (linkError) {
          console.error('❌ User creation with magic link error:', linkError);
          throw linkError;
        }

        console.log('✅ New user created with magic link successfully');
        userId = linkData.user.id;
        accessToken = linkData.properties.access_token;
      } catch (newUserErr) {
        console.error('❌ Failed to create new user with magic link:', newUserErr);
        throw newUserErr;
      }
    }

    // Mark OTP as consumed by deleting it
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', normEmail)
      .eq('code', code);

    // Update secret kitchen access record
    await supabase
      .from('secret_kitchen_access')
      .update({ 
        last_accessed: new Date().toISOString(),
        user_id: userId 
      })
      .eq('email', normEmail);

    return new Response(JSON.stringify({ 
      success: true, 
      access_token: accessToken,
      user: { id: userId, email: normEmail }
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    console.error('verify-secret-kitchen-otp error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});