-- Create table for storing daily feedback reports
CREATE TABLE IF NOT EXISTS public.feedback_daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL UNIQUE,
  overall_sentiment text NOT NULL,
  confidence numeric NOT NULL,
  key_positives jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_negatives jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_analysis text,
  feedback_count integer NOT NULL DEFAULT 0,
  average_ratings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_daily_reports ENABLE ROW LEVEL SECURITY;

-- Policy for management users to read reports
CREATE POLICY "Management users can view daily reports"
ON public.feedback_daily_reports
FOR SELECT
USING (
  is_email_domain_allowed(get_user_email())
);

-- Policy for system to insert/update reports (via edge function with service role)
CREATE POLICY "Service role can manage daily reports"
ON public.feedback_daily_reports
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups by date
CREATE INDEX idx_feedback_daily_reports_date ON public.feedback_daily_reports(report_date DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_feedback_daily_reports_updated_at
BEFORE UPDATE ON public.feedback_daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();