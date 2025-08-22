import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  email: string;
  name?: string;
  phone?: string;
  birthday?: string;
  interests?: string[];
  consent_given?: boolean;
  consent_timestamp?: string;
  action?: 'create' | 'update' | 'delete' | 'subscribe' | 'unsubscribe' | 'upsert';
}

interface MailchimpMember {
  email_address: string;
  status: string;
  merge_fields: {
    FNAME?: string;
    LNAME?: string;
    PHONE?: string;
    BIRTHDAY?: string;
    CONSENT?: string;
  };
  interests?: { [key: string]: boolean };
}

const MAILCHIMP_SERVER = 'us5';
const AUDIENCE_NAME = 'Croft Common Subscribers';

// Interest categories mapping
const INTEREST_CATEGORIES = [
  'Private Events',
  'Corporate Hospitality', 
  'Wine Tastings',
  'Cocktail Making',
  'Cooking Classes',
  'Beer Tastings',
  'Live Music',
  'Art Exhibitions',
  'Networking Events',
  'Community Projects',
  'Seasonal Celebrations',
  'Educational Workshops',
  'Wellness Programs'
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: SyncRequest;
  
  try {
    console.log('=== SYNC TO MAILCHIMP START ===')
    
    requestBody = await req.json() as SyncRequest;
    console.log('Request payload:', JSON.stringify(requestBody))
    
    const apiKey = Deno.env.get('MAILCHIMP_API_KEY');
    console.log('MAILCHIMP_API_KEY check:', apiKey ? `CONFIGURED (${apiKey.length} chars)` : 'NOT_CONFIGURED')
    
    if (!apiKey) {
      console.error('❌ MAILCHIMP_API_KEY not configured')
      throw new Error('Mailchimp API key not configured');
    }

    const baseUrl = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0`;
    const authHeader = `Basic ${btoa(`anystring:${apiKey}`)}`;
    
    console.log('Mailchimp config:', { baseUrl, serverCode: MAILCHIMP_SERVER })

    // Get or create audience
    console.log('Getting or creating Mailchimp audience...')
    let audienceId;
    try {
      audienceId = await getOrCreateAudience(baseUrl, authHeader);
      console.log('✅ Audience ID obtained:', audienceId)
    } catch (audienceError) {
      console.error('❌ Failed to get/create audience:', audienceError)
      throw new Error(`Audience creation failed: ${audienceError.message}`)
    }
    
    const { email, name, phone, birthday, interests, consent_given, consent_timestamp, action = 'upsert' } = requestBody;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client for sync status updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Handle unsubscribe action
    if (action === 'unsubscribe') {
      try {
        const memberHash = await createMD5Hash(email);
        const memberUrl = `${baseUrl}/lists/${audienceId}/members/${memberHash}`;
        
        const response = await fetch(memberUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'unsubscribed'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Mailchimp unsubscribe error:', errorData);
          
          // Update Supabase with error
          if (supabaseServiceRoleKey) {
            await supabase
              .from('subscribers')
              .update({
                mailchimp_sync_status: 'failed',
                sync_error: `Mailchimp unsubscribe failed: ${errorData.detail || 'Unknown error'}`
              })
              .eq('email', email);
          }
            
          return new Response(
            JSON.stringify({ error: 'Failed to unsubscribe from Mailchimp' }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Update Supabase sync status
        if (supabaseServiceRoleKey) {
          await supabase
            .from('subscribers')
            .update({
              last_mailchimp_sync_at: new Date().toISOString(),
              mailchimp_sync_status: 'synced',
              sync_error: null
            })
            .eq('email', email);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Successfully unsubscribed from Mailchimp',
            email 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } catch (error: any) {
        console.error('Error unsubscribing from Mailchimp:', error);
        
        // Update Supabase with error
        if (supabaseServiceRoleKey) {
          await supabase
            .from('subscribers')
            .update({
              mailchimp_sync_status: 'failed',
              sync_error: error.message || 'Unknown error during unsubscribe'
            })
            .eq('email', email);
        }
          
        return new Response(
          JSON.stringify({ error: 'Failed to unsubscribe from Mailchimp' }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Prepare member data
    const nameParts = (name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const memberData: MailchimpMember = {
      email_address: email,
      status: consent_given !== false ? 'subscribed' : 'unsubscribed', // Default to subscribed unless explicitly false
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: phone || '',
        BIRTHDAY: birthday ? formatBirthday(birthday) : '',
        CONSENT: consent_timestamp || new Date().toISOString(),
      }
    };

    // Handle interests
    if (interests && interests.length > 0) {
      const interestGroupsMap = await getInterestGroups(baseUrl, authHeader, audienceId);
      memberData.interests = {};
      
      interests.forEach(interest => {
        if (interestGroupsMap[interest]) {
          memberData.interests![interestGroupsMap[interest]] = true;
        }
      });
    }

    // Sync to Mailchimp
    const memberHash = await createMD5Hash(email);
    const memberUrl = `${baseUrl}/lists/${audienceId}/members/${memberHash}`;
    
    const response = await fetch(memberUrl, {
      method: action === 'delete' ? 'DELETE' : 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: action === 'delete' ? undefined : JSON.stringify(memberData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Mailchimp API error:', result);
      
      // Update Supabase with error
      if (supabaseServiceRoleKey) {
        await supabase
          .from('subscribers')
          .update({
            mailchimp_sync_status: 'failed',
            sync_error: `Mailchimp API error: ${result.detail || 'Unknown error'}`
          })
          .eq('email', email);
      }
        
      return new Response(
        JSON.stringify({ 
          error: 'Failed to sync to Mailchimp', 
          details: result 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully synced ${email} to Mailchimp`);

    // Update Supabase sync status
    if (supabaseServiceRoleKey) {
      await supabase
        .from('subscribers')
        .update({
          last_mailchimp_sync_at: new Date().toISOString(),
          mailchimp_sync_status: 'synced',
          mailchimp_member_id: result.id,
          sync_error: null
        })
        .eq('email', email);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully ${action === 'create' ? 'created' : action === 'update' ? 'updated' : 'synced'} subscriber in Mailchimp`,
        mailchimp_id: result.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('❌ SYNC TO MAILCHIMP FAILED:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    // Update Supabase with error if possible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      
      if (supabaseServiceRoleKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        await supabase
          .from('subscribers')
          .update({
            mailchimp_sync_status: 'failed',
            sync_error: error.message || 'Unknown sync error'
          })
          .eq('email', requestBody.email);
          
        console.log('Updated subscriber sync status to failed')
      }
    } catch (dbError) {
      console.error('Failed to update sync error in database:', dbError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function getOrCreateAudience(baseUrl: string, authHeader: string): Promise<string> {
  // Check if audience exists
  const listsResponse = await fetch(`${baseUrl}/lists`, {
    headers: { 'Authorization': authHeader }
  });
  
  const lists = await listsResponse.json();
  const existingAudience = lists.lists?.find((list: any) => list.name === AUDIENCE_NAME);
  
  if (existingAudience) {
    console.log(`Using existing audience: ${existingAudience.id}`);
    return existingAudience.id;
  }

  // Create new audience
  const audienceData = {
    name: AUDIENCE_NAME,
    contact: {
      company: 'Croft Common',
      address1: 'Stokes Croft',
      city: 'Bristol',
      state: '',
      zip: 'BS1 3PR',
      country: 'GB'
    },
    permission_reminder: 'You subscribed to receive updates from Croft Common',
    campaign_defaults: {
      from_name: 'Croft Common',
      from_email: 'hello@croftcommon.com',
      subject: 'Updates from Croft Common',
      language: 'en'
    },
    email_type_option: false
  };

  const createResponse = await fetch(`${baseUrl}/lists`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(audienceData)
  });

  const newAudience = await createResponse.json();
  if (!createResponse.ok) {
    throw new Error(`Failed to create audience: ${JSON.stringify(newAudience)}`);
  }

  console.log(`Created new audience: ${newAudience.id}`);
  
  // Set up merge fields
  await setupMergeFields(baseUrl, authHeader, newAudience.id);
  
  // Set up interest groups
  await setupInterestGroups(baseUrl, authHeader, newAudience.id);
  
  return newAudience.id;
}

async function setupMergeFields(baseUrl: string, authHeader: string, audienceId: string) {
  const mergeFields = [
    { name: 'PHONE', tag: 'PHONE', type: 'phone' },
    { name: 'BIRTHDAY', tag: 'BIRTHDAY', type: 'birthday' },
    { name: 'CONSENT', tag: 'CONSENT', type: 'date' }
  ];

  for (const field of mergeFields) {
    await fetch(`${baseUrl}/lists/${audienceId}/merge-fields`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(field)
    });
  }
}

async function setupInterestGroups(baseUrl: string, authHeader: string, audienceId: string) {
  // Create interest category
  const categoryResponse = await fetch(`${baseUrl}/lists/${audienceId}/interest-categories`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Interests',
      type: 'checkboxes'
    })
  });

  const category = await categoryResponse.json();
  if (!categoryResponse.ok) {
    console.error('Failed to create interest category:', category);
    return;
  }

  // Create individual interests
  for (const interest of INTEREST_CATEGORIES) {
    await fetch(`${baseUrl}/lists/${audienceId}/interest-categories/${category.id}/interests`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: interest })
    });
  }
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

async function createMD5Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(handler);