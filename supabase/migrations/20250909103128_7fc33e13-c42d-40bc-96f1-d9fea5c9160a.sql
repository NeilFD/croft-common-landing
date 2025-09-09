-- Create lunch menu table
CREATE TABLE public.lunch_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'sandwich', -- sandwich, beverage
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lunch time slots table
CREATE TABLE public.lunch_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_time TIME NOT NULL,
  max_orders INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lunch availability table (tracks daily availability)
CREATE TABLE public.lunch_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  slot_time TIME NOT NULL,
  orders_count INTEGER NOT NULL DEFAULT 0,
  max_orders INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, slot_time)
);

-- Create lunch orders table
CREATE TABLE public.lunch_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_date DATE NOT NULL,
  collection_time TIME NOT NULL,
  collection_slot_id UUID,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL,
  member_name TEXT NOT NULL,
  member_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, ready, collected, cancelled
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, refunded
  stripe_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lunch_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lunch_menu
CREATE POLICY "Everyone can view lunch menu" ON public.lunch_menu
FOR SELECT USING (true);

CREATE POLICY "Admins can manage lunch menu" ON public.lunch_menu
FOR ALL USING (is_email_domain_allowed(get_user_email()));

-- RLS Policies for lunch_time_slots
CREATE POLICY "Everyone can view time slots" ON public.lunch_time_slots
FOR SELECT USING (true);

CREATE POLICY "Admins can manage time slots" ON public.lunch_time_slots
FOR ALL USING (is_email_domain_allowed(get_user_email()));

-- RLS Policies for lunch_availability
CREATE POLICY "Everyone can view availability" ON public.lunch_availability
FOR SELECT USING (true);

CREATE POLICY "Service role can manage availability" ON public.lunch_availability
FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for lunch_orders
CREATE POLICY "Users can view their own orders" ON public.lunch_orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.lunch_orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.lunch_orders
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admins can update orders" ON public.lunch_orders
FOR UPDATE USING (is_email_domain_allowed(get_user_email()));

-- Insert default time slots (12:00 PM to 1:30 PM, every 15 minutes)
INSERT INTO public.lunch_time_slots (slot_time, max_orders) VALUES
('12:00:00', 10),
('12:15:00', 10),
('12:30:00', 10),
('12:45:00', 10),
('13:00:00', 10),
('13:15:00', 10),
('13:30:00', 10);

-- Insert default menu items
INSERT INTO public.lunch_menu (name, description, price, category, sort_order) VALUES
('The Deli', 'Mortadella, salami, prosciutto. Provolone. Roasted peppers. Sharp oregano oil. Proper Italian stacked in a focaccia roll.', 9.50, 'sandwich', 1),
('The Reuben', 'Salt beef. Swiss. Sauerkraut. Russian dressing. Griddled rye. New York in a handful.', 9.50, 'sandwich', 2),
('The Med', 'Chargrilled courgette, aubergine and pepper. Whipped feta, lemon, rocket. Black olive tapenade on ciabatta.', 8.50, 'sandwich', 3),
('The Capo', 'Tomato and buffalo mozzarella. Basil pesto. Balsamic glaze. Spinach on a sourdough baguette.', 8.50, 'sandwich', 4),
('San Pellegrino Sparkling Water', '500ml bottle', 2.50, 'beverage', 5),
('Acqua Panna Still Water', '500ml bottle', 2.50, 'beverage', 6),
('Coca Cola', '330ml can', 2.00, 'beverage', 7),
('Diet Coke', '330ml can', 2.00, 'beverage', 8),
('Lemonade', '330ml can', 2.00, 'beverage', 9),
('San Pellegrino Lemon', '330ml can', 2.50, 'beverage', 10);

-- Create function to update lunch availability
CREATE OR REPLACE FUNCTION public.update_lunch_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update availability for the order date and slot
  INSERT INTO public.lunch_availability (date, slot_time, orders_count, max_orders)
  VALUES (NEW.order_date, NEW.collection_time, 1, 10)
  ON CONFLICT (date, slot_time) 
  DO UPDATE SET 
    orders_count = lunch_availability.orders_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update availability when orders are placed
CREATE TRIGGER update_lunch_availability_trigger
  AFTER INSERT ON public.lunch_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lunch_availability();

-- Create function to add lunch order to ledger
CREATE OR REPLACE FUNCTION public.add_lunch_order_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to ledger
  INSERT INTO public.member_ledger (
    user_id, 
    activity_type, 
    activity_date, 
    amount, 
    currency, 
    description, 
    related_id, 
    metadata
  )
  VALUES (
    NEW.user_id,
    'lunch_order',
    NEW.order_date,
    NEW.total_amount,
    'GBP',
    'Lunch Run order - £' || NEW.total_amount::text,
    NEW.id,
    jsonb_build_object(
      'collection_time', NEW.collection_time,
      'items', NEW.items,
      'member_name', NEW.member_name
    )
  );
  
  -- Check if order qualifies for streak contribution (£8+ spend)
  IF NEW.total_amount >= 8.00 THEN
    -- This will be handled by a separate streak system integration
    -- For now, we'll just log it in the metadata
    UPDATE public.member_ledger 
    SET metadata = metadata || jsonb_build_object('contributes_to_streak', true)
    WHERE related_id = NEW.id AND activity_type = 'lunch_order';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to add lunch orders to ledger
CREATE TRIGGER add_lunch_order_to_ledger_trigger
  AFTER INSERT ON public.lunch_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_lunch_order_to_ledger();