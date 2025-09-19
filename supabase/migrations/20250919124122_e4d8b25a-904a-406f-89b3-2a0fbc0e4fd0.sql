-- Create campaign segments table for saved audience segments
CREATE TABLE public.campaign_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  avg_spend NUMERIC DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create campaigns table for campaign tracking
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  segment_id UUID REFERENCES public.campaign_segments(id),
  segment_filters JSONB, -- For one-time campaigns without saved segments
  template_id TEXT,
  personalize BOOLEAN NOT NULL DEFAULT false,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  schedule_type TEXT NOT NULL DEFAULT 'now', -- 'now', 'scheduled'
  scheduled_date DATE,
  scheduled_time TIME,
  estimated_reach INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'scheduled', 'failed'
  created_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign analytics table for detailed performance tracking
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'visit_after'
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create segment member preview table for caching segment results
CREATE TABLE public.segment_member_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES public.campaign_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(segment_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.campaign_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_member_previews ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign_segments
CREATE POLICY "Admins can manage campaign segments" 
ON public.campaign_segments 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

-- Create policies for campaigns
CREATE POLICY "Admins can manage campaigns" 
ON public.campaigns 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

-- Create policies for campaign_analytics
CREATE POLICY "Admins can view campaign analytics" 
ON public.campaign_analytics 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "System can insert campaign analytics" 
ON public.campaign_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create policies for segment_member_previews
CREATE POLICY "Admins can manage segment previews" 
ON public.segment_member_previews 
FOR ALL 
USING (is_email_domain_allowed(get_user_email()));

-- Create indexes for performance
CREATE INDEX idx_campaign_segments_created_by ON public.campaign_segments(created_by);
CREATE INDEX idx_campaigns_segment_id ON public.campaigns(segment_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_analytics_campaign_id ON public.campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_event_type ON public.campaign_analytics(event_type);
CREATE INDEX idx_segment_member_previews_segment_id ON public.segment_member_previews(segment_id);

-- Create function to update segment member count
CREATE OR REPLACE FUNCTION public.update_segment_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member count for the affected segment
  UPDATE public.campaign_segments 
  SET 
    member_count = (
      SELECT COUNT(*) 
      FROM public.segment_member_previews 
      WHERE segment_id = COALESCE(NEW.segment_id, OLD.segment_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.segment_id, OLD.segment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for segment member count updates
CREATE TRIGGER update_segment_count_trigger
AFTER INSERT OR DELETE ON public.segment_member_previews
FOR EACH ROW
EXECUTE FUNCTION public.update_segment_member_count();

-- Create function to update campaign timestamps
CREATE OR REPLACE FUNCTION public.update_campaign_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_campaign_segments_updated_at
BEFORE UPDATE ON public.campaign_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_timestamps();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_timestamps();