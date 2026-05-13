
CREATE TABLE public.marketing_settings (
  key text PRIMARY KEY,
  voice_prompt text NOT NULL,
  channel_hints jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read marketing settings"
  ON public.marketing_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert marketing settings"
  ON public.marketing_settings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update marketing settings"
  ON public.marketing_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_marketing_settings_updated_at
  BEFORE UPDATE ON public.marketing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.marketing_settings (key, voice_prompt, channel_hints) VALUES (
  'default',
  E'You are writing for ''The Crazy Bear'', voice = ''Bears Den'': bold, irreverent, short, staccato, confident, minimal copy. British English only. Never use em dashes or double hyphens. Never invent prices or facts. Never use Americanisms. Currency £ only.',
  '{
    "instagram": "Tone: visual-led, 1-3 short lines, hashtags optional, emoji sparingly.",
    "tiktok": "Tone: punchy hook in line one, casual.",
    "facebook": "Tone: warm, slightly longer, conversational.",
    "x": "Hard limit 280 chars, single tight line, witty.",
    "linkedin": "Tone: confident, professional, no hype, 2-4 short paragraphs.",
    "email": "Output a subject line then a 2-3 sentence preheader-friendly intro.",
    "website": "Tone: editorial, scannable, headline + 2 short paragraphs."
  }'::jsonb
);
