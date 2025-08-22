import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReconciliationRequest {
  jobType: 'daily' | 'weekly' | 'manual'
  hoursBack?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting reconciliation sync...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { jobType = 'daily', hoursBack = 24 }: ReconciliationRequest = await req.json().catch(() => ({}))

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

    console.log(`Created sync job ${syncJob.id} for ${jobType} reconciliation`)

    // Get subscribers that need syncing (updated in last X hours or never synced)
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
    
    const { data: subscribersToSync, error: fetchError } = await supabase
      .from('subscribers')
      .select('*')
      .or(`updated_at.gte.${cutoffTime},last_mailchimp_sync_at.is.null,mailchimp_sync_status.eq.failed`)
      .eq('is_active', true)

    if (fetchError) {
      console.error('Failed to fetch subscribers:', fetchError)
      throw fetchError
    }

    console.log(`Found ${subscribersToSync?.length || 0} subscribers to reconcile`)

    let processedCount = 0
    let successCount = 0
    let failedCount = 0
    const errors: any[] = []

    // Process subscribers in batches
    const batchSize = 50
    for (let i = 0; i < (subscribersToSync?.length || 0); i += batchSize) {
      const batch = subscribersToSync!.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(subscribersToSync!.length/batchSize)}`)

      // Sync each subscriber in the batch
      for (const subscriber of batch) {
        try {
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
          console.log(`✅ Synced subscriber: ${subscriber.email}`)

        } catch (error) {
          console.error(`❌ Failed to sync subscriber ${subscriber.email}:`, error)
          
          // Update sync status with error
          await supabase
            .from('subscribers')
            .update({
              mailchimp_sync_status: 'failed',
              sync_error: error.message || 'Unknown error'
            })
            .eq('id', subscriber.id)

          failedCount++
          errors.push({
            subscriber_email: subscriber.email,
            error: error.message
          })
        }

        processedCount++
      }

      // Brief pause between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
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
        error_details: errors.length > 0 ? { errors } : null
      })
      .eq('id', syncJob.id)

    console.log(`Reconciliation sync completed: ${successCount} success, ${failedCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: syncJob.id,
        results: {
          processed: processedCount,
          success: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10) // Return first 10 errors
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Reconciliation sync failed:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})