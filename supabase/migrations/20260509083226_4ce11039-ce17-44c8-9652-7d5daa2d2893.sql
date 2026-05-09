-- Extend member_receipts with anti-fraud + OCR detail columns
ALTER TABLE public.member_receipts
  ADD COLUMN IF NOT EXISTS receipt_number text,
  ADD COLUMN IF NOT EXISTS receipt_time time,
  ADD COLUMN IF NOT EXISTS venue_location text,
  ADD COLUMN IF NOT EXISTS covers integer,
  ADD COLUMN IF NOT EXISTS raw_ocr_data jsonb,
  ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS image_sha256 text,
  ADD COLUMN IF NOT EXISTS perceptual_hash text,
  ADD COLUMN IF NOT EXISTS bear_logo_detected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bear_logo_confidence numeric,
  ADD COLUMN IF NOT EXISTS screen_capture_score numeric,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS member_receipts_image_sha256_uidx
  ON public.member_receipts (image_sha256)
  WHERE image_sha256 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS member_receipts_number_date_time_uidx
  ON public.member_receipts (receipt_number, receipt_date, receipt_time)
  WHERE receipt_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS member_receipts_user_date_idx
  ON public.member_receipts (user_id, receipt_date);

-- Rejection log
CREATE TABLE IF NOT EXISTS public.receipt_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text,
  image_sha256 text,
  reason_code text NOT NULL,
  reason_message text NOT NULL,
  ai_flags jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipt_rejections_user_idx
  ON public.receipt_rejections (user_id, created_at DESC);

ALTER TABLE public.receipt_rejections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rejections" ON public.receipt_rejections;
CREATE POLICY "Users can view their own rejections"
  ON public.receipt_rejections
  FOR SELECT
  USING (auth.uid() = user_id);
