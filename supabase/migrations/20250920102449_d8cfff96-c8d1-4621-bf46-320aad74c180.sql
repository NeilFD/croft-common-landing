-- Update get_campaign_metrics function to properly count clicks based on clicked_at
CREATE OR REPLACE FUNCTION public.get_campaign_metrics(p_campaign_id uuid)
RETURNS TABLE(sent_count integer, delivered_count integer, opened_count integer, clicked_count integer, delivery_rate numeric, open_rate numeric, click_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_sent INTEGER := 0;
  total_delivered INTEGER := 0;
  total_opened INTEGER := 0;
  total_clicked INTEGER := 0;
BEGIN
  -- Get all notification IDs for this campaign
  WITH campaign_notifications AS (
    SELECT id FROM public.notifications 
    WHERE campaign_id = p_campaign_id
  )
  SELECT 
    COUNT(*) as sent,
    COUNT(*) FILTER (WHERE nd.status IN ('sent', 'delivered')) as delivered,
    COUNT(*) FILTER (WHERE nd.opened_at IS NOT NULL OR nd.status = 'opened') as opened,
    COUNT(*) FILTER (WHERE nd.clicked_at IS NOT NULL OR nd.status = 'clicked') as clicked
  INTO total_sent, total_delivered, total_opened, total_clicked
  FROM campaign_notifications cn
  LEFT JOIN public.notification_deliveries nd ON nd.notification_id = cn.id;
  
  -- If no deliveries found, get from campaigns table as fallback
  IF total_sent = 0 THEN
    SELECT c.sent_count, c.delivered_count, c.opened_count, c.clicked_count
    INTO total_sent, total_delivered, total_opened, total_clicked
    FROM public.campaigns c
    WHERE c.id = p_campaign_id;
  END IF;
  
  RETURN QUERY SELECT 
    total_sent,
    total_delivered,
    total_opened, 
    total_clicked,
    CASE WHEN total_sent > 0 THEN ROUND((total_delivered::NUMERIC / total_sent) * 100, 1) ELSE 0 END,
    CASE WHEN total_delivered > 0 THEN ROUND((total_opened::NUMERIC / total_delivered) * 100, 1) ELSE 0 END,
    CASE WHEN total_delivered > 0 THEN ROUND((total_clicked::NUMERIC / total_delivered) * 100, 1) ELSE 0 END;
END;
$function$;