import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BOOKING_WINDOW_DAYS,
  BRIEF_MINUTES,
  PARTY_MAX,
  PARTY_MIN,
  TURNOVER_MINUTES,
  USABLE_MINUTES,
  formatLongDate,
  formatShortDay,
  formatSlotWindow,
  formatUsableWindow,
  nextNDays,
  toIsoDate,
} from "@/lib/karaoke/slots";
import {
  AvailabilityRow,
  KaraokeBooking,
  KaraokePackage,
  createBooking,
  getAvailability,
  getBookingByToken,
  listPackages,
  sendBookingEmails,
} from "@/lib/karaoke/api";
import BookingConfirmation from "./BookingConfirmation";

const BookingPanel = () => {
  const days = useMemo(() => nextNDays(BOOKING_WINDOW_DAYS), []);
  const fromDate = days[0];
  const toDate = days[days.length - 1];

  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [packages, setPackages] = useState<KaraokePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(fromDate);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilityRow | null>(null);
  const [party, setParty] = useState(4);
  const [drinkPkg, setDrinkPkg] = useState<string | null>(null);
  const [foodPkg, setFoodPkg] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<KaraokeBooking | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [avail, pkgs] = await Promise.all([
          getAvailability(fromDate, toDate),
          listPackages(),
        ]);
        if (!alive) return;
        setAvailability(avail);
        setPackages(pkgs);
      } catch (e) {
        console.error("[karaoke] load failed", e);
        toast.error("Couldn't load availability. Refresh and try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fromDate, toDate]);

  const slotsForDay = useMemo(
    () => availability.filter((s) => s.slot_date === selectedDate),
    [availability, selectedDate],
  );

  const drinkPackages = packages.filter((p) => p.kind === "drink");
  const foodPackages = packages.filter((p) => p.kind === "food");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Pick a slot first.");
      return;
    }
    if (selectedSlot.status === "gone") {
      toast.error("That slot just went. Pick another.");
      return;
    }
    if (!firstName.trim()) {
      toast.error("First name needed.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email needed.");
      return;
    }
    setSubmitting(true);
    try {
      const { booking_id, manage_token } = await createBooking({
        slot_date: selectedSlot.slot_date,
        slot_start: selectedSlot.slot_start,
        party_size: party,
        guest_first_name: firstName.trim(),
        guest_last_name: lastName.trim() || undefined,
        guest_email: email.trim().toLowerCase(),
        guest_phone: phone.trim() || undefined,
        food_package_id: foodPkg,
        drink_package_id: drinkPkg,
        notes: notes.trim() || undefined,
      });
      const fresh = await getBookingByToken(manage_token);
      if (!fresh) throw new Error("Booking lookup failed");
      setBooking(fresh);
      sendBookingEmails(fresh, "created").catch((err) =>
        console.error("[karaoke] email send failed", err),
      );
      toast.success("Booth held. Warm up the pipes.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Couldn't take your booking. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setBooking(null);
    setSelectedSlot(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setParty(4);
    setDrinkPkg(null);
    setFoodPkg(null);
  };

  if (booking) {
    return <BookingConfirmation booking={booking} onBookAnother={reset} />;
  }

  return (
    <section
      id="book"
      className="relative bg-[hsl(var(--kar-black))] text-[hsl(var(--kar-cream))] px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
          Reserve
        </p>
        <h2 className="kar-display mt-4 text-5xl md:text-7xl uppercase leading-[0.9]">
          Book your<br />
          <span className="kar-neon-text">slot.</span>
        </h2>
        <p className="mt-6 max-w-xl font-cb-sans text-base md:text-lg opacity-80">
          One booth. Two hours. {BRIEF_MINUTES} min welcome drink, {USABLE_MINUTES} min sing, {TURNOVER_MINUTES} min clean down.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-12 border border-[hsl(var(--kar-blood)/0.5)] bg-[hsl(var(--kar-noir))] p-6 md:p-10 space-y-12"
        >
          {/* 01 Date */}
          <fieldset>
            <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
              01 · Pick a day
            </legend>
            {loading ? (
              <p className="mt-4 font-cb-sans text-sm opacity-60">Loading availability...</p>
            ) : (
              <div className="mt-4 grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-14 gap-2">
                {days.map((iso) => {
                  const meta = formatShortDay(iso);
                  const active = iso === selectedDate;
                  const open = availability.some(
                    (s) => s.slot_date === iso && s.status === "open",
                  );
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!open}
                      onClick={() => {
                        setSelectedDate(iso);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center justify-center py-3 transition-colors ${
                        active
                          ? "bg-[hsl(var(--kar-blood))] text-[hsl(var(--kar-cream))]"
                          : open
                            ? "border border-[hsl(var(--kar-cream)/0.25)] hover:border-[hsl(var(--kar-cream))]"
                            : "border border-[hsl(var(--kar-cream)/0.08)] opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-80">
                        {meta.short}
                      </span>
                      <span className="kar-display text-xl mt-1">{meta.date}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {/* 02 Slot */}
          <fieldset>
            <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
              02 · Pick a slot
            </legend>
            <p className="mt-3 font-cb-sans text-xs opacity-60">
              {BRIEF_MINUTES} min welcome and brief. {USABLE_MINUTES} min in the booth. {TURNOVER_MINUTES} min clean down. One room, one booking.
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {slotsForDay.length === 0 && !loading && (
                <p className="font-cb-sans text-sm opacity-60 col-span-full">
                  No slots configured for this day.
                </p>
              )}
              {slotsForDay.map((s) => {
                const disabled = s.status === "gone";
                const active = selectedSlot?.slot_start === s.slot_start && selectedSlot?.slot_date === s.slot_date;
                return (
                  <button
                    key={`${s.slot_date}-${s.slot_start}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedSlot(s)}
                    aria-pressed={active}
                    className={`group relative flex flex-col items-start gap-3 p-5 text-left transition-all border ${
                      active
                        ? "border-[hsl(var(--kar-neon))] bg-[hsl(var(--kar-blood)/0.25)] shadow-[0_0_24px_hsl(var(--kar-neon)/0.5)]"
                        : disabled
                          ? "border-[hsl(var(--kar-cream)/0.1)] opacity-50 cursor-not-allowed"
                          : "border-[hsl(var(--kar-cream)/0.2)] hover:border-[hsl(var(--kar-neon))] hover:bg-[hsl(var(--kar-blood)/0.12)]"
                    }`}
                  >
                    <span className="kar-display text-2xl md:text-3xl uppercase leading-none">
                      {formatSlotWindow(s.slot_start, s.slot_end)}
                    </span>
                    <span className="kar-condensed text-xs tracking-[0.25em] uppercase opacity-70">
                      {s.subtitle ?? ""}
                    </span>
                    <span className={`mt-2 inline-block kar-condensed text-[10px] tracking-[0.3em] uppercase px-2 py-1 border ${
                      disabled
                        ? "border-[hsl(var(--kar-blood))] text-[hsl(var(--kar-blood))]"
                        : "border-[hsl(var(--kar-cream))] text-[hsl(var(--kar-cream))]"
                    }`}>
                      {disabled ? "Booked" : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 03 Party size */}
          <fieldset>
            <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
              03 · Party size
            </legend>
            <div className="mt-4 flex items-center gap-6">
              <input
                type="range"
                min={PARTY_MIN}
                max={PARTY_MAX}
                value={party}
                onChange={(e) => setParty(Number(e.target.value))}
                className="flex-1 accent-[hsl(var(--kar-neon))]"
              />
              <span className="kar-display text-4xl text-[hsl(var(--kar-neon))] w-16 text-right">
                {party}
              </span>
            </div>
            <p className="mt-2 font-cb-sans text-xs opacity-60">
              Min {PARTY_MIN}, max {PARTY_MAX} per booth.
            </p>
          </fieldset>

          {/* 04 F&B */}
          <fieldset>
            <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
              04 · Food and drink (optional)
            </legend>
            <div className="mt-4 grid md:grid-cols-2 gap-8">
              <PackageGroup
                title="Drink package"
                packages={drinkPackages}
                value={drinkPkg}
                onChange={setDrinkPkg}
              />
              <PackageGroup
                title="Food package"
                packages={foodPackages}
                value={foodPkg}
                onChange={setFoodPkg}
              />
            </div>
          </fieldset>

          {/* 05 Details */}
          <fieldset>
            <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
              05 · Your details
            </legend>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField label="First name" value={firstName} onChange={setFirstName} required />
              <TextField label="Last name" value={lastName} onChange={setLastName} />
              <TextField label="Email" value={email} onChange={setEmail} type="email" required />
              <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
              <div className="md:col-span-2">
                <TextField
                  label="Anything we should know? (optional)"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Birthdays, allergies, dedications"
                />
              </div>
            </div>
          </fieldset>

          {/* 06 Deposit */}
          <fieldset className="border border-dashed border-[hsl(var(--kar-neon)/0.4)] p-5">
            <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70 px-2">
              06 · Deposit
            </legend>
            <p className="font-cb-sans text-sm opacity-80">
              No card needed today. A deposit per head will be required when card payments go live.
              Pricing tbc.
            </p>
          </fieldset>

          {/* Submit */}
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-6">
            <p className="font-cb-sans text-sm opacity-70">
              {selectedSlot
                ? `${formatLongDate(selectedDate)} · ${formatSlotWindow(selectedSlot.slot_start, selectedSlot.slot_end)} · party of ${party}`
                : `${formatLongDate(selectedDate)} · pick a slot above`}
            </p>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="kar-cta kar-flicker inline-flex items-center justify-center gap-3 px-10 py-4 kar-condensed text-base uppercase tracking-[0.3em] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Holding..." : "Reserve the booth"}
              <span aria-hidden="true">{submitting ? "" : "→"}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const PackageGroup = ({
  title,
  packages,
  value,
  onChange,
}: {
  title: string;
  packages: KaraokePackage[];
  value: string | null;
  onChange: (v: string | null) => void;
}) => (
  <div>
    <p className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-70">{title}</p>
    <div className="mt-3 space-y-2">
      <PackageRow
        active={value === null}
        onClick={() => onChange(null)}
        name="No package"
        description="Order at the bar."
        priceLabel=""
      />
      {packages.map((p) => (
        <PackageRow
          key={p.id}
          active={value === p.id}
          onClick={() => onChange(p.id)}
          name={p.name}
          description={p.description ?? ""}
          priceLabel={
            p.price_per_person_pennies != null
              ? `£${(p.price_per_person_pennies / 100).toFixed(2)} / head`
              : "Pricing tbc"
          }
        />
      ))}
    </div>
  </div>
);

const PackageRow = ({
  active,
  onClick,
  name,
  description,
  priceLabel,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  description: string;
  priceLabel: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-start justify-between gap-4 p-3 text-left border transition-colors ${
      active
        ? "border-[hsl(var(--kar-neon))] bg-[hsl(var(--kar-blood)/0.18)]"
        : "border-[hsl(var(--kar-cream)/0.18)] hover:border-[hsl(var(--kar-cream)/0.55)]"
    }`}
  >
    <span>
      <span className="block kar-condensed text-sm uppercase tracking-[0.2em]">{name}</span>
      {description && (
        <span className="block font-cb-sans text-xs opacity-70 mt-1">{description}</span>
      )}
    </span>
    <span className="kar-condensed text-[10px] tracking-[0.25em] uppercase opacity-70 whitespace-nowrap pt-1">
      {priceLabel}
    </span>
  </button>
);

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-70">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="mt-2 w-full bg-transparent border-b border-[hsl(var(--kar-cream)/0.35)] focus:border-[hsl(var(--kar-neon))] outline-none py-2 font-cb-sans text-base placeholder:opacity-40"
    />
  </label>
);

export default BookingPanel;
