ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS lane text NOT NULL DEFAULT 'live_campaign',
  ADD COLUMN IF NOT EXISTS property_tag text,
  ADD COLUMN IF NOT EXISTS notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'marketing_campaigns_lane_check'
  ) THEN
    ALTER TABLE public.marketing_campaigns
      ADD CONSTRAINT marketing_campaigns_lane_check
      CHECK (lane IN ('key_dates','room_promo','fnb_promo','live_campaign','programming','social','newsletter'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'marketing_campaigns_property_tag_check'
  ) THEN
    ALTER TABLE public.marketing_campaigns
      ADD CONSTRAINT marketing_campaigns_property_tag_check
      CHECK (property_tag IS NULL OR property_tag IN ('town','country','group'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_lane_dates
  ON public.marketing_campaigns(lane, start_date, end_date);