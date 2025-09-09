-- Create trigger for lunch order to receipt conversion
CREATE OR REPLACE TRIGGER lunch_order_receipt_trigger
  AFTER UPDATE ON public.lunch_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lunch_order_receipt();