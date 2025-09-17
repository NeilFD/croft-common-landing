import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create anon client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('🔑 SEED: Authenticated user:', user.id);

    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check if user already has an active unused grace week
    const { data: existingGrace, error: checkError } = await serviceRoleClient
      .from('streak_grace_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ SEED: Error checking existing grace:', checkError);
      throw checkError;
    }

    if (existingGrace) {
      console.log('✅ SEED: User already has unused grace week:', existingGrace.id);
      return new Response(
        JSON.stringify({ success: true, existing: true, grace_week: existingGrace }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to get Monday of current week
    const getCurrentWeekStart = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      const monday = new Date(now.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    // Create baseline grace week
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 6); // 6 months from now

    const { data: newGrace, error: insertError } = await serviceRoleClient
      .from('streak_grace_periods')
      .insert({
        user_id: user.id,
        grace_type: 'baseline',
        week_start_date: getCurrentWeekStart(),
        is_used: false,
        expires_date: expireDate.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ SEED: Failed to create grace week:', insertError);
      throw insertError;
    }

    console.log('✅ SEED: Created baseline grace week:', newGrace.id);

    return new Response(
      JSON.stringify({ success: true, created: true, grace_week: newGrace }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SEED: Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});