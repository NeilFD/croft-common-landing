import { useMemo, useState } from "react";
import { toast } from "sonner";

const SLOTS = [
  { id: "12-2", label: "12 – 2 pm", subtitle: "Lunch run" },
  { id: "2-4", label: "2 – 4 pm", subtitle: "Matinee" },
  { id: "4-6", label: "4 – 6 pm", subtitle: "Pre-dinner" },
  { id: "6-8", label: "6 – 8 pm", subtitle: "Headliner" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDay = (d: Date) => ({
  short: DAY_NAMES[d.getDay()],
  date: d.getDate(),
  full: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
  iso: d.toISOString().slice(0, 10),
});

// Deterministic mock availability based on day offset + slot id.
const statusFor = (dayOffset: number, slotId: string): "open" | "few" | "gone" => {
  const seed = (dayOffset * 7 + slotId.length * 3 + slotId.charCodeAt(0)) % 10;
  if (dayOffset === 0 && slotId === "12-2") return "gone";
  if (seed < 2) return "gone";
  if (seed < 5) return "few";
  return "open";
};

const statusCopy = {
  open: { label: "Available", classes: "border-[hsl(var(--kar-cream))] text-[hsl(var(--kar-cream))]" },
  few:  { label: "Last few",  classes: "border-[hsl(var(--kar-gold))] text-[hsl(var(--kar-gold))]" },
  gone: { label: "Gone",      classes: "border-[hsl(var(--kar-blood))] text-[hsl(var(--kar-blood))]" },
} as const;

const BookingPanel = () => {
  const days = useMemo(() => {
    const out = [] as Array<ReturnType<typeof formatDay> & { offset: number }>;
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push({ ...formatDay(d), offset: i });
    }
    return out;
  }, []);

  const [dayOffset, setDayOffset] = useState(0);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState(4);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedDay = days[dayOffset];
  const selectedSlot = SLOTS.find((s) => s.id === slotId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotId) {
      toast.error("Pick a slot first.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      toast.error("We need a name and an email.");
      return;
    }
    const payload = {
      day: selectedDay.iso,
      dayLabel: selectedDay.full,
      slot: slotId,
      slotLabel: selectedSlot?.label,
      name: name.trim(),
      email: email.trim(),
      party,
      message: message.trim(),
    };
    console.log("[karaoke booking — mock]", payload);
    setSubmitted(true);
    toast.success("Booth held. We'll be in touch.");
  };

  const reset = () => {
    setSubmitted(false);
    setSlotId(null);
    setName("");
    setEmail("");
    setMessage("");
    setParty(4);
  };

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
          Two-hour booths, every day, noon till late. Pick a day. Pick a time.
        </p>

        {submitted ? (
          <div className="mt-12 border border-[hsl(var(--kar-neon))] bg-[hsl(var(--kar-noir))] p-10 md:p-14">
            <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
              Confirmed
            </p>
            <h3 className="kar-display mt-4 text-4xl md:text-5xl uppercase leading-[0.95]">
              Booth held.<br />We'll be in touch.
            </h3>
            <p className="mt-6 font-cb-sans text-base opacity-80">
              {selectedDay.full} · {selectedSlot?.label} · party of {party}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-10 kar-condensed text-sm uppercase tracking-[0.3em] border border-[hsl(var(--kar-cream))] px-6 py-3 hover:bg-[hsl(var(--kar-cream))] hover:text-[hsl(var(--kar-black))] transition-colors"
            >
              Book another
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-12 border border-[hsl(var(--kar-blood)/0.5)] bg-[hsl(var(--kar-noir))] p-6 md:p-10"
          >
            {/* Step 1 — day */}
            <fieldset>
              <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
                01 · Pick a day
              </legend>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const active = d.offset === dayOffset;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => {
                        setDayOffset(d.offset);
                        setSlotId(null);
                      }}
                      className={`flex flex-col items-center justify-center py-4 transition-colors ${
                        active
                          ? "bg-[hsl(var(--kar-blood))] text-[hsl(var(--kar-cream))]"
                          : "border border-[hsl(var(--kar-cream)/0.25)] hover:border-[hsl(var(--kar-cream))]"
                      }`}
                    >
                      <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-80">
                        {d.short}
                      </span>
                      <span className="kar-display text-2xl mt-1">{d.date}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Step 2 — slot */}
            <fieldset className="mt-10">
              <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
                02 · Pick a slot
              </legend>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {SLOTS.map((s) => {
                  const status = statusFor(dayOffset, s.id);
                  const cfg = statusCopy[status];
                  const disabled = status === "gone";
                  const active = slotId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => !disabled && setSlotId(s.id)}
                      disabled={disabled}
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
                        {s.label}
                      </span>
                      <span className="kar-condensed text-xs tracking-[0.25em] uppercase opacity-70">
                        {s.subtitle}
                      </span>
                      <span className={`mt-2 inline-block kar-condensed text-[10px] tracking-[0.3em] uppercase px-2 py-1 border ${cfg.classes}`}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Step 3 — details */}
            <fieldset className="mt-10">
              <legend className="kar-condensed text-xs tracking-[0.4em] uppercase opacity-70">
                03 · Your details
              </legend>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-70">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2 w-full bg-transparent border-b border-[hsl(var(--kar-cream)/0.35)] focus:border-[hsl(var(--kar-neon))] outline-none py-2 font-cb-sans text-base"
                  />
                </label>
                <label className="block">
                  <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-70">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2 w-full bg-transparent border-b border-[hsl(var(--kar-cream)/0.35)] focus:border-[hsl(var(--kar-neon))] outline-none py-2 font-cb-sans text-base"
                  />
                </label>
                <label className="block">
                  <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-70">Party size</span>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min={2}
                      max={12}
                      value={party}
                      onChange={(e) => setParty(Number(e.target.value))}
                      className="flex-1 accent-[hsl(var(--kar-neon))]"
                    />
                    <span className="kar-display text-2xl text-[hsl(var(--kar-neon))] w-10 text-right">
                      {party}
                    </span>
                  </div>
                </label>
                <label className="block">
                  <span className="kar-condensed text-[10px] tracking-[0.3em] uppercase opacity-70">Anything we should know? (optional)</span>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Birthdays, allergies, dedications…"
                    className="mt-2 w-full bg-transparent border-b border-[hsl(var(--kar-cream)/0.35)] focus:border-[hsl(var(--kar-neon))] outline-none py-2 font-cb-sans text-base placeholder:opacity-40"
                  />
                </label>
              </div>
            </fieldset>

            <div className="mt-10 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-6">
              <p className="font-cb-sans text-sm opacity-70">
                {selectedSlot
                  ? `${selectedDay.full} · ${selectedSlot.label} · party of ${party}`
                  : `${selectedDay.full} · pick a slot above`}
              </p>
              <button
                type="submit"
                className="kar-cta kar-flicker inline-flex items-center justify-center gap-3 px-10 py-4 kar-condensed text-base uppercase tracking-[0.3em]"
              >
                Reserve the booth
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default BookingPanel;
