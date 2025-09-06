import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('👤 Member deep-dive function called:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Check domain access
    const userEmail = user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userDomain = userEmail.split('@')[1];
    const { data: domainData, error: domainError } = await supabase
      .from('allowed_domains')
      .select('domain')
      .eq('domain', userDomain)
      .single();

    if (domainError || !domainData) {
      console.error('❌ Domain not allowed:', userDomain);
      return new Response(
        JSON.stringify({ error: 'Access denied: domain not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get member ID from request
    const url = new URL(req.url);
    const memberId = url.searchParams.get('memberId');
    
    if (!memberId) {
      return new Response(
        JSON.stringify({ error: 'Member ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Fetching deep-dive data for member:', memberId);

    // Call the member deep-dive function
    const { data: deepDiveData, error } = await supabase.rpc('get_member_deep_dive', {
      p_user_id: memberId
    });

    if (error) {
      console.error('❌ Deep-dive query error:', error);
      throw error;
    }

    if (!deepDiveData || deepDiveData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Deep-dive data retrieved for member:', memberId);

    const memberData = deepDiveData[0];

    return new Response(
      JSON.stringify({
        member_id: memberId,
        profile: memberData.profile_data,
        spend_breakdown: memberData.spend_breakdown,
        visit_patterns: memberData.visit_patterns,
        engagement_metrics: memberData.engagement_metrics,
        recent_activity: memberData.recent_activity,
        predictive_insights: memberData.predictive_insights,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Member deep-dive function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch member deep-dive data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});