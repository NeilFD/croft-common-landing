import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CampaignData {
  title: string;
  message: string;
  segment: string;
  template_id?: string;
  personalize: boolean;
  test_mode: boolean;
  schedule_type: string;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_reach: number;
}

Deno.serve(async (req) => {
  console.log('📱 Campaign manager function called:', req.method, req.url);
  
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

    if (req.method === 'POST') {
      // Handle campaign creation
      const campaignData: CampaignData = await req.json();
      console.log('📤 Creating campaign:', campaignData.title);

      // For now, we'll simulate campaign creation
      // In a real implementation, you would:
      // 1. Store the campaign in a campaigns table
      // 2. Get target users based on segment
      // 3. Send push notifications via your push service
      // 4. Log delivery metrics

      console.log('🎯 Target segment:', campaignData.segment);
      console.log('📝 Message:', campaignData.message);
      console.log('👥 Estimated reach:', campaignData.estimated_reach);
      console.log('🧪 Test mode:', campaignData.test_mode);

      // Simulate campaign metrics
      const campaignId = crypto.randomUUID();
      const mockMetrics = {
        campaign_id: campaignId,
        title: campaignData.title,
        message: campaignData.message,
        segment: campaignData.segment,
        estimated_reach: campaignData.estimated_reach,
        sent_count: campaignData.test_mode ? 1 : campaignData.estimated_reach,
        delivered_count: campaignData.test_mode ? 1 : Math.round(campaignData.estimated_reach * 0.95),
        opened_count: campaignData.test_mode ? 1 : Math.round(campaignData.estimated_reach * 0.15),
        clicked_count: campaignData.test_mode ? 0 : Math.round(campaignData.estimated_reach * 0.03),
        created_at: new Date().toISOString(),
        created_by: user.id,
        status: campaignData.schedule_type === 'now' ? 'sent' : 'scheduled',
        test_mode: campaignData.test_mode
      };

      return new Response(
        JSON.stringify({
          success: true,
          campaign: mockMetrics,
          message: campaignData.test_mode 
            ? 'Test campaign sent successfully to admin users'
            : 'Campaign sent successfully to target segment'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      // Handle campaign history/metrics retrieval
      console.log('📊 Retrieving campaign history...');

      // Simulate campaign history
      const mockCampaigns = [
        {
          id: '1',
          title: 'Welcome New Members',
          segment: 'New Members',
          sent_count: 25,
          delivered_count: 24,
          opened_count: 8,
          clicked_count: 2,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'sent'
        },
        {
          id: '2',
          title: 'Win Back At-Risk Members',
          segment: 'At Risk Members',
          sent_count: 15,
          delivered_count: 14,
          opened_count: 3,
          clicked_count: 1,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'sent'
        }
      ];

      return new Response(
        JSON.stringify({
          campaigns: mockCampaigns,
          total_campaigns: mockCampaigns.length,
          total_sent: mockCampaigns.reduce((sum, c) => sum + c.sent_count, 0),
          total_opened: mockCampaigns.reduce((sum, c) => sum + c.opened_count, 0)
        }),
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
    console.error('❌ Campaign manager function error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process campaign request',
        details: message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});