-- EVENT LINE ITEMS (packages, menus, add-ons, fees)
CREATE TABLE IF NOT EXISTS public.event_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('room','menu','addon','discount','service','tax')),
  description TEXT NOT NULL,
  qty INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  per_person BOOLEAN DEFAULT false,
  tax_rate_pct NUMERIC(5,2),
  service_charge_pct NUMERIC(5,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  number TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','paid','void','refunded')) DEFAULT 'draft',
  due_date DATE,
  total NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('card','bank','cash')),
  stripe_charge_id TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  pdf_url TEXT,
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  is_signed BOOLEAN DEFAULT false,
  is_immutable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add updated_at triggers
CREATE TRIGGER update_event_line_items_updated_at
  BEFORE UPDATE ON public.event_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.event_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_line_items
CREATE POLICY "event_line_items_select" ON public.event_line_items
  FOR SELECT USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "event_line_items_insert" ON public.event_line_items
  FOR INSERT WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

CREATE POLICY "event_line_items_update" ON public.event_line_items
  FOR UPDATE USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

CREATE POLICY "event_line_items_delete" ON public.event_line_items
  FOR DELETE USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- RLS Policies for invoices
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role)
  );

CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role)
  );

-- RLS Policies for payments
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role)
  );

-- RLS Policies for contracts
CREATE POLICY "contracts_select" ON public.contracts
  FOR SELECT USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "contracts_insert" ON public.contracts
  FOR INSERT WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

CREATE POLICY "contracts_update" ON public.contracts
  FOR UPDATE USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- RPCs
CREATE OR REPLACE FUNCTION public.create_proposal(p_event_id UUID, p_items JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  line_item JSONB;
  inserted_id UUID;
  proposal_id UUID := gen_random_uuid();
BEGIN
  -- Validate user has permissions
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to create proposal';
  END IF;

  -- Insert line items
  FOR line_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.event_line_items (
      event_id, type, description, qty, unit_price, per_person, tax_rate_pct, service_charge_pct, sort_order
    ) VALUES (
      p_event_id,
      line_item->>'type',
      line_item->>'description',
      (line_item->>'qty')::INTEGER,
      (line_item->>'unit_price')::NUMERIC,
      (line_item->>'per_person')::BOOLEAN,
      (line_item->>'tax_rate_pct')::NUMERIC,
      (line_item->>'service_charge_pct')::NUMERIC,
      (line_item->>'sort_order')::INTEGER
    ) RETURNING id INTO inserted_id;
  END LOOP;

  -- Log audit entry
  PERFORM public.log_audit_entry(p_event_id, 'event', 'proposal_created', auth.uid(), 
    jsonb_build_object('item_count', jsonb_array_length(p_items)));

  RETURN proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_contract(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_id UUID;
  event_data RECORD;
  contract_content TEXT;
BEGIN
  -- Get event data
  SELECT * INTO event_data FROM public.events WHERE id = p_event_id;
  
  IF event_data IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Create contract template
  contract_content := format('
CROFT COMMON EVENT CONTRACT

Client: %s
Event Date: %s
Event Type: %s
Location: %s

This contract confirms the booking of the above event.

Terms and Conditions:
- Full payment required 7 days before event
- Cancellation policy applies
- Equipment and setup as specified

Signed: _________________________ Date: _____________

', event_data.title, event_data.date, event_data.category, event_data.location);

  -- Insert contract
  INSERT INTO public.contracts (event_id, content, version)
  VALUES (p_event_id, contract_content, 1)
  RETURNING id INTO contract_id;

  -- Log audit entry
  PERFORM public.log_audit_entry(p_event_id, 'event', 'contract_generated', auth.uid(), 
    jsonb_build_object('contract_id', contract_id));

  RETURN contract_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_invoice(p_event_id UUID, p_due_date DATE, p_amount NUMERIC)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_id UUID;
  invoice_number TEXT;
  next_number INTEGER;
BEGIN
  -- Generate invoice number
  SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 'CCI-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE number LIKE 'CCI-' || EXTRACT(YEAR FROM NOW()) || '-%';

  invoice_number := 'CCI-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_number::TEXT, 4, '0');

  -- Create invoice
  INSERT INTO public.invoices (event_id, number, due_date, total, balance_due)
  VALUES (p_event_id, invoice_number, p_due_date, p_amount, p_amount)
  RETURNING id INTO invoice_id;

  -- Log audit entry
  PERFORM public.log_audit_entry(p_event_id, 'event', 'invoice_created', auth.uid(), 
    jsonb_build_object('invoice_id', invoice_id, 'amount', p_amount));

  RETURN invoice_id;
END;
$$;