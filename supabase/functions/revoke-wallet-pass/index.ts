import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current pass data
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('wallet_pass_serial_number, wallet_pass_url')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileData?.wallet_pass_serial_number) {
      return new Response(JSON.stringify({ error: 'No active pass found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark pass as revoked
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        wallet_pass_revoked: true,
        wallet_pass_url: null
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error revoking pass:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to revoke pass' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // In a full implementation, you would also:
    // 1. Send revocation notification to Apple's push notification service
    // 2. Delete the pass file from storage
    // 3. Update any pass registry systems

    console.log('Pass revoked for user:', user.id, 'Serial:', profileData.wallet_pass_serial_number);

    return new Response(JSON.stringify({
      success: true,
      message: 'Apple Wallet pass revoked successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in revoke-wallet-pass function:', error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});