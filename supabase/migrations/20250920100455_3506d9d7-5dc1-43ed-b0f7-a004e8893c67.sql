-- Add campaign_id to notifications table to track which campaign each notification belongs to
ALTER TABLE public.notifications ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id);

-- Add archived column to campaigns table for archive/unarchive functionality  
ALTER TABLE public.campaigns ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- Add index on campaign_id for efficient querying of notification metrics
CREATE INDEX idx_notifications_campaign_id ON public.notifications(campaign_id);

-- Add index on archived column for efficient filtering
CREATE INDEX idx_campaigns_archived ON public.campaigns(archived);

-- Create function to calculate real-time campaign metrics from notification deliveries
CREATE OR REPLACE FUNCTION public.get_campaign_metrics(p_campaign_id UUID)
RETURNS TABLE(
  sent_count INTEGER,
  delivered_count INTEGER, 
  opened_count INTEGER,
  clicked_count INTEGER,
  delivery_rate NUMERIC,
  open_rate NUMERIC,
  click_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    COUNT(*) FILTER (WHERE nd.status = 'sent'),
    COUNT(*) FILTER (WHERE nd.status = 'delivered'), 
    COUNT(*) FILTER (WHERE nd.status = 'opened'),
    COUNT(*) FILTER (WHERE nd.status = 'clicked')
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
$$;