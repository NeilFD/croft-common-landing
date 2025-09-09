-- Create function to handle lunch order to receipt conversion
CREATE OR REPLACE FUNCTION public.handle_lunch_order_receipt()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  receipt_items JSONB;
BEGIN
  -- Only process when order is confirmed/paid and we haven't already created a receipt
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    
    -- Convert lunch order items to receipt format
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', item->>'name',
        'quantity', (item->>'quantity')::numeric,
        'price', (item->>'price')::numeric
      )
    ) INTO receipt_items
    FROM jsonb_array_elements(NEW.items) AS item;
    
    -- Create member_receipts record
    INSERT INTO public.member_receipts (
      user_id,
      receipt_date,
      receipt_time,
      total_amount,
      currency,
      venue_location,
      items,
      receipt_image_url,
      processing_status
    ) VALUES (
      NEW.user_id,
      NEW.order_date,
      NEW.collection_time,
      NEW.total_amount,
      'GBP',
      'Common Room - Lunch Order',
      receipt_items,
      'https://via.placeholder.com/400x600/f3f4f6/374151?text=Lunch+Order',
      'processed'
    );
    
    -- Get Supabase configuration for calling edge function
    SELECT value INTO supabase_url FROM public.app_settings WHERE key = 'supabase_url';
    SELECT value INTO service_role_key FROM public.app_settings WHERE key = 'service_role_key';
    
    -- Call process-receipt-streak edge function if configuration exists
    IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL AND service_role_key != 'PLACEHOLDER_FOR_SERVICE_ROLE_KEY' THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/process-receipt-streak',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'receipt_id', (SELECT id FROM public.member_receipts WHERE user_id = NEW.user_id AND receipt_date = NEW.order_date AND total_amount = NEW.total_amount ORDER BY created_at DESC LIMIT 1),
          'receipt_date', NEW.order_date,
          'total_amount', NEW.total_amount
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;