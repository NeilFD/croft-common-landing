import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const requestBody = await req.json()
    const { image_url, action, receipt_data } = requestBody

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: 'image_url is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'extract') {
      // Call OpenAI Vision API to extract receipt data
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a receipt OCR system. Extract structured data from receipt images. Return ONLY a JSON object with this exact structure:
{
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "currency": "GBP",
  "venue_location": "venue name or location",
  "receipt_number": "receipt number if visible",
  "receipt_time": "HH:MM:SS format if time is visible",
  "covers": number_of_people_served,
  "items": [
    {"name": "item name", "quantity": 1, "price": 0.00}
  ]
}
Be precise with numbers. Use GBP as default currency unless clearly stated otherwise. Look for receipt numbers, transaction times, and covers/people count on the receipt.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the receipt data from this image.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image_url
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', errorText)
        return new Response(
          JSON.stringify({ error: 'Failed to process receipt image' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const data = await response.json()
      const extractedText = data.choices[0].message.content

      try {
        // Clean up any markdown formatting from the response
        let cleanedText = extractedText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        
        const receiptData = JSON.parse(cleanedText);
        
        return new Response(
          JSON.stringify({
            extracted_data: receiptData,
            raw_response: extractedText
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse receipt data',
            raw_response: extractedText 
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (action === 'save') {
      if (!receipt_data) {
        return new Response(
          JSON.stringify({ error: 'receipt_data is required for save action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate receipt date is not in the future
      const receiptDate = new Date(receipt_data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (receiptDate > today) {
        return new Response(
          JSON.stringify({ error: 'Receipt date cannot be in the future' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Save receipt to database (triggers will handle ledger entry)
      const { data: newReceipt, error: receiptError } = await supabase
        .from('member_receipts')
        .insert({
          user_id: user.id,
          receipt_image_url: image_url,
          receipt_date: receipt_data.date,
          total_amount: receipt_data.total,
          currency: receipt_data.currency || 'GBP',
          venue_location: receipt_data.venue_location,
          receipt_number: receipt_data.receipt_number,
          receipt_time: receipt_data.receipt_time,
          covers: receipt_data.covers,
          items: receipt_data.items || [],
          raw_ocr_data: receipt_data,
          processing_status: 'completed'
        })
        .select()
        .single()

      if (receiptError) {
        console.error('Receipt save error:', receiptError)
        return new Response(
          JSON.stringify({ error: 'Failed to save receipt' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({
          message: 'Receipt saved successfully',
          receipt: newReceipt
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "extract" or "save"' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in receipt-ocr function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})