-- Create admin analytics view for comprehensive member spending analysis
CREATE VIEW public.admin_member_analytics AS
SELECT 
  ml.user_id,
  p.first_name,
  p.last_name,
  COALESCE(mp.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN ml.amount > 0 THEN ml.amount ELSE 0 END) as total_spend,
  AVG(CASE WHEN ml.amount > 0 THEN ml.amount ELSE NULL END) as avg_transaction,
  MIN(ml.activity_date) as first_transaction_date,
  MAX(ml.activity_date) as last_transaction_date,
  COUNT(DISTINCT DATE_TRUNC('month', ml.activity_date)) as active_months,
  COUNT(DISTINCT ml.activity_date) as active_days,
  ARRAY_AGG(DISTINCT ml.category) FILTER (WHERE ml.category IS NOT NULL) as categories,
  ARRAY_AGG(DISTINCT ml.payment_method) FILTER (WHERE ml.payment_method IS NOT NULL) as payment_methods,
  ml.currency,
  SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN ml.amount ELSE 0 END) as current_month_spend,
  SUM(CASE WHEN ml.activity_date >= DATE_TRUNC('week', NOW()) THEN ml.amount ELSE 0 END) as current_week_spend,
  COUNT(CASE WHEN ml.activity_date >= DATE_TRUNC('month', NOW()) THEN 1 END) as current_month_transactions
FROM public.member_ledger ml
LEFT JOIN public.profiles p ON p.user_id = ml.user_id
LEFT JOIN public.member_profiles_extended mp ON mp.user_id = ml.user_id
WHERE ml.amount IS NOT NULL
GROUP BY ml.user_id, p.first_name, p.last_name, mp.display_name, ml.currency;

-- Enable RLS on the view
ALTER VIEW public.admin_member_analytics SET (security_barrier=true, check_option='cascaded');

-- Admin can view analytics
CREATE POLICY "Admins can view member analytics"
ON public.admin_member_analytics
FOR SELECT
USING (is_email_domain_allowed(get_user_email()));