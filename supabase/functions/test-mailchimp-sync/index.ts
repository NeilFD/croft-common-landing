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
    console.log('=== MAILCHIMP SYNC TEST START ===')
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY')
    
    console.log('Environment check:')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'SET' : 'MISSING')  
    console.log('- MAILCHIMP_API_KEY:', mailchimpApiKey ? 'SET' : 'MISSING')
    
    if (!mailchimpApiKey || mailchimpApiKey === 'your-mailchimp-api-key') {
      console.error('❌ MAILCHIMP_API_KEY not configured')
      return new Response(
        JSON.stringify({ 
          error: 'MAILCHIMP_API_KEY not configured',
          mailchimpKey: mailchimpApiKey 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test Mailchimp API connectivity
    const datacenter = mailchimpApiKey.split('-')[1]
    const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`
    const authHeader = `Basic ${btoa(`anystring:${mailchimpApiKey}`)}`
    
    console.log('Testing Mailchimp API connectivity...')
    console.log('- Datacenter:', datacenter)
    console.log('- Base URL:', baseUrl)
    
    const pingResponse = await fetch(`${baseUrl}/ping`, {
      headers: { 'Authorization': authHeader }
    })
    
    console.log('Mailchimp ping response:', pingResponse.status, pingResponse.statusText)
    
    if (!pingResponse.ok) {
      const errorData = await pingResponse.text()
      console.error('❌ Mailchimp API ping failed:', errorData)
      return new Response(
        JSON.stringify({ 
          error: 'Mailchimp API authentication failed',
          status: pingResponse.status,
          details: errorData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ Mailchimp API connection successful')
    
    // Test with the actual subscriber data
    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    console.log('Fetching test subscriber data...')
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', 'nfinchamdukes@yahoo.co.uk')
      .single()
    
    if (fetchError || !subscriber) {
      console.error('❌ Failed to fetch subscriber:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Subscriber not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ Found subscriber:', subscriber.email)
    
    // Now test the actual sync
    console.log('Testing sync-to-mailchimp function...')
    const syncPayload = {
      email: subscriber.email,
      name: subscriber.name,
      consent_given: subscriber.consent_given,
      action: 'upsert'
    }
    
    console.log('Sync payload:', syncPayload)
    
    const syncResponse = await supabase.functions.invoke('sync-to-mailchimp', {
      body: syncPayload
    })
    
    console.log('Sync response:', syncResponse)
    
    if (syncResponse.error) {
      console.error('❌ Sync function failed:', syncResponse.error)
      return new Response(
        JSON.stringify({ 
          error: 'Sync function failed',
          details: syncResponse.error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ Sync function completed successfully')
    console.log('=== MAILCHIMP SYNC TEST END ===')
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mailchimp sync test completed successfully',
        subscriber: subscriber.email,
        syncResult: syncResponse.data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
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