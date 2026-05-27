import { supabase } from "@/integrations/supabase/client";

export type SlotStatus = "open" | "gone";

export interface AvailabilityRow {
  slot_date: string;
  day_of_week: number;
  slot_start: string;
  slot_end: string;
  label: string | null;
  subtitle: string | null;
  status: SlotStatus;
}

export interface KaraokePackage {
  id: string;
  kind: "food" | "drink";
  name: string;
  description: string | null;
  price_per_person_pennies: number | null;
  sort_order: number;
}

export interface KaraokeBooking {
  id: string;
  slot_date: string;
  slot_start: string;
  slot_end: string;
  guest_first_name: string;
  guest_last_name: string | null;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  food_package_id: string | null;
  drink_package_id: string | null;
  food_package: string | null;
  drink_package: string | null;
  notes: string | null;
  status: "pending_payment" | "confirmed" | "cancelled" | "cancelled_by_venue" | "no_show";
  deposit_status: string;
  manage_token: string;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
}

export interface CreateBookingInput {
  slot_date: string;
  slot_start: string;
  party_size: number;
  guest_first_name: string;
  guest_last_name?: string;
  guest_email: string;
  guest_phone?: string;
  food_package_id?: string | null;
  drink_package_id?: string | null;
  notes?: string;
}

export const getAvailability = async (from: string, to: string): Promise<AvailabilityRow[]> => {
  const { data, error } = await supabase.rpc("get_karaoke_availability" as any, {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return (data as AvailabilityRow[]) ?? [];
};

export const listPackages = async (): Promise<KaraokePackage[]> => {
  const { data, error } = await supabase
    .from("karaoke_packages" as any)
    .select("id, kind, name, description, price_per_person_pennies, sort_order")
    .eq("is_active", true)
    .order("kind")
    .order("sort_order");
  if (error) throw error;
  return (data as unknown as KaraokePackage[]) ?? [];
};

export const createBooking = async (input: CreateBookingInput): Promise<{ booking_id: string; manage_token: string }> => {
  const { data, error } = await supabase.rpc("create_karaoke_booking" as any, {
    payload: input as any,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as { booking_id: string; manage_token: string };
};

export const getBookingByToken = async (token: string): Promise<KaraokeBooking | null> => {
  const { data, error } = await supabase.rpc("get_karaoke_booking_by_token" as any, {
    p_token: token,
  });
  if (error) throw error;
  return (data as KaraokeBooking | null) ?? null;
};

export const updateBookingByToken = async (
  token: string,
  patch: Partial<CreateBookingInput>,
): Promise<KaraokeBooking> => {
  const { data, error } = await supabase.rpc("update_karaoke_booking_by_token" as any, {
    p_token: token,
    patch: patch as any,
  });
  if (error) throw error;
  return data as KaraokeBooking;
};

export const cancelBookingByToken = async (token: string, reason: string): Promise<KaraokeBooking> => {
  const { data, error } = await supabase.rpc("cancel_karaoke_booking_by_token" as any, {
    p_token: token,
    p_reason: reason,
  });
  if (error) throw error;
  return data as KaraokeBooking;
};

// Fetch the venue notification email from karaoke_settings so the address
// stays editable in the management UI without redeploying code.
const getVenueEmail = async (): Promise<string> => {
  const fallback = "neil.fincham-dukes@crazybear.co.uk";
  try {
    const { data } = await supabase
      .from("karaoke_settings" as any)
      .select("venue_email")
      .eq("id", 1)
      .maybeSingle();
    const email = (data as any)?.venue_email;
    return typeof email === "string" && email.includes("@") ? email : fallback;
  } catch {
    return fallback;
  }
};

// Send guest + venue emails for a booking event.
export const sendBookingEmails = async (
  booking: KaraokeBooking,
  kind: "created" | "updated" | "cancelled",
) => {
  const venueEmail = await getVenueEmail();
  const guestTemplate =
    kind === "cancelled" ? "karaoke-guest-cancellation" : "karaoke-guest-confirmation";
  const venueTemplate =
    kind === "cancelled" ? "karaoke-venue-cancellation" : "karaoke-venue-sheet";

  const manageUrl = `https://crazybear.app/town/karaoke/manage/${booking.manage_token}`;
  const data = {
    kind,
    bookingId: booking.id,
    slotDate: booking.slot_date,
    slotStart: booking.slot_start,
    slotEnd: booking.slot_end,
    guestFirstName: booking.guest_first_name,
    guestLastName: booking.guest_last_name,
    guestEmail: booking.guest_email,
    guestPhone: booking.guest_phone,
    partySize: booking.party_size,
    foodPackage: booking.food_package,
    drinkPackage: booking.drink_package,
    notes: booking.notes,
    manageUrl,
    cancelledReason: booking.cancelled_reason,
  };

  await Promise.allSettled([
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: guestTemplate,
        recipientEmail: booking.guest_email,
        idempotencyKey: `karaoke-guest-${kind}-${booking.id}-${Date.now()}`,
        templateData: data,
      },
    }),
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: venueTemplate,
        recipientEmail: venueEmail,
        idempotencyKey: `karaoke-venue-${kind}-${booking.id}-${Date.now()}`,
        templateData: data,
      },
    }),
  ]);
};
