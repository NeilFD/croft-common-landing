import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Manual sync test starting...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get the test subscriber
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', 'nfinchamdukes@yahoo.co.uk')
      .single()

    if (fetchError || !subscriber) {
      console.error('Failed to fetch subscriber:', fetchError)
      throw new Error('Test subscriber not found')
    }

    console.log('📧 Found subscriber:', {
      email: subscriber.email,
      name: subscriber.name,
      status: subscriber.mailchimp_sync_status,
      error: subscriber.sync_error
    })

    // Prepare sync payload
    const syncPayload = {
      email: subscriber.email,
      name: subscriber.name,
      consent_given: subscriber.consent_given,
      action: 'upsert'
    }

    console.log('🚀 Calling sync-to-mailchimp with payload:', syncPayload)

    // Call the sync function
    const syncResponse = await supabase.functions.invoke('sync-to-mailchimp', {
      body: syncPayload
    })

    console.log('📤 Sync response received:', {
      error: syncResponse.error,
      data: syncResponse.data
    })

    if (syncResponse.error) {
      console.error('❌ Sync failed:', syncResponse.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Sync failed',
          details: syncResponse.error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check updated subscriber status
    const { data: updatedSubscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', 'nfinchamdukes@yahoo.co.uk')
      .single()

    console.log('✅ Manual sync test completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual sync test completed',
        original_status: subscriber.mailchimp_sync_status,
        new_status: updatedSubscriber?.mailchimp_sync_status,
        sync_error: updatedSubscriber?.sync_error,
        sync_response: syncResponse.data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Manual sync test failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})