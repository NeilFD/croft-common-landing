-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Helper: is the user currently Gold?
CREATE OR REPLACE FUNCTION public.is_gold(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = check_user_id
      AND price_id = 'gold_monthly'
      AND (
        (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

-- Lunch orders: add payment columns
ALTER TABLE public.lunch_orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS subtotal_amount numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_gold_at_purchase boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_lunch_orders_stripe_session ON public.lunch_orders(stripe_session_id);

-- Member referrals
CREATE TABLE public.member_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_member_referrals_code ON public.member_referrals(code);

ALTER TABLE public.member_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own referral code"
  ON public.member_referrals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages referrals"
  ON public.member_referrals FOR ALL
  USING (auth.role() = 'service_role');

-- Track redemptions so we can credit both sides exactly once
CREATE TABLE public.member_referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code text NOT NULL,
  stripe_subscription_id text,
  referrer_credited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.member_referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.member_referral_redemptions FOR SELECT
  USING (auth.uid() = referred_user_id OR auth.uid() = referrer_user_id);

CREATE POLICY "Service role manages redemptions"
  ON public.member_referral_redemptions FOR ALL
  USING (auth.role() = 'service_role');

-- Helper: ensure a referral code exists for a user, return it
CREATE OR REPLACE FUNCTION public.ensure_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_attempt int := 0;
BEGIN
  SELECT code INTO v_code FROM public.member_referrals WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := 'BEAR-' || upper(substr(md5(p_user_id::text || clock_timestamp()::text || v_attempt::text), 1, 6));
    BEGIN
      INSERT INTO public.member_referrals (user_id, code) VALUES (p_user_id, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt > 5 THEN RAISE; END IF;
    END;
  END LOOP;
END;
$$;