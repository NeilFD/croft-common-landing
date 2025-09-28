-- Fix RLS policy issues by adding delete policies for contracts
CREATE POLICY "contracts_delete" ON public.contracts
  FOR DELETE USING (
    has_management_role(auth.uid(), 'admin'::management_role)
  );

-- Add delete policy for invoices  
CREATE POLICY "invoices_delete" ON public.invoices
  FOR DELETE USING (
    has_management_role(auth.uid(), 'admin'::management_role)
  );

-- Add delete policy for payments (restricted to admin only)
CREATE POLICY "payments_delete" ON public.payments
  FOR DELETE USING (
    has_management_role(auth.uid(), 'admin'::management_role)
  );

-- Update policies for payments to allow updates
CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role)
  );