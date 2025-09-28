import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  console.log('🚀 Member analytics function called:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Initializing Supabase client...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    console.log('🔍 Verifying user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Check if user is admin by checking domain directly
    console.log('🔒 Checking admin privileges for email:', user.email);
    
    if (!user.email) {
      console.error('❌ No email in user object');
      return new Response(
        JSON.stringify({ error: 'User email required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check domain directly
    const userDomain = user.email.split('@')[1];
    const { data: domainCheck, error: domainError } = await supabase
      .from('allowed_domains')
      .select('domain')
      .eq('domain', userDomain)
      .single();
    
    if (domainError || !domainCheck) {
      console.error('❌ Domain not allowed:', userDomain, domainError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Domain allowed:', userDomain);

    // Query member analytics data using service role to bypass RLS
    console.log('📊 Fetching member analytics data...');
    const { data: analytics, error } = await supabase.rpc('get_member_analytics');

    if (error) {
      console.error('❌ Error fetching analytics:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analytics', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Analytics data fetched successfully:', analytics?.length || 0, 'records');

    return new Response(
      JSON.stringify({ analytics }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in member-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});