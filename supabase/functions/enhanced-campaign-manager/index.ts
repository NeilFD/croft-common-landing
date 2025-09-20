import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CampaignData {
  title: string;
  message: string;
  segment_id?: string;
  segment_filters?: any;
  template_id?: string;
  personalize: boolean;
  test_mode: boolean;
  schedule_type: string;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_reach: number;
}

Deno.serve(async (req) => {
  console.log('🚀 Enhanced campaign manager function called:', req.method, req.url);
  
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

    if (req.method === 'POST') {
      const campaignData: CampaignData = await req.json();
      console.log('📤 Creating enhanced campaign:', campaignData.title);

      // Create campaign record
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          title: campaignData.title,
          message: campaignData.message,
          segment_id: campaignData.segment_id,
          segment_filters: campaignData.segment_filters,
          template_id: campaignData.template_id,
          personalize: campaignData.personalize,
          test_mode: campaignData.test_mode,
          schedule_type: campaignData.schedule_type,
          scheduled_date: campaignData.scheduled_date,
          scheduled_time: campaignData.scheduled_time,
          estimated_reach: campaignData.estimated_reach,
          created_by: user.id,
          status: campaignData.schedule_type === 'now' ? 'sent' : 'scheduled'
        })
        .select()
        .single();

      if (campaignError) {
        console.error('❌ Error creating campaign:', campaignError);
        throw campaignError;
      }

      console.log('✅ Campaign created with ID:', campaign.id);

      // If sending now, trigger the push notification
      if (campaignData.schedule_type === 'now') {
        const pushResult = await sendCampaignPushNotifications(supabase, campaign, user.id, authHeader);
        
        // Update campaign with actual metrics
        await supabase
          .from('campaigns')
          .update({
            sent_count: pushResult.sent_count,
            delivered_count: pushResult.delivered_count,
            sent_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        return new Response(
          JSON.stringify({
            success: true,
            campaign: { ...campaign, ...pushResult },
            message: campaignData.test_mode 
              ? 'Test campaign sent successfully to admin users'
              : `Campaign sent successfully to ${pushResult.sent_count} recipients`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          campaign,
          message: 'Campaign scheduled successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const campaignId = url.searchParams.get('campaign_id');

      if (campaignId) {
        // Get specific campaign with analytics
        console.log('📊 Fetching campaign analytics for:', campaignId);
        
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (campaignError) {
          throw campaignError;
        }

        // Get campaign analytics
        const { data: analytics, error: analyticsError } = await supabase
          .from('campaign_analytics')
          .select('*')
          .eq('campaign_id', campaignId);

        if (analyticsError) {
          console.error('Error fetching analytics:', analyticsError);
        }

        // Calculate performance metrics
        const performance = calculateCampaignPerformance(analytics || []);

        return new Response(
          JSON.stringify({
            campaign,
            analytics: analytics || [],
            performance
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        // Get campaign history
        console.log('📊 Retrieving campaign history...');

        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (campaignsError) {
          throw campaignsError;
        }

        // Get summary metrics
        const totalCampaigns = campaigns.length;
        const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
        const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
        const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);

        return new Response(
          JSON.stringify({
            campaigns,
            summary: {
              total_campaigns: totalCampaigns,
              total_sent: totalSent,
              total_opened: totalOpened,
              total_clicked: totalClicked,
              avg_open_rate: totalSent > 0 ? (totalOpened / totalSent * 100) : 0,
              avg_click_rate: totalSent > 0 ? (totalClicked / totalSent * 100) : 0
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Enhanced campaign manager function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process campaign request',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function sendCampaignPushNotifications(supabase: any, campaign: any, userId: string, authHeader: string) {
  console.log('📱 Sending push notifications for campaign:', campaign.id);

  try {
    // Get target users based on segment or filters
    let targetUserIds: string[] = [];

    if (campaign.segment_id) {
      // Get users from saved segment
      const { data: segmentMembers, error } = await supabase
        .from('segment_member_previews')
        .select('user_id')
        .eq('segment_id', campaign.segment_id);

      if (error) {
        console.error('Error fetching segment members:', error);
      } else {
        targetUserIds = segmentMembers.map((m: any) => m.user_id);
      }
    } else if (campaign.segment_filters) {
      // Get users from dynamic filters using analytics function
      const { data: analytics, error } = await supabase.rpc('get_advanced_member_analytics', {
        p_date_start: campaign.segment_filters.dateRange?.start || null,
        p_date_end: campaign.segment_filters.dateRange?.end || null,
        p_min_age: campaign.segment_filters.ageRange?.min || null,
        p_max_age: campaign.segment_filters.ageRange?.max || null,
        p_interests: campaign.segment_filters.interests || null,
        p_venue_slugs: campaign.segment_filters.venueAreas || null,
        p_min_spend: campaign.segment_filters.spendRange?.min || null,
        p_max_spend: campaign.segment_filters.spendRange?.max || null,
        p_tier_badges: campaign.segment_filters.tierBadges || null
      });

      if (error) {
        console.error('Error fetching filtered members:', error);
      } else {
        targetUserIds = analytics.map((m: any) => m.user_id);
      }
    }

    console.log('🎯 Target audience size:', targetUserIds.length);

    // Prepare push notification payload
    const pushPayload = {
      title: campaign.title,
      body: campaign.message,
      scope: campaign.test_mode ? 'self' : 'all',
      user_ids: targetUserIds,
      dry_run: campaign.test_mode,
      personalize: campaign.personalize,
      campaign_id: campaign.id
    };

    // Call send-push function with user authorization
    const pushResponse = await supabase.functions.invoke('send-push', {
      body: pushPayload,
      headers: {
        'Authorization': authHeader
      }
    });

    if (pushResponse.error) {
      console.error('❌ Error sending push notifications:', pushResponse.error);
      throw pushResponse.error;
    }

    const pushResult = pushResponse.data;
    console.log('✅ Push notifications sent:', pushResult);

    // Record campaign analytics
    for (const userId of targetUserIds) {
      await supabase
        .from('campaign_analytics')
        .insert({
          campaign_id: campaign.id,
          user_id: userId,
          event_type: 'sent',
          metadata: { test_mode: campaign.test_mode }
        });
    }

    return {
      sent_count: pushResult.success || 0,
      delivered_count: pushResult.success || 0, // Assume delivered for now
      failed_count: pushResult.failed || 0
    };

  } catch (error) {
    console.error('❌ Error in sendCampaignPushNotifications:', error);
    return {
      sent_count: 0,
      delivered_count: 0,
      failed_count: 1
    };
  }
}

function calculateCampaignPerformance(analytics: any[]) {
  const events = analytics.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {});

  const sent = events.sent || 0;
  const delivered = events.delivered || 0;
  const opened = events.opened || 0;
  const clicked = events.clicked || 0;
  const visitAfter = events.visit_after || 0;

  return {
    sent,
    delivered,
    opened,
    clicked,
    visit_after: visitAfter,
    delivery_rate: sent > 0 ? (delivered / sent * 100) : 0,
    open_rate: delivered > 0 ? (opened / delivered * 100) : 0,
    click_rate: delivered > 0 ? (clicked / delivered * 100) : 0,
    conversion_rate: clicked > 0 ? (visitAfter / clicked * 100) : 0
  };
}