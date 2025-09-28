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
    const { userHandle } = await req.json();
    if (!userHandle) throw new Error('Missing userHandle');

    console.log('Clearing WebAuthn data for userHandle:', userHandle);

    // Call the database function to clear all WebAuthn data
    const { error } = await supabase.rpc('clear_webauthn_data_for_handle', {
      user_handle_input: userHandle
    });

    if (error) throw error;

    console.log('Successfully cleared WebAuthn data for:', userHandle);

    return new Response(JSON.stringify({
      success: true,
      message: 'WebAuthn data cleared successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('clear-webauthn-data error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});