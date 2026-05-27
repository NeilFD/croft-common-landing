import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BRIEF_MINUTES,
  TURNOVER_MINUTES,
  USABLE_MINUTES,
  buildICS,
  formatLongDate,
  formatSlotWindow,
  formatUsableWindow,
} from "@/lib/karaoke/slots";
import type { KaraokeBooking } from "@/lib/karaoke/api";

// Town Crazy Bear imagery only — no Croft Common or other property assets.
import town01 from "@/assets/cb-carousel-new/town-01.jpg";
import town02 from "@/assets/cb-carousel-new/town-02.jpg";
import town03 from "@/assets/cb-carousel-new/town-03.jpg";
import town04 from "@/assets/cb-carousel-new/town-04.jpg";
import town05 from "@/assets/cb-carousel-new/town-05.jpg";
import town06 from "@/assets/cb-carousel-new/town-06.jpg";
import townRedVelvet from "@/assets/brand-2026/town-red-velvet.jpg";

const STRIP_IMAGES = [town02, town01, town05, townRedVelvet, town03, town04, town06];


const BookingConfirmation = ({
  booking,
  onBookAnother,
}: {
  booking: KaraokeBooking;
  onBookAnother?: () => void;
}) => {
  const usable = formatUsableWindow(booking.slot_start);
  const [icsUrl, setIcsUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = buildICS({
      bookingId: booking.id,
      slotDate: booking.slot_date,
      slotStart: booking.slot_start,
      slotEnd: booking.slot_end,
      guestName: `${booking.guest_first_name} ${booking.guest_last_name ?? ""}`.trim(),
    });
    setIcsUrl(url);
    // Lock body scroll while the takeover is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      URL.revokeObjectURL(url);
    };
  }, [booking]);

  const stripRows = useMemo(() => {
    const rows: string[][] = [];
    for (let i = 0; i < 4; i++) {
      const shifted = [...STRIP_IMAGES.slice(i), ...STRIP_IMAGES.slice(0, i)];
      // Duplicated so the marquee can scroll seamlessly to -50%.
      rows.push([...shifted, ...shifted]);
    }
    return rows;
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Booking confirmed"
      className="fixed inset-0 z-[100] bg-[hsl(var(--kar-black))] text-[hsl(var(--kar-cream))] overflow-y-auto"
    >
      {/* VHS strip layer — louder, full-bleed */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="flex flex-col gap-3 h-full justify-between py-4 opacity-80">
          {stripRows.map((row, idx) => (
            <div
              key={idx}
              className={`flex gap-3 whitespace-nowrap ${idx % 2 === 0 ? "animate-kar-marquee" : "animate-kar-marquee-reverse"}`}
              style={{ animationDuration: `${22 + idx * 5}s` }}
            >
              {row.map((src, i) => (
                <img
                  key={`${idx}-${i}`}
                  src={src}
                  alt=""
                  className="h-32 md:h-44 w-auto object-cover grayscale contrast-150 saturate-0"
                  loading="lazy"
                />
              ))}
            </div>
          ))}
        </div>
        {/* Red wash so the strip reads as VHS, not gallery */}
        <div className="absolute inset-0 bg-[hsl(var(--kar-blood)/0.35)] mix-blend-multiply" />
        {/* Scanlines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, hsl(0 0% 0% / 0.55) 0px, hsl(0 0% 0% / 0.55) 1px, transparent 1px, transparent 3px)",
            animation: "kar-scanlines 1.6s linear infinite",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, hsl(var(--kar-black)) 95%)",
          }}
        />
      </div>

      {/* Foreground */}
      <div className="relative min-h-full flex items-center justify-center px-6 py-20">
        <div className="relative mx-auto max-w-3xl w-full kar-pop-in">
          <div className="kar-vhs-jitter inline-block">
            <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
              ● REC · Confirmed
            </p>
          </div>
          <h2 className="kar-display mt-4 text-5xl md:text-7xl uppercase leading-[0.9]">
            Booth held.<br />
            <span className="kar-neon-text kar-flicker">Warm up the pipes.</span>
          </h2>

          <div className="mt-10 border-2 border-[hsl(var(--kar-neon))] bg-[hsl(var(--kar-black)/0.92)] backdrop-blur-sm p-6 md:p-10 space-y-6 shadow-[0_0_60px_hsl(var(--kar-blood)/0.6)]">
            <Row label="When" value={formatLongDate(booking.slot_date)} />
            <Row
              label="Booth window"
              value={`${formatSlotWindow(booking.slot_start, booking.slot_end)} (${BRIEF_MINUTES} min welcome, ${USABLE_MINUTES} min sing, ${TURNOVER_MINUTES} min clean down)`}
            />
            <Row label="In the booth" value={`${usable.in} to ${usable.out}`} highlight />
            <Row label="Party" value={`${booking.party_size} guests`} />
            {booking.drink_package && <Row label="Drink" value={booking.drink_package} />}
            {booking.food_package && <Row label="Food" value={booking.food_package} />}
            {booking.notes && <Row label="Notes" value={booking.notes} />}
            <Row label="Confirmation sent to" value={booking.guest_email} />
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to={`/town/karaoke/manage/${booking.manage_token}`}
              className="kar-condensed text-sm uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream))] px-6 py-3 hover:bg-[hsl(var(--kar-cream))] hover:text-[hsl(var(--kar-black))] transition-colors"
            >
              Manage booking
            </Link>
            {icsUrl && (
              <a
                href={icsUrl}
                download={`crazy-bear-karaoke-${booking.slot_date}.ics`}
                className="kar-condensed text-sm uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream))] px-6 py-3 hover:bg-[hsl(var(--kar-cream))] hover:text-[hsl(var(--kar-black))] transition-colors"
              >
                Add to calendar
              </a>
            )}
            {onBookAnother && (
              <button
                type="button"
                onClick={onBookAnother}
                className="kar-condensed text-sm uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream)/0.4)] px-6 py-3 hover:border-[hsl(var(--kar-cream))] transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="grid grid-cols-[7rem,1fr] gap-4 items-start">
    <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-60 pt-1">{label}</span>
    <span
      className={`font-cb-sans ${
        highlight
          ? "kar-display text-2xl md:text-3xl text-[hsl(var(--kar-neon))] leading-tight"
          : "text-base md:text-lg"
      }`}
    >
      {value}
    </span>
  </div>
);

export default BookingConfirmation;
