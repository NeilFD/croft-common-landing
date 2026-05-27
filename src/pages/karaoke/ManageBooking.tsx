import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BOOKING_WINDOW_DAYS,
  CANCEL_CUTOFF_HOURS,
  PARTY_MAX,
  PARTY_MIN,
  formatLongDate,
  formatShortDay,
  formatSlotWindow,
  formatUsableWindow,
  isOutsideCutoff,
  nextNDays,
  toIsoDate,
} from "@/lib/karaoke/slots";
import {
  AvailabilityRow,
  KaraokeBooking,
  cancelBookingByToken,
  getAvailability,
  getBookingByToken,
  sendBookingEmails,
  updateBookingByToken,
} from "@/lib/karaoke/api";

const ManageBooking = () => {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<KaraokeBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [party, setParty] = useState<number>(PARTY_MIN);
  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [selDate, setSelDate] = useState<string>("");
  const [selStart, setSelStart] = useState<string>("");
  const [availLoading, setAvailLoading] = useState(false);

  const datesByDay = useMemo(() => nextNDays(BOOKING_WINDOW_DAYS), []);
  const slotsForDate = useMemo(
    () => availability.filter((s) => s.slot_date === selDate),
    [availability, selDate],
  );

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const b = await getBookingByToken(token);
        if (!b) {
          setNotFound(true);
        } else {
          setBooking(b);
          setParty(b.party_size);
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const refresh = async () => {
    if (!token) return;
    const b = await getBookingByToken(token);
    setBooking(b);
    if (b) setParty(b.party_size);
  };

  const handleUpdateParty = async () => {
    if (!token || !booking) return;
    if (party === booking.party_size) return;
    setBusy(true);
    try {
      await updateBookingByToken(token, { party_size: party });
      await refresh();
      const fresh = await getBookingByToken(token);
      if (fresh) sendBookingEmails(fresh, "updated").catch(() => {});
      toast.success("Party size updated.");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't update.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!token || !booking) return;
    const reason = window.prompt("Reason for cancelling? (optional)") ?? "";
    if (!window.confirm("Cancel this booking?")) return;
    setBusy(true);
    try {
      const cancelled = await cancelBookingByToken(token, reason);
      setBooking(cancelled);
      sendBookingEmails(cancelled, "cancelled").catch(() => {});
      toast.success("Booking cancelled.");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't cancel.");
    } finally {
      setBusy(false);
    }
  };

  const loadAvailability = async () => {
    setAvailLoading(true);
    try {
      const from = datesByDay[0];
      const to = datesByDay[datesByDay.length - 1];
      const rows = await getAvailability(from, to);
      setAvailability(rows);
      setShowReschedule(true);
    } catch (e: any) {
      toast.error("Couldn't load availability.");
    } finally {
      setAvailLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!token || !booking || !selDate || !selStart) return;
    setBusy(true);
    try {
      await updateBookingByToken(token, { slot_date: selDate, slot_start: selStart });
      const fresh = await getBookingByToken(token);
      if (fresh) {
        setBooking(fresh);
        sendBookingEmails(fresh, "updated").catch(() => {});
      }
      toast.success("Rescheduled.");
      setShowReschedule(false);
      setSelDate("");
      setSelStart("");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't reschedule.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-[hsl(var(--kar-black))] text-[hsl(var(--kar-cream))] px-6 py-32 min-h-screen">
        <p className="font-cb-sans opacity-70 text-center">Loading...</p>
      </section>
    );
  }

  if (notFound || !booking) {
    return (
      <section className="bg-[hsl(var(--kar-black))] text-[hsl(var(--kar-cream))] px-6 py-32 min-h-screen">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="kar-display text-5xl uppercase">Link invalid.</h1>
          <p className="mt-4 font-cb-sans opacity-70">
            We couldn't find a booking for that link. Check the URL or get in touch.
          </p>
          <Link
            to="/town/karaoke"
            className="mt-8 inline-block kar-condensed text-sm uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream))] px-6 py-3"
          >
            Back to karaoke
          </Link>
        </div>
      </section>
    );
  }

  const cancelled = booking.status === "cancelled" || booking.status === "cancelled_by_venue";
  const editable = !cancelled && isOutsideCutoff(booking.slot_date, booking.slot_start);
  const usable = formatUsableWindow(booking.slot_start);

  return (
    <section className="bg-[hsl(var(--kar-black))] text-[hsl(var(--kar-cream))] px-6 py-24 md:py-32 min-h-screen">
      <div className="mx-auto max-w-3xl">
        <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
          Manage booking
        </p>
        <h1 className="kar-display mt-4 text-5xl md:text-6xl uppercase leading-[0.9]">
          {cancelled ? "Cancelled." : "Your booth."}
        </h1>

        <div className="mt-10 border border-[hsl(var(--kar-blood)/0.5)] bg-[hsl(var(--kar-noir))] p-6 md:p-10 space-y-4">
          <Row label="Status" value={booking.status.replace(/_/g, " ")} />
          <Row label="When" value={formatLongDate(booking.slot_date)} />
          <Row label="Booth window" value={formatSlotWindow(booking.slot_start, booking.slot_end)} />
          <Row label="In the booth" value={`${usable.in} to ${usable.out}`} />
          <Row label="Party" value={`${booking.party_size} guests`} />
          {booking.drink_package && <Row label="Drink" value={booking.drink_package} />}
          {booking.food_package && <Row label="Food" value={booking.food_package} />}
          {booking.notes && <Row label="Notes" value={booking.notes} />}
          {cancelled && booking.cancelled_reason && (
            <Row label="Reason" value={booking.cancelled_reason} />
          )}
        </div>

        {!cancelled && !editable && (
          <p className="mt-8 font-cb-sans text-sm border border-[hsl(var(--kar-gold))] p-4">
            Within {CANCEL_CUTOFF_HOURS} hours of your slot. Call the venue on{" "}
            <a href="tel:+441494673086" className="underline">01494 673086</a> to change.
          </p>
        )}

        {editable && (
          <div className="mt-10 space-y-8">
            <div>
              <p className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
                Change party size
              </p>
              <div className="mt-4 flex items-center gap-6">
                <input
                  type="range"
                  min={PARTY_MIN}
                  max={PARTY_MAX}
                  value={party}
                  onChange={(e) => setParty(Number(e.target.value))}
                  className="flex-1 accent-[hsl(var(--kar-neon))]"
                />
                <span className="kar-display text-3xl text-[hsl(var(--kar-neon))] w-12 text-right">
                  {party}
                </span>
                <button
                  type="button"
                  disabled={busy || party === booking.party_size}
                  onClick={handleUpdateParty}
                  className="kar-condensed text-xs uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream))] px-5 py-3 disabled:opacity-40"
                >
                  Save
                </button>
              </div>
              <p className="mt-2 font-cb-sans text-xs opacity-60">
                Need to swap packages? Email{" "}
                <a href="mailto:neil.fincham-dukes@crazybear.co.uk" className="underline">the venue</a>.
              </p>
            </div>

            <div>
              <p className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
                Reschedule
              </p>
              {!showReschedule ? (
                <button
                  type="button"
                  disabled={availLoading}
                  onClick={loadAvailability}
                  className="mt-4 kar-condensed text-xs uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream))] px-5 py-3 disabled:opacity-40"
                >
                  {availLoading ? "Loading..." : "Pick a new date"}
                </button>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {datesByDay.map((d) => {
                      const hasOpen = availability.some(
                        (r) => r.slot_date === d && r.status === "open",
                      );
                      const { short, date } = formatShortDay(d);
                      const isSel = selDate === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={!hasOpen}
                          onClick={() => { setSelDate(d); setSelStart(""); }}
                          className={`shrink-0 px-3 py-2 border kar-condensed text-xs uppercase tracking-[0.2em] ${
                            isSel
                              ? "border-[hsl(var(--kar-neon))] bg-[hsl(var(--kar-neon))] text-[hsl(var(--kar-black))]"
                              : hasOpen
                              ? "border-[hsl(var(--kar-cream)/0.3)] hover:border-[hsl(var(--kar-cream))]"
                              : "border-[hsl(var(--kar-cream)/0.1)] opacity-30"
                          }`}
                        >
                          {short} {date}
                        </button>
                      );
                    })}
                  </div>
                  {selDate && (
                    <div className="flex flex-wrap gap-2">
                      {slotsForDate.map((s) => {
                        const open = s.status === "open";
                        const isSel = selStart === s.slot_start;
                        return (
                          <button
                            key={s.slot_start}
                            type="button"
                            disabled={!open}
                            onClick={() => setSelStart(s.slot_start)}
                            className={`px-4 py-2 border kar-condensed text-xs uppercase tracking-[0.2em] ${
                              isSel
                                ? "border-[hsl(var(--kar-neon))] bg-[hsl(var(--kar-neon))] text-[hsl(var(--kar-black))]"
                                : open
                                ? "border-[hsl(var(--kar-cream)/0.3)] hover:border-[hsl(var(--kar-cream))]"
                                : "border-[hsl(var(--kar-cream)/0.1)] opacity-30 line-through"
                            }`}
                          >
                            {formatSlotWindow(s.slot_start, s.slot_end)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={busy || !selDate || !selStart}
                      onClick={handleReschedule}
                      className="kar-condensed text-xs uppercase tracking-[0.3em] border border-[hsl(var(--kar-neon))] text-[hsl(var(--kar-neon))] px-5 py-3 disabled:opacity-40"
                    >
                      Confirm swap
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowReschedule(false); setSelDate(""); setSelStart(""); }}
                      className="kar-condensed text-xs uppercase tracking-[0.3em] opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                disabled={busy}
                onClick={handleCancel}
                className="kar-condensed text-sm uppercase tracking-[0.3em] border border-[hsl(var(--kar-blood))] text-[hsl(var(--kar-blood))] px-6 py-3 hover:bg-[hsl(var(--kar-blood))] hover:text-[hsl(var(--kar-cream))] transition-colors disabled:opacity-40"
              >
                Cancel booking
              </button>
            </div>
          </div>
        )}

        <Link
          to="/town/karaoke"
          className="mt-12 inline-block kar-condensed text-xs uppercase tracking-[0.3em] opacity-70 hover:opacity-100"
        >
          ← Back to karaoke
        </Link>
      </div>
    </section>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[7rem,1fr] gap-4 items-start">
    <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-60 pt-1">{label}</span>
    <span className="font-cb-sans text-base md:text-lg">{value}</span>
  </div>
);

export default ManageBooking;
