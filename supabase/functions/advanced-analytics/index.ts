import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface AnalyticsFilters {
  dateStart?: string;
  dateEnd?: string;
  minAge?: number;
  maxAge?: number;
  interests?: string[];
  venueAreas?: string[];
  minSpend?: number;
  maxSpend?: number;
  tierBadges?: string[];
}

Deno.serve(async (req) => {
  console.log('🔍 Advanced analytics function called:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin access
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

    // Check if user has admin privileges (domain check)
    const userEmail = user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userDomain = userEmail.split('@')[1];
    console.log('🔑 Checking domain access for:', userDomain);

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
    console.log('✅ Domain allowed:', userDomain);

    // Parse request body for filters
    let filters: AnalyticsFilters = {};
    if (req.method === 'POST') {
      try {
        filters = await req.json();
        console.log('📊 Received filters:', filters);
      } catch (e) {
        console.log('📊 No filters provided, using defaults');
      }
    }

    // Call the advanced analytics function with filters
    console.log('📊 Fetching advanced member analytics data...');
    const { data: analytics, error } = await supabase.rpc('get_advanced_member_analytics', {
      p_date_start: filters.dateStart ? new Date(filters.dateStart).toISOString().split('T')[0] : null,
      p_date_end: filters.dateEnd ? new Date(filters.dateEnd).toISOString().split('T')[0] : null,
      p_min_age: filters.minAge || null,
      p_max_age: filters.maxAge || null,
      p_interests: filters.interests?.length ? filters.interests : null,
      p_interests_logic: 'match_any',
      p_venue_slugs: filters.venueAreas?.length ? filters.venueAreas : null,
      p_venue_logic: 'match_any',
      p_min_spend: filters.minSpend || null,
      p_max_spend: filters.maxSpend || null,
      p_tier_badges: filters.tierBadges?.length ? filters.tierBadges : null,
      // Additional logic params (defaults)
      p_receipt_activity_period: null,
      p_visit_frequency: null,
      p_recent_activity: null,
      p_activity_logic: 'any_match',
      p_preferred_visit_days: null,
      p_visit_timing: null,
      p_avg_spend_per_visit: null,
      p_behavior_logic: 'any_match',
      p_demographics_logic: 'any_match',
      p_has_uploaded_receipts: null,
      p_push_notifications_enabled: null,
      p_loyalty_engagement: null,
      p_member_status_logic: 'any_match',
      p_master_logic: 'any_section'
    });

    if (error) {
      console.error('❌ Analytics query error:', error);
      throw error;
    }

    console.log('✅ Analytics data retrieved:', analytics?.length || 0, 'members');

    // Get member segments for additional insights
    const { data: segments, error: segmentsError } = await supabase.rpc('get_member_segments');
    
    if (segmentsError) {
      console.warn('⚠️ Could not fetch segments:', segmentsError);
    }

    return new Response(
      JSON.stringify({
        analytics: analytics || [],
        segments: segments || [],
        filters_applied: filters,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Advanced analytics function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch advanced analytics data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});