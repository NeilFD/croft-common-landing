import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { userHandle, email } = await req.json();
    if (!userHandle) throw new Error('Missing userHandle');

    console.log('Creating session for userHandle:', userHandle);

    // Check if we already have a user linked to this userHandle
    const { data: existingLink, error: linkError } = await supabase
      .from('webauthn_user_links')
      .select('user_id')
      .eq('user_handle', userHandle)
      .single();

    if (linkError && linkError.code !== 'PGRST116') {
      throw linkError;
    }

    let userId: string;

    if (existingLink) {
      // User already exists and is linked
      userId = existingLink.user_id;
      console.log('Found existing linked user:', userId);
      
      // Update last_used_at
      await supabase
        .from('webauthn_user_links')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_handle', userHandle);
        
    } else if (email) {
      // First time - need to create or find user by email and link them
      console.log('Creating/finding user for email:', email);
      
      // Check if user already exists by email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === email);
      
      if (existingUser) {
        userId = existingUser.id;
        console.log('Found existing user by email:', userId);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            webauthn_registration: true
          }
        });
        
        if (createError) throw createError;
        userId = newUser.user.id;
        console.log('Created new user:', userId);
      }
      
      // Link the user handle to the user
      await supabase
        .from('webauthn_user_links')
        .upsert({
          user_handle: userHandle,
          user_id: userId,
          last_used_at: new Date().toISOString()
        });
        
    } else {
      throw new Error('No existing link found and no email provided');
    }

    // Generate a session for this user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email || 'placeholder@example.com', // We need an email for the API, but we'll override
      options: {
        redirectTo: `${new URL(req.url).origin}/`
      }
    });

    if (sessionError) throw sessionError;

    // Extract the access token and refresh token from the generated link
    // The link format is: {redirectTo}#access_token=...&expires_in=...&refresh_token=...&token_type=bearer
    const url = new URL(sessionData.properties.action_link);
    const fragment = url.hash.substring(1); // Remove the '#'
    const params = new URLSearchParams(fragment);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (!accessToken || !refreshToken) {
      throw new Error('Failed to extract tokens from generated link');
    }

    console.log('Successfully created session for user:', userId);

    return new Response(JSON.stringify({
      success: true,
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: parseInt(expiresIn || '3600'),
        token_type: 'bearer',
        user: { id: userId }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('webauthn-create-session error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error?.message ?? error) 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});