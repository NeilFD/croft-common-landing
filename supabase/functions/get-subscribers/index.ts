import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase clients
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated and has domain access
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create admin client for accessing all data
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get active push subscriptions
    const { data: subscriptions, error: subError } = await adminClient
      .from('push_subscriptions')
      .select('user_id, platform, created_at, last_seen')
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    // Group subscriptions by user
    const userMap = new Map();
    
    for (const sub of subscriptions || []) {
      const key = sub.user_id || 'unknown';
      
      if (!userMap.has(key)) {
        userMap.set(key, {
          user_id: sub.user_id,
          email: null,
          first_name: null,
          last_name: null,
          subscriber_name: null,
          platform: sub.platform,
          created_at: sub.created_at,
          last_seen: sub.last_seen,
          device_count: 1,
        });
      } else {
        const existing = userMap.get(key);
        existing.device_count++;
        if (sub.created_at < existing.created_at) {
          existing.created_at = sub.created_at;
        }
        if (sub.last_seen && (!existing.last_seen || sub.last_seen > existing.last_seen)) {
          existing.last_seen = sub.last_seen;
        }
      }
    }

    // Get user IDs that aren't unknown
    const userIds = Array.from(userMap.keys()).filter(id => id !== 'unknown');
    
    if (userIds.length > 0) {
      // Get user emails from auth.users (only admin client can access this)
      const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers();
      if (authUsersError) {
        console.error('Error fetching auth users:', authUsersError);
      } else {
        // Create a map of user_id to email
        const emailMap = new Map();
        for (const authUser of authUsers.users || []) {
          emailMap.set(authUser.id, authUser.email);
        }
        
        // Update userMap with emails
        for (const [userId, subscriber] of userMap) {
          if (userId !== 'unknown' && emailMap.has(userId)) {
            subscriber.email = emailMap.get(userId);
          }
        }
      }

      // Get profiles
      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        for (const profile of profiles || []) {
          const subscriber = userMap.get(profile.user_id);
          if (subscriber) {
            subscriber.first_name = profile.first_name;
            subscriber.last_name = profile.last_name;
          }
        }
      }

      // Get subscriber names from subscribers table
      const { data: subscribersData, error: subscribersError } = await adminClient
        .from('subscribers')
        .select('email, name');

      if (subscribersError) {
        console.error('Error fetching subscribers:', subscribersError);
      } else {
        // Match subscriber names by email
        for (const subscriberData of subscribersData || []) {
          for (const [, subscriber] of userMap) {
            if (subscriber.email === subscriberData.email && !subscriber.subscriber_name) {
              subscriber.subscriber_name = subscriberData.name;
              break;
            }
          }
        }
      }
    }

    // Convert to array and sort
    const result = Array.from(userMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-subscribers function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});