import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SegmentFilters {
  dateRange?: { start: string; end: string };
  ageRange?: { min: number; max: number };
  interests?: string[];
  interestsLogic?: 'match_all' | 'match_any';
  venueAreas?: string[];
  venuePreferences?: string[];
  venuePreferencesLogic?: 'match_all' | 'match_any';
  spendRange?: { min: number; max: number };
  tierBadges?: string[];
  visitHistory?: {
    dayOfWeek?: string[];
    timeOfMonth?: string[];
    frequency?: { min: number; max: number };
  };
  itemPreferences?: string[];
}

interface CreateSegmentRequest {
  name: string;
  description?: string;
  filters: SegmentFilters;
  preview_only?: boolean;
}

Deno.serve(async (req) => {
  console.log('🎯 Campaign segments function called:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    if (req.method === 'GET') {
      console.log('📊 Fetching campaign segments...');
      
      // Get all saved segments
      const { data: segments, error: segmentsError } = await supabase
        .from('campaign_segments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (segmentsError) {
        console.error('❌ Error fetching segments:', segmentsError);
        throw segmentsError;
      }

      return new Response(
        JSON.stringify({ segments }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST') {
      const requestData: CreateSegmentRequest = await req.json();
      console.log('✨ Creating new segment:', requestData.name);

      // Preview segment to get member count
      const memberCount = await previewSegment(supabase, requestData.filters);
      console.log('👥 Segment preview count:', memberCount);

      // Calculate average spend for the segment
      const avgSpend = await calculateSegmentAvgSpend(supabase, requestData.filters);
      console.log('💰 Segment average spend:', avgSpend);

      // If this is a preview-only request, return preview data without creating segment
      if (requestData.preview_only) {
        return new Response(
          JSON.stringify({ 
            member_count: memberCount,
            avg_spend: avgSpend,
            message: 'Preview data calculated'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create the segment
      const { data: segment, error: createError } = await supabase
        .from('campaign_segments')
        .insert({
          name: requestData.name,
          description: requestData.description,
          filters: requestData.filters,
          member_count: memberCount,
          avg_spend: avgSpend,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating segment:', createError);
        throw createError;
      }

      // Generate and cache segment member list
      await generateSegmentMembers(supabase, segment.id, requestData.filters);

      return new Response(
        JSON.stringify({ 
          segment,
          message: 'Segment created successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'PUT') {
      const url = new URL(req.url);
      const segmentId = url.searchParams.get('id');
      
      if (!segmentId) {
        return new Response(
          JSON.stringify({ error: 'Segment ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const requestData: CreateSegmentRequest = await req.json();
      console.log('📝 Updating segment:', segmentId);

      // Preview updated segment
      const memberCount = await previewSegment(supabase, requestData.filters);
      const avgSpend = await calculateSegmentAvgSpend(supabase, requestData.filters);

      // Update the segment
      const { data: segment, error: updateError } = await supabase
        .from('campaign_segments')
        .update({
          name: requestData.name,
          description: requestData.description,
          filters: requestData.filters,
          member_count: memberCount,
          avg_spend: avgSpend,
          updated_at: new Date().toISOString()
        })
        .eq('id', segmentId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating segment:', updateError);
        throw updateError;
      }

      // Regenerate segment member list
      await generateSegmentMembers(supabase, segmentId, requestData.filters);

      return new Response(
        JSON.stringify({ 
          segment,
          message: 'Segment updated successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const segmentId = url.searchParams.get('id');
      
      if (!segmentId) {
        return new Response(
          JSON.stringify({ error: 'Segment ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('🗑️ Deleting segment:', segmentId);

      // Soft delete by setting is_active to false
      const { error: deleteError } = await supabase
        .from('campaign_segments')
        .update({ is_active: false })
        .eq('id', segmentId);

      if (deleteError) {
        console.error('❌ Error deleting segment:', deleteError);
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ message: 'Segment deleted successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Campaign segments function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process segment request',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function previewSegment(supabase: any, filters: SegmentFilters): Promise<number> {
  try {
    // Call the enhanced analytics function with filters
    const { data: analytics, error } = await supabase.rpc('get_advanced_member_analytics', {
      p_date_start: filters.dateRange?.start || null,
      p_date_end: filters.dateRange?.end || null,
      p_min_age: filters.ageRange?.min || null,
      p_max_age: filters.ageRange?.max || null,
      p_interests: filters.interests || null,
      p_venue_slugs: filters.venueAreas || null,
      p_min_spend: filters.spendRange?.min || null,
      p_max_spend: filters.spendRange?.max || null,
      p_tier_badges: filters.tierBadges || null
    });

    if (error) {
      console.error('Error in segment preview:', error);
      return 0;
    }

    return analytics?.length || 0;
  } catch (error) {
    console.error('Error previewing segment:', error);
    return 0;
  }
}

async function calculateSegmentAvgSpend(supabase: any, filters: SegmentFilters): Promise<number> {
  try {
    const { data: analytics, error } = await supabase.rpc('get_advanced_member_analytics', {
      p_date_start: filters.dateRange?.start || null,
      p_date_end: filters.dateRange?.end || null,
      p_min_age: filters.ageRange?.min || null,
      p_max_age: filters.ageRange?.max || null,
      p_interests: filters.interests || null,
      p_venue_slugs: filters.venueAreas || null,
      p_min_spend: filters.spendRange?.min || null,
      p_max_spend: filters.spendRange?.max || null,
      p_tier_badges: filters.tierBadges || null
    });

    if (error || !analytics || analytics.length === 0) {
      return 0;
    }

    const totalSpend = analytics.reduce((sum: number, member: any) => sum + (member.total_spend || 0), 0);
    return totalSpend / analytics.length;
  } catch (error) {
    console.error('Error calculating segment avg spend:', error);
    return 0;
  }
}

async function generateSegmentMembers(supabase: any, segmentId: string, filters: SegmentFilters): Promise<void> {
  try {
    // Clear existing segment members
    await supabase
      .from('segment_member_previews')
      .delete()
      .eq('segment_id', segmentId);

    // Get filtered members
    const { data: analytics, error } = await supabase.rpc('get_advanced_member_analytics', {
      p_date_start: filters.dateRange?.start || null,
      p_date_end: filters.dateRange?.end || null,
      p_min_age: filters.ageRange?.min || null,
      p_max_age: filters.ageRange?.max || null,
      p_interests: filters.interests || null,
      p_venue_slugs: filters.venueAreas || null,
      p_min_spend: filters.spendRange?.min || null,
      p_max_spend: filters.spendRange?.max || null,
      p_tier_badges: filters.tierBadges || null
    });

    if (error || !analytics) {
      console.error('Error getting analytics for segment members:', error);
      return;
    }

    // Insert segment members
    const segmentMembers = analytics.map((member: any) => ({
      segment_id: segmentId,
      user_id: member.user_id
    }));

    if (segmentMembers.length > 0) {
      await supabase
        .from('segment_member_previews')
        .insert(segmentMembers);
    }

    console.log(`✅ Generated ${segmentMembers.length} members for segment ${segmentId}`);
  } catch (error) {
    console.error('Error generating segment members:', error);
  }
}