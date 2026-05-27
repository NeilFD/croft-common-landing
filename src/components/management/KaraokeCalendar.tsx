import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatSlotWindow, formatLongDate } from "@/lib/karaoke/slots";
import { sendBookingEmails, type KaraokeBooking } from "@/lib/karaoke/api";

type ViewMode = "day" | "week" | "month";

interface SlotTemplate {
  id: string;
  day_of_week: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  label: string | null;
  subtitle: string | null;
  is_active: boolean;
  sort_order: number;
}

interface CellSlot {
  date: Date;
  template: SlotTemplate;
  booking?: KaraokeBooking;
}

const fmtDay = (d: Date) => format(d, "yyyy-MM-dd");
const startKey = (t: string) => t.slice(0, 5); // "12:00:00" → "12:00"

const statusTone: Record<KaraokeBooking["status"], string> = {
  confirmed: "bg-foreground text-background border-foreground",
  pending_payment: "bg-amber-100 text-amber-900 border-amber-300",
  cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200 line-through",
  cancelled_by_venue: "bg-red-50 text-red-900 border-red-200 line-through",
  no_show: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function KaraokeCalendar() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [bookings, setBookings] = useState<KaraokeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KaraokeBooking | null>(null);

  // Window we need to load
  const range = useMemo(() => {
    if (view === "day") return { from: cursor, to: cursor };
    if (view === "week") {
      const from = startOfWeek(cursor, { weekStartsOn: 1 });
      return { from, to: endOfWeek(cursor, { weekStartsOn: 1 }) };
    }
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    return {
      from: startOfWeek(monthStart, { weekStartsOn: 1 }),
      to: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    };
  }, [view, cursor]);

  const load = async () => {
    setLoading(true);
    const [{ data: tpl }, { data: bk, error: bkErr }] = await Promise.all([
      supabase
        .from("karaoke_slots" as any)
        .select("id, day_of_week, start_time, end_time, label, subtitle, is_active, sort_order")
        .order("day_of_week")
        .order("start_time"),
      supabase
        .from("karaoke_bookings" as any)
        .select(
          "id, slot_date, slot_start, slot_end, guest_first_name, guest_last_name, guest_email, guest_phone, party_size, food_package_id, drink_package_id, notes, status, deposit_status, manage_token, cancelled_at, cancelled_reason, created_at",
        )
        .gte("slot_date", fmtDay(range.from))
        .lte("slot_date", fmtDay(range.to))
        .order("slot_date")
        .order("slot_start"),
    ]);
    if (bkErr) toast({ title: "Failed to load bookings", description: bkErr.message, variant: "destructive" });
    setTemplates(((tpl as unknown) as SlotTemplate[]) ?? []);
    setBookings(((bk as unknown) as KaraokeBooking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from.getTime(), range.to.getTime()]);

  // Build a quick lookup: bookings by `${date}_${start}`
  const bookingByKey = useMemo(() => {
    const m = new Map<string, KaraokeBooking>();
    for (const b of bookings) {
      m.set(`${b.slot_date}_${startKey(b.slot_start)}`, b);
    }
    return m;
  }, [bookings]);

  // All slot start times (sorted) — the rows in week/day grid
  const slotStarts = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => set.add(startKey(t.start_time)));
    return Array.from(set).sort();
  }, [templates]);

  const templateFor = (date: Date, start: string): SlotTemplate | undefined => {
    return templates.find(
      (t) => t.day_of_week === date.getDay() && startKey(t.start_time) === start,
    );
  };

  const cancel = async (b: KaraokeBooking) => {
    const reason = window.prompt("Reason for cancelling on behalf of guest?");
    if (!reason) return;
    const { data, error } = await supabase.rpc("management_cancel_karaoke_booking" as any, {
      p_id: b.id,
      p_reason: reason,
    });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    await sendBookingEmails(data as unknown as KaraokeBooking, "cancelled");
    toast({ title: "Cancelled", description: "Guest and venue notified." });
    setSelected(null);
    load();
  };

  const headerLabel = useMemo(() => {
    if (view === "day") return format(cursor, "EEEE d MMMM yyyy");
    if (view === "week") {
      const from = startOfWeek(cursor, { weekStartsOn: 1 });
      const to = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`;
    }
    return format(cursor, "MMMM yyyy");
  }, [cursor, view]);

  const move = (dir: -1 | 1) => {
    if (view === "day") setCursor(addDays(cursor, dir));
    else if (view === "week") setCursor(addWeeks(cursor, dir));
    else setCursor(addMonths(cursor, dir));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => move(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="font-display uppercase tracking-wide text-lg ml-2">{headerLabel}</h2>
        </div>
        <div className="inline-flex border border-border rounded-md overflow-hidden">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-cb-sans uppercase tracking-wide transition-colors ${
                view === v ? "bg-foreground text-background" : "bg-background hover:bg-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : view === "month" ? (
        <MonthView
          start={range.from}
          end={range.to}
          monthAnchor={cursor}
          bookings={bookings}
          onSelectDay={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      ) : (
        <WeekOrDayGrid
          start={view === "week" ? startOfWeek(cursor, { weekStartsOn: 1 }) : cursor}
          days={view === "week" ? 7 : 1}
          slotStarts={slotStarts}
          templateFor={templateFor}
          bookingByKey={bookingByKey}
          onSelect={(b) => setSelected(b)}
        />
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking detail</DialogTitle>
          </DialogHeader>
          {selected && <BookingDetail booking={selected} onCancel={() => cancel(selected)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------ Week / Day grid ------------ */

function WeekOrDayGrid({
  start,
  days,
  slotStarts,
  templateFor,
  bookingByKey,
  onSelect,
}: {
  start: Date;
  days: number;
  slotStarts: string[];
  templateFor: (date: Date, start: string) => SlotTemplate | undefined;
  bookingByKey: Map<string, KaraokeBooking>;
  onSelect: (b: KaraokeBooking) => void;
}) {
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));

  if (slotStarts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">
          No slot windows configured. Add weekly windows in Settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div
        className="grid bg-muted/40 border-b border-border"
        style={{ gridTemplateColumns: `7rem repeat(${days}, minmax(0, 1fr))` }}
      >
        <div className="p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slot</div>
        {dates.map((d) => (
          <div
            key={d.toISOString()}
            className={`p-2 text-center border-l border-border ${isToday(d) ? "bg-foreground text-background" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">{format(d, "EEE")}</div>
            <div className="font-display text-lg leading-none">{format(d, "d")}</div>
          </div>
        ))}
      </div>

      {slotStarts.map((s) => (
        <div
          key={s}
          className="grid border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: `7rem repeat(${days}, minmax(0, 1fr))` }}
        >
          <div className="p-2 text-xs font-cb-sans border-r border-border bg-muted/20">
            {format(parseISO(`2000-01-01T${s}:00`), "h:mm a")}
          </div>
          {dates.map((d) => {
            const tpl = templateFor(d, s);
            const booking = bookingByKey.get(`${fmtDay(d)}_${s}`);
            return (
              <Cell
                key={`${d.toISOString()}-${s}`}
                date={d}
                template={tpl}
                booking={booking}
                onClick={booking ? () => onSelect(booking) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Cell({
  date,
  template,
  booking,
  onClick,
}: {
  date: Date;
  template?: SlotTemplate;
  booking?: KaraokeBooking;
  onClick?: () => void;
}) {
  // No slot configured for this weekday at this time
  if (!template) {
    return <div className="border-l border-border bg-muted/10 min-h-[68px]" />;
  }
  // Slot exists but turned off in weekly schedule
  if (!template.is_active) {
    return (
      <div className="border-l border-border bg-zinc-50 min-h-[68px] p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Closed
      </div>
    );
  }
  if (booking) {
    const guest = `${booking.guest_first_name} ${booking.guest_last_name ?? ""}`.trim();
    return (
      <button
        type="button"
        onClick={onClick}
        className={`border-l border-border min-h-[68px] p-2 text-left transition-colors ${statusTone[booking.status]}`}
      >
        <div className="text-xs font-cb-sans font-semibold truncate">{guest}</div>
        <div className="text-[11px] opacity-80 truncate">
          Party of {booking.party_size}
        </div>
        <div className="text-[10px] uppercase tracking-[0.15em] opacity-70 mt-0.5">
          {booking.status.replace(/_/g, " ")}
        </div>
      </button>
    );
  }
  return (
    <div className="border-l border-border min-h-[68px] p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
      <span className="opacity-60">Open</span>
      {template.label && <div className="text-[10px] normal-case tracking-normal opacity-50 mt-1 truncate">{template.label}</div>}
    </div>
  );
}

/* ------------ Month view ------------ */

function MonthView({
  start,
  end,
  monthAnchor,
  bookings,
  onSelectDay,
}: {
  start: Date;
  end: Date;
  monthAnchor: Date;
  bookings: KaraokeBooking[];
  onSelectDay: (d: Date) => void;
}) {
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  const bookingsByDay = new Map<string, KaraokeBooking[]>();
  for (const b of bookings) {
    const arr = bookingsByDay.get(b.slot_date) ?? [];
    arr.push(b);
    bookingsByDay.set(b.slot_date, arr);
  }
  const weekHeader = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
        {weekHeader.map((w) => (
          <div key={w} className="p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const list = (bookingsByDay.get(fmtDay(day)) ?? []).filter(
            (b) => !["cancelled", "cancelled_by_venue"].includes(b.status),
          );
          const outOfMonth = !isSameMonth(day, monthAnchor);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`min-h-[88px] border-l border-b border-border p-2 text-left transition-colors hover:bg-muted/40 ${outOfMonth ? "bg-muted/10 text-muted-foreground" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-display text-sm leading-none ${isToday(day) ? "bg-foreground text-background px-1.5 py-0.5" : ""}`}
                >
                  {format(day, "d")}
                </span>
                {list.length > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {list.length}
                  </Badge>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {list.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="text-[10px] truncate bg-foreground text-background px-1 py-0.5"
                  >
                    {startKey(b.slot_start)} {b.guest_first_name}
                  </div>
                ))}
                {list.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{list.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------ Booking detail in dialog ------------ */

function BookingDetail({
  booking,
  onCancel,
}: {
  booking: KaraokeBooking;
  onCancel: () => void;
}) {
  const guest = `${booking.guest_first_name} ${booking.guest_last_name ?? ""}`.trim();
  const cancellable = !["cancelled", "cancelled_by_venue"].includes(booking.status);
  return (
    <div className="space-y-3 text-sm font-cb-sans">
      <Row label="Guest" value={guest} />
      <Row label="Email" value={booking.guest_email} />
      {booking.guest_phone && <Row label="Phone" value={booking.guest_phone} />}
      <Row label="Date" value={formatLongDate(booking.slot_date)} />
      <Row label="Slot" value={formatSlotWindow(booking.slot_start, booking.slot_end)} />
      <Row label="Party" value={`${booking.party_size} guests`} />
      {booking.food_package && <Row label="Food" value={booking.food_package} />}
      {booking.drink_package && <Row label="Drink" value={booking.drink_package} />}
      {booking.notes && <Row label="Notes" value={booking.notes} />}
      <Row label="Status" value={booking.status.replace(/_/g, " ")} />
      <div className="flex gap-2 pt-3 border-t border-border">
        <a
          href={`/town/karaoke/manage/${booking.manage_token}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline self-center"
        >
          Open guest manage view
        </a>
        <div className="ml-auto" />
        {cancellable && (
          <Button size="sm" variant="destructive" onClick={onCancel}>
            Cancel booking
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem,1fr] gap-3 items-start">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground pt-0.5">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
