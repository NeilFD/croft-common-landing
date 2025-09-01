import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  email: string;
  action: 'send_otp' | 'verify_otp';
  code?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

// Create service role client for admin operations
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const resend = new Resend(resendApiKey);

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSecretKitchensEmail = async (email: string, code: string) => {
  const { error } = await resend.emails.send({
    from: 'Secret Kitchens <onboarding@resend.dev>',
    to: [email],
    subject: 'Your Secret Kitchens Access Code',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin: 0; font-weight: 600;">Secret Kitchens</h1>
          <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Exclusive Access</p>
        </div>
        
        <div style="background: #f9f9f9; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
          <p style="color: #333; font-size: 18px; margin: 0 0 20px 0;">Your verification code:</p>
          <div style="font-size: 36px; font-weight: bold; color: #1a1a1a; letter-spacing: 4px; font-family: monospace;">${code}</div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px; line-height: 1.5;">
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 Secret Kitchens. All rights reserved.</p>
        </div>
      </div>
    `,
  });
  
  if (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const handleSendOTP = async (email: string) => {
  console.log(`Sending OTP to: ${email}`);
  
  // Clean up expired codes first
  await supabaseService.rpc('cleanup_expired_secret_kitchens_otp_codes');
  
  // Check if email has Secret Kitchens access
  const { data: accessData, error: accessError } = await supabaseService
    .from('secret_kitchen_access')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();
  
  if (accessError || !accessData) {
    throw new Error('Email not found in Secret Kitchens access list');
  }
  
  // Generate and store OTP
  const code = generateOTP();
  
  const { error: otpError } = await supabaseService
    .from('secret_kitchens_otp_codes')
    .insert({
      email,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    });
  
  if (otpError) {
    console.error('OTP storage error:', otpError);
    throw new Error('Failed to generate verification code');
  }
  
  // Send email
  await sendSecretKitchensEmail(email, code);
  
  console.log(`OTP sent successfully to: ${email}`);
  return { success: true };
};

const handleVerifyOTP = async (email: string, code: string) => {
  console.log(`Verifying OTP for: ${email}`);
  
  // Find and validate OTP
  const { data: otpData, error: otpError } = await supabaseService
    .from('secret_kitchens_otp_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('consumed', false)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (otpError || !otpData) {
    throw new Error('Invalid or expired verification code');
  }
  
  // Mark OTP as consumed
  await supabaseService
    .from('secret_kitchens_otp_codes')
    .update({ consumed: true })
    .eq('id', otpData.id);
  
  // Check if user already exists
  const { data: existingUser, error: userCheckError } = await supabaseService.auth.admin.getUserByEmail(email);
  
  let userId: string;
  
  if (userCheckError || !existingUser.user) {
    // Create new user
    console.log(`Creating new Secret Kitchens user: ${email}`);
    
    const { data: newUser, error: createError } = await supabaseService.auth.admin.createUser({
      email,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        user_type: 'secret_kitchens'
      }
    });
    
    if (createError || !newUser.user) {
      console.error('User creation error:', createError);
      throw new Error('Failed to create user account');
    }
    
    userId = newUser.user.id;
    console.log(`New user created with ID: ${userId}`);
  } else {
    userId = existingUser.user.id;
    console.log(`Existing user found with ID: ${userId}`);
  }
  
  // Generate access token for the user
  const { data: sessionData, error: sessionError } = await supabaseService.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  
  if (sessionError || !sessionData) {
    console.error('Session generation error:', sessionError);
    throw new Error('Failed to generate session');
  }
  
  // Update Secret Kitchens access record
  const { error: updateError } = await supabaseService.rpc('update_secret_kitchen_first_access', {
    user_email: email
  });
  
  if (updateError) {
    console.log('Warning: Failed to update access record:', updateError);
  }
  
  console.log(`Verification successful for: ${email}`);
  
  return {
    success: true,
    access_token: sessionData.properties?.access_token,
    refresh_token: sessionData.properties?.refresh_token,
    user: {
      id: userId,
      email,
      user_metadata: {
        user_type: 'secret_kitchens'
      }
    }
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }
  
  try {
    const { email, action, code }: AuthRequest = await req.json();
    
    if (!email || !action) {
      throw new Error('Email and action are required');
    }
    
    let result;
    
    if (action === 'send_otp') {
      result = await handleSendOTP(email);
    } else if (action === 'verify_otp') {
      if (!code) {
        throw new Error('Verification code is required');
      }
      result = await handleVerifyOTP(email, code);
    } else {
      throw new Error('Invalid action');
    }
    
    return new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
    
  } catch (error: any) {
    console.error('Secret Kitchens auth error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Authentication failed' 
    }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
  }
});