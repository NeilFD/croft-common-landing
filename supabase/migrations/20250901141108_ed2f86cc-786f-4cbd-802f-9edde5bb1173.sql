-- Create the missing RPC function for updating meeting status
CREATE OR REPLACE FUNCTION update_meeting_status(
  user_email TEXT,
  booking_status BOOLEAN,
  booking_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE secret_kitchen_access 
  SET 
    calendly_booked = booking_status,
    calendly_booking_date = booking_date,
    updated_at = now()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;