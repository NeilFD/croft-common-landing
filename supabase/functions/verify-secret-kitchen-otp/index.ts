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
      // User exists, generate session
      userId = existingUser.users[0].id;
      console.log('👤 Existing user found, creating session for:', userId);
      
      // Create a session for existing user
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
          user_id: userId
        });

        if (sessionError) {
          console.error('❌ Session creation error for existing user:', sessionError);
          throw sessionError;
        }

        console.log('✅ Session created successfully for existing user');
        accessToken = sessionData.session.access_token;
      } catch (sessionErr) {
        console.error('❌ Failed to create session for existing user:', sessionErr);
        throw sessionErr;
      }
    } else {
      // Create new user
      console.log('👤 Creating new user');
      try {
        const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
          email: normEmail,
          email_confirm: true,
          user_metadata: {
            secret_kitchen_access: true
          }
        });

        if (createError) {
          console.error('❌ User creation error:', createError);
          throw createError;
        }

        console.log('✅ New user created successfully:', newUserData.user.id);
        userId = newUserData.user.id;

        // Create session for new user
        console.log('🔐 Creating session for new user');
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
          user_id: userId
        });

        if (sessionError) {
          console.error('❌ Session creation error for new user:', sessionError);
          throw sessionError;
        }

        console.log('✅ Session created successfully for new user');
        accessToken = sessionData.session.access_token;
      } catch (newUserErr) {
        console.error('❌ Failed to create new user or session:', newUserErr);
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