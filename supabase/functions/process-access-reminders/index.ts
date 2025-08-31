import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccessUser {
  id: string;
  name: string;
  email: string;
  access_expires_at: string;
  has_applied: boolean;
  first_access_at: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Processing access reminders...');

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0
    };

    // Get users who have active access and haven't applied yet
    const { data: users, error: usersError } = await supabase
      .from('secret_kitchen_access')
      .select('id, name, email, access_expires_at, has_applied, first_access_at')
      .eq('is_active', true)
      .eq('has_applied', false) // Only send to users who haven't applied
      .not('access_expires_at', 'is', null)
      .not('first_access_at', 'is', null); // Only users who have started their timer

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('No users found for reminder processing');
      return new Response(
        JSON.stringify({ message: "No users to process", results }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log(`Found ${users.length} users to check for reminders`);

    for (const user of users) {
      try {
        results.processed++;
        
        const expiryTime = new Date(user.access_expires_at);
        const timeLeft = expiryTime.getTime() - now.getTime();
        const hoursLeft = timeLeft / (1000 * 60 * 60);
        
        let emailType: string | null = null;
        
        // Determine which reminder to send based on time remaining
        if (timeLeft <= 0) {
          emailType = 'expired';
        } else if (hoursLeft <= 1) {
          emailType = '1h';
        } else if (hoursLeft <= 2) {
          emailType = '2h';
        } else if (hoursLeft <= 6) {
          emailType = '6h';
        }
        
        if (!emailType) {
          console.log(`User ${user.email}: No reminder needed (${hoursLeft.toFixed(1)}h remaining)`);
          results.skipped++;
          continue;
        }

        console.log(`User ${user.email}: Sending ${emailType} reminder (${hoursLeft.toFixed(1)}h remaining)`);

        // Check if this email type has already been sent
        const { data: existingLog, error: logError } = await supabase
          .from('secret_kitchen_email_log')
          .select('id')
          .eq('user_email', user.email)
          .eq('email_type', emailType)
          .eq('access_expires_at', user.access_expires_at)
          .single();

        if (logError && logError.code !== 'PGRST116') {
          console.error(`Error checking email log for ${user.email}:`, logError);
          results.errors++;
          continue;
        }

        if (existingLog) {
          console.log(`User ${user.email}: ${emailType} email already sent`);
          results.skipped++;
          continue;
        }

        // Send the reminder email
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-access-reminder-email',
          {
            body: {
              userEmail: user.email,
              userName: user.name,
              emailType: emailType,
              accessExpiresAt: user.access_expires_at
            }
          }
        );

        if (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
          results.errors++;
          continue;
        }

        console.log(`Successfully sent ${emailType} reminder to ${user.email}`);
        results.sent++;

      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        results.errors++;
      }
    }

    console.log('Reminder processing complete:', results);

    return new Response(
      JSON.stringify({ 
        message: "Access reminders processed successfully", 
        results: results,
        timestamp: now.toISOString()
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in process-access-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);