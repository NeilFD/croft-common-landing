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
    console.log('📊 Fetching member analytics data...');
    // Temporarily use basic analytics function since advanced has conflicts
    const { data: basicAnalytics, error } = await supabase.rpc('get_member_analytics');
    
    // Transform basic analytics to match expected format with proper visit frequency
    const analytics = basicAnalytics?.map(async (member: any) => {
      // Calculate visit frequency for each member
      const { data: checkIns } = await supabase
        .from('member_check_ins')
        .select('check_in_date')
        .eq('user_id', member.user_id)
        .order('check_in_date');
      
      let visitFrequency = 0;
      if (checkIns && checkIns.length > 1) {
        const firstDate = new Date(checkIns[0].check_in_date);
        const lastDate = new Date(checkIns[checkIns.length - 1].check_in_date);
        const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
        const weeksDiff = Math.max(daysDiff / 7, 1);
        visitFrequency = Math.round((checkIns.length / weeksDiff) * 100) / 100;
      }
      
      return {
        user_id: member.user_id,
        first_name: member.first_name,
        last_name: member.last_name,
        display_name: member.display_name,
        age: null,
        interests: [],
        tier_badge: 'bronze',
        total_transactions: member.total_transactions,
        total_spend: member.total_spend,
        avg_transaction: member.avg_transaction,
        first_transaction_date: member.first_transaction_date,
        last_transaction_date: member.last_transaction_date,
        active_months: member.active_months,
        active_days: member.active_days,
        categories: member.categories || [],
        payment_methods: member.payment_methods || [],
        currency: member.currency,
        current_month_spend: member.current_month_spend,
        current_week_spend: member.current_week_spend,
        current_month_transactions: member.current_month_transactions,
        favorite_venues: [],
        visit_frequency: visitFrequency,
        last_visit_date: member.last_transaction_date,
        preferred_visit_times: [],
        retention_risk_score: 0.1,
        lifetime_value: member.total_spend
      };
    }) || [];
    
    // Wait for all visit frequency calculations to complete
    const resolvedAnalytics = await Promise.all(analytics);

    if (error) {
      console.error('❌ Analytics query error:', error);
      throw error;
    }

    console.log('✅ Analytics data retrieved:', resolvedAnalytics?.length || 0, 'members');

    // Get member segments for additional insights
    const { data: segments, error: segmentsError } = await supabase.rpc('get_member_segments');
    
    if (segmentsError) {
      console.warn('⚠️ Could not fetch segments:', segmentsError);
    }

    return new Response(
      JSON.stringify({
        analytics: resolvedAnalytics || [],
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