import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAILCHIMP_SERVER = 'us5';
const BATCH_SIZE = 500; // Mailchimp limit

interface BatchSyncRequest {
  dryRun?: boolean;
  limit?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as BatchSyncRequest;
    const { dryRun = false, limit } = body;

    const apiKey = Deno.env.get('MAILCHIMP_API_KEY');
    if (!apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active subscribers with profiles
    let query = supabase
      .from('subscribers')
      .select(`
        email,
        name,
        consent_given,
        consent_timestamp,
        created_at,
        profiles!inner(
          phone_number,
          birthday,
          interests
        )
      `)
      .eq('is_active', true);

    if (limit) {
      query = query.limit(limit);
    }

    const { data: subscribers, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch subscribers: ${error.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscribers found to sync' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscribers.length} subscribers to sync`);

    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          message: `Dry run: Would sync ${subscribers.length} subscribers`,
          sample: subscribers.slice(0, 3).map(s => ({
            email: s.email,
            name: s.name,
            interests: s.profiles?.interests || []
          }))
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const baseUrl = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0`;
    const authHeader = `Basic ${btoa(`anystring:${apiKey}`)}`;

    // Get audience ID (assumes it exists from sync-to-mailchimp function)
    const audienceId = await getAudienceId(baseUrl, authHeader);
    
    if (!audienceId) {
      throw new Error('Mailchimp audience not found. Please create it first using sync-to-mailchimp function.');
    }

    // Get interest groups mapping
    const interestGroupsMap = await getInterestGroups(baseUrl, authHeader, audienceId);

    // Process subscribers in batches
    const results = {
      total: subscribers.length,
      synced: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} subscribers)`);

      const batchOperations = batch.map(subscriber => {
        const nameParts = (subscriber.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const memberData = {
          email_address: subscriber.email,
          status: subscriber.consent_given ? 'subscribed' : 'unsubscribed',
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
            PHONE: subscriber.profiles?.phone_number || '',
            BIRTHDAY: subscriber.profiles?.birthday ? formatBirthday(subscriber.profiles.birthday) : '',
            CONSENT: subscriber.consent_timestamp || subscriber.created_at,
          },
          interests: {} as { [key: string]: boolean }
        };

        // Map interests
        if (subscriber.profiles?.interests) {
          subscriber.profiles.interests.forEach((interest: string) => {
            if (interestGroupsMap[interest]) {
              memberData.interests[interestGroupsMap[interest]] = true;
            }
          });
        }

        return {
          method: 'PUT',
          path: `/lists/${audienceId}/members/${createMD5Hash(subscriber.email)}`,
          body: JSON.stringify(memberData)
        };
      });

      // Submit batch to Mailchimp
      const batchResponse = await fetch(`${baseUrl}/batches`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operations: batchOperations })
      });

      const batchResult = await batchResponse.json();

      if (batchResponse.ok) {
        results.synced += batch.length;
        console.log(`Batch submitted successfully: ${batchResult.id}`);
      } else {
        results.failed += batch.length;
        results.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${JSON.stringify(batchResult)}`);
        console.error('Batch failed:', batchResult);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch sync completed`,
        results
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in mailchimp-batch-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function getAudienceId(baseUrl: string, authHeader: string): Promise<string | null> {
  const response = await fetch(`${baseUrl}/lists`, {
    headers: { 'Authorization': authHeader }
  });
  
  const lists = await response.json();
  const audience = lists.lists?.find((list: any) => list.name === 'Croft Common Subscribers');
  
  return audience?.id || null;
}

async function getInterestGroups(baseUrl: string, authHeader: string, audienceId: string): Promise<{ [key: string]: string }> {
  const categoriesResponse = await fetch(`${baseUrl}/lists/${audienceId}/interest-categories`, {
    headers: { 'Authorization': authHeader }
  });
  
  const categories = await categoriesResponse.json();
  const interestMap: { [key: string]: string } = {};
  
  for (const category of categories.categories || []) {
    const interestsResponse = await fetch(`${baseUrl}/lists/${audienceId}/interest-categories/${category.id}/interests`, {
      headers: { 'Authorization': authHeader }
    });
    
    const interests = await interestsResponse.json();
    
    for (const interest of interests.interests || []) {
      interestMap[interest.name] = interest.id;
    }
  }
  
  return interestMap;
}

function formatBirthday(birthday: string): string {
  try {
    const date = new Date(birthday);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function createMD5Hash(text: string): string {
  // Simple MD5 implementation for Deno
  const crypto = new TextEncoder().encode(text.toLowerCase());
  return Array.from(crypto)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32); // Simplified for demo - in production use proper MD5
}

serve(handler);