import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  subscriberId: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting batch welcome email job...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscribers who are verified but haven't received welcome emails
    const { data: pendingUsers, error: queryError } = await supabase
      .from('subscribers')
      .select(`
        id,
        email,
        name,
        created_at
      `)
      .eq('is_active', true)
      .not('email', 'is', null);

    if (queryError) {
      console.error('❌ Error querying subscribers:', queryError);
      throw queryError;
    }

    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('✅ No subscribers found to process');
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📧 Found ${pendingUsers.length} subscribers to check...`);

    let processed = 0;
    let sent = 0;

    for (const subscriber of pendingUsers) {
      try {
        if (!subscriber.email) {
          processed++;
          continue;
        }
        const userId = await getUserIdByEmail(supabase, subscriber.email);
        if (!userId) {
          console.log(`⏭️ No auth user for ${subscriber.email}`);
          processed++;
          continue;
        }
        // Check if user exists and is verified in auth
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
          userId
        );

        if (userError || !user) {
          console.log(`⏭️ User ${subscriber.email} not found in auth or not verified yet`);
          processed++;
          continue;
        }

        // Check if user is email confirmed
        if (!user.email_confirmed_at) {
          console.log(`⏭️ User ${subscriber.email} email not confirmed yet`);
          processed++;
          continue;
        }

        // Check if welcome email already sent by looking for delivery record
        const { data: existingDelivery } = await supabase
          .from('notification_deliveries')
          .select('id')
          .eq('endpoint', `welcome-email-${subscriber.email}`)
          .eq('status', 'sent')
          .single();

        if (existingDelivery) {
          console.log(`⏭️ Welcome email already sent to ${subscriber.email}`);
          processed++;
          continue;
        }

        // Send welcome email
        console.log(`📤 Sending welcome email to ${subscriber.email}...`);
        
        const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: subscriber.email,
            name: subscriber.name,
            subscriberId: subscriber.id,
            userId: user.id
          }
        });

        if (emailError) {
          console.error(`❌ Failed to send welcome email to ${subscriber.email}:`, emailError);
        } else {
          console.log(`✅ Welcome email sent to ${subscriber.email}`);
          sent++;
        }

        processed++;
      } catch (error) {
        console.error(`❌ Error processing subscriber ${subscriber.email}:`, error);
        processed++;
      }
    }

    console.log(`🎉 Batch job completed. Processed: ${processed}, Sent: ${sent}`);

    return new Response(JSON.stringify({ 
      processed, 
      sent,
      total: pendingUsers.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Batch welcome email job failed:', error);
    return new Response(JSON.stringify({ 
      error: (error instanceof Error ? error.message : 'Unknown error occurred') 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Helper function to get user ID by email
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const user = users.find((u: any) => u.email === email);
    return user?.id || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

serve(handler);