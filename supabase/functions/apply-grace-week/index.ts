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

    // Get request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      throw new Error('Invalid JSON body');
    }

    const { missedWeekStart } = requestBody;
    if (!missedWeekStart) {
      throw new Error('Missing missedWeekStart parameter');
    }

    console.log('🛡️ APPLY GRACE: User', user.id, 'applying grace to week', missedWeekStart);

    // Create service role client to bypass RLS
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find an unused grace week for this user
    const { data: availableGrace, error: findError } = await serviceRoleClient
      .from('streak_grace_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (findError || !availableGrace) {
      console.error('❌ APPLY GRACE: No available grace weeks found:', findError);
      throw new Error('No available grace weeks');
    }

    console.log('✅ APPLY GRACE: Found available grace week:', availableGrace.id);

    // Mark the grace week as used
    const { error: updateError } = await serviceRoleClient
      .from('streak_grace_periods')
      .update({
        is_used: true,
        used_date: new Date().toISOString(),
        week_applied_to: missedWeekStart
      })
      .eq('id', availableGrace.id);

    if (updateError) {
      console.error('❌ APPLY GRACE: Failed to mark grace week as used:', updateError);
      throw updateError;
    }

    console.log('✅ APPLY GRACE: Grace week marked as used');

    // Also mark the missed week as complete in streak_weeks
    const { error: streakWeekError } = await serviceRoleClient
      .from('streak_weeks')
      .upsert({
        user_id: user.id,
        week_start: missedWeekStart,
        is_complete: true,
        completed_at: new Date().toISOString(),
        protected_by_grace: true
      }, {
        onConflict: 'user_id,week_start'
      });

    if (streakWeekError) {
      console.error('❌ APPLY GRACE: Failed to mark week as complete:', streakWeekError);
      throw streakWeekError;
    }

    console.log('✅ APPLY GRACE: Successfully applied grace week to', missedWeekStart);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Grace week applied to ${missedWeekStart}`,
        grace_week_id: availableGrace.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ APPLY GRACE: Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});