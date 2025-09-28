import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FullSyncRequest {
  jobType: 'weekly' | 'manual'
  validateOnly?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting full sync...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY')!

    if (!mailchimpApiKey || mailchimpApiKey === 'your-mailchimp-api-key') {
      throw new Error('MAILCHIMP_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { jobType = 'weekly', validateOnly = false }: FullSyncRequest = await req.json().catch(() => ({}))

    // Create sync job record
    const { data: syncJob, error: jobError } = await supabase
      .from('mailchimp_sync_jobs')
      .insert({
        job_type: jobType,
        status: 'running'
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create sync job:', jobError)
      throw jobError
    }

    console.log(`Created full sync job ${syncJob.id} (validateOnly: ${validateOnly})`)

    // Get all active subscribers from Supabase
    const { data: supabaseSubscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Failed to fetch subscribers:', fetchError)
      throw fetchError
    }

    console.log(`Found ${supabaseSubscribers?.length || 0} active subscribers in Supabase`)

    // Get Mailchimp configuration
    const datacenter = mailchimpApiKey.split('-')[1]
    const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`
    const authHeader = `Basic ${btoa(`anystring:${mailchimpApiKey}`)}`

    // Get audience ID
    const audiencesResponse = await fetch(`${baseUrl}/lists`, {
      headers: { 'Authorization': authHeader }
    })

    if (!audiencesResponse.ok) {
      throw new Error(`Failed to fetch audiences: ${audiencesResponse.statusText}`)
    }

    const audiencesData = await audiencesResponse.json()
    const audience = audiencesData.lists.find((list: any) => list.name === 'Croft Common Subscribers')

    if (!audience) {
      console.log('Mailchimp audience not found, triggering batch sync first...')
      
      // Trigger batch sync to create audience
      const batchResponse = await supabase.functions.invoke('mailchimp-batch-sync', {
        body: { limit: 1000 }
      })

      if (batchResponse.error) {
        throw new Error('Failed to initialize Mailchimp audience')
      }

      console.log('Batch sync completed, retrying full sync...')
      
      // Update job status and exit - next cron run will handle the full sync
      await supabase
        .from('mailchimp_sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_count: 0,
          success_count: 0,
          failed_count: 0,
          error_details: { message: 'Initialized Mailchimp audience, full sync will run next cycle' }
        })
        .eq('id', syncJob.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Initialized Mailchimp audience, full sync will run next cycle'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get all Mailchimp subscribers
    let allMailchimpMembers: any[] = []
    let offset = 0
    const count = 1000

    while (true) {
      const membersResponse = await fetch(
        `${baseUrl}/lists/${audience.id}/members?count=${count}&offset=${offset}&status=subscribed`,
        {
          headers: { 'Authorization': authHeader }
        }
      )

      if (!membersResponse.ok) {
        throw new Error(`Failed to fetch Mailchimp members: ${membersResponse.statusText}`)
      }

      const membersData = await membersResponse.json()
      allMailchimpMembers.push(...membersData.members)

      if (membersData.members.length < count) break
      offset += count
    }

    console.log(`Found ${allMailchimpMembers.length} subscribers in Mailchimp`)

    // Create email maps for comparison
    const supabaseEmails = new Set(supabaseSubscribers?.map(s => s.email.toLowerCase()) || [])
    const mailchimpEmails = new Set(allMailchimpMembers.map(m => m.email_address.toLowerCase()))

    // Find discrepancies
    const missingInMailchimp = Array.from(supabaseEmails).filter(email => !mailchimpEmails.has(email))
    const extraInMailchimp = Array.from(mailchimpEmails).filter(email => !supabaseEmails.has(email))

    console.log(`Analysis: ${missingInMailchimp.length} missing in Mailchimp, ${extraInMailchimp.length} extra in Mailchimp`)

    if (validateOnly) {
      // Just return the analysis
      await supabase
        .from('mailchimp_sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_count: supabaseSubscribers?.length || 0,
          error_details: {
            validation_results: {
              supabase_total: supabaseSubscribers?.length || 0,
              mailchimp_total: allMailchimpMembers.length,
              missing_in_mailchimp: missingInMailchimp.length,
              extra_in_mailchimp: extraInMailchimp.length,
              missing_emails: missingInMailchimp.slice(0, 50),
              extra_emails: extraInMailchimp.slice(0, 50)
            }
          }
        })
        .eq('id', syncJob.id)

      return new Response(
        JSON.stringify({
          success: true,
          validation_results: {
            supabase_total: supabaseSubscribers?.length || 0,
            mailchimp_total: allMailchimpMembers.length,
            missing_in_mailchimp: missingInMailchimp.length,
            extra_in_mailchimp: extraInMailchimp.length
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Sync missing subscribers to Mailchimp
    let processedCount = 0
    let successCount = 0
    let failedCount = 0
    const errors: any[] = []

    for (const missingEmail of missingInMailchimp) {
      try {
        const subscriber = supabaseSubscribers?.find(s => s.email.toLowerCase() === missingEmail)
        if (!subscriber) continue

        // Call the existing sync function
        const syncResponse = await supabase.functions.invoke('sync-to-mailchimp', {
          body: {
            email: subscriber.email,
            name: subscriber.name,
            preferences: subscriber.preferences,
            action: 'upsert'
          }
        })

        if (syncResponse.error) {
          throw syncResponse.error
        }

        // Update sync status
        await supabase
          .from('subscribers')
          .update({
            last_mailchimp_sync_at: new Date().toISOString(),
            mailchimp_sync_status: 'synced',
            sync_error: null
          })
          .eq('id', subscriber.id)

        successCount++
        console.log(`✅ Added missing subscriber: ${subscriber.email}`)

      } catch (error) {
        console.error(`❌ Failed to sync missing subscriber ${missingEmail}:`, error)
        failedCount++
        errors.push({
          subscriber_email: missingEmail,
          error: (error instanceof Error ? error.message : String(error))
        })
      }

      processedCount++
      
      // Brief pause to avoid rate limits
      if (processedCount % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Update sync job with final status
    const finalStatus = failedCount === 0 ? 'completed' : 'completed_with_errors'
    
    await supabase
      .from('mailchimp_sync_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        processed_count: processedCount,
        success_count: successCount,
        failed_count: failedCount,
        error_details: {
          analysis: {
            supabase_total: supabaseSubscribers?.length || 0,
            mailchimp_total: allMailchimpMembers.length,
            missing_in_mailchimp: missingInMailchimp.length,
            extra_in_mailchimp: extraInMailchimp.length
          },
          errors: errors.slice(0, 20)
        }
      })
      .eq('id', syncJob.id)

    console.log(`Full sync completed: ${successCount} added, ${failedCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: syncJob.id,
        results: {
          processed: processedCount,
          success: successCount,
          failed: failedCount,
          analysis: {
            supabase_total: supabaseSubscribers?.length || 0,
            mailchimp_total: allMailchimpMembers.length,
            missing_in_mailchimp: missingInMailchimp.length,
            extra_in_mailchimp: extraInMailchimp.length
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Full sync failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : String(error))
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})