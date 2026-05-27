// Karaoke booking timing + helpers.
// Single room. 2-hour booking window = 15 min welcome + 90 min sing + 15 min clean-down.

export const SLOT_TOTAL_MINUTES = 120;
export const BRIEF_MINUTES = 15;
export const TURNOVER_MINUTES = 15;
export const USABLE_MINUTES = SLOT_TOTAL_MINUTES - BRIEF_MINUTES - TURNOVER_MINUTES; // 90
export const PARTY_MIN = 2;
export const PARTY_MAX = 16;
export const CANCEL_CUTOFF_HOURS = 24;
export const BOOKING_WINDOW_DAYS = 28;

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:00:00" -> "2 pm", "14:30:00" -> "2.30 pm" */
export const formatTime12 = (time: string): string => {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "pm" : "am";
  const display = ((h + 11) % 12) + 1;
  return m === 0 ? `${display} ${period}` : `${display}.${pad(m)} ${period}`;
};

/** "12:00:00" + "14:00:00" -> "12 to 2 pm" */
export const formatSlotWindow = (start: string, end: string): string => {
  const startH = parseInt(start.split(":")[0], 10);
  const endH = parseInt(end.split(":")[0], 10);
  const startPeriod = startH >= 12 ? "pm" : "am";
  const endPeriod = endH >= 12 ? "pm" : "am";
  if (startPeriod === endPeriod) {
    const sStr = formatTime12(start).replace(/ (am|pm)$/, "");
    return `${sStr} to ${formatTime12(end)}`;
  }
  return `${formatTime12(start)} to ${formatTime12(end)}`;
};

/** Given slot start "12:00:00", return usable window display "12.15 to 1.45 pm" */
export const formatUsableWindow = (start: string): { in: string; out: string; window: string } => {
  const [h, m] = start.split(":").map(Number);
  const startMins = h * 60 + m + BRIEF_MINUTES;
  const endMins = startMins + USABLE_MINUTES;
  const usableStart = `${pad(Math.floor(startMins / 60))}:${pad(startMins % 60)}:00`;
  const usableEnd = `${pad(Math.floor(endMins / 60))}:${pad(endMins % 60)}:00`;
  return {
    in: formatTime12(usableStart),
    out: formatTime12(usableEnd),
    window: formatSlotWindow(usableStart, usableEnd),
  };
};

export const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
};

export const nextNDays = (n: number, from = new Date()): string[] => {
  const base = new Date(from);
  base.setHours(0, 0, 0, 0);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(toIsoDate(d));
  }
  return out;
};

export const formatLongDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatShortDay = (iso: string): { short: string; date: number } => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { short: dayNames[dt.getDay()], date: dt.getDate() };
};

/** True if `slot_date + slot_start` is at least cutoffHours from now. */
export const isOutsideCutoff = (
  slotDate: string,
  slotStart: string,
  cutoffHours = CANCEL_CUTOFF_HOURS,
): boolean => {
  const [y, mo, d] = slotDate.split("-").map(Number);
  const [h, mi] = slotStart.split(":").map(Number);
  const slot = new Date(y, mo - 1, d, h, mi, 0, 0);
  return slot.getTime() - Date.now() >= cutoffHours * 3600 * 1000;
};

/** Generate an .ics file blob URL for the slot window. */
export const buildICS = (opts: {
  bookingId: string;
  slotDate: string;
  slotStart: string;
  slotEnd: string;
  guestName: string;
}): string => {
  const dtStart = opts.slotDate.replace(/-/g, "") + "T" + opts.slotStart.replace(/:/g, "").slice(0, 6);
  const dtEnd = opts.slotDate.replace(/-/g, "") + "T" + opts.slotEnd.replace(/:/g, "").slice(0, 6);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Crazy Bear Town//Karaoke//EN",
    "BEGIN:VEVENT",
    `UID:karaoke-${opts.bookingId}@crazybear.app`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Karaoke booth at Crazy Bear Town`,
    `DESCRIPTION:Your 2-hour booth. 15 min welcome drink, 90 min sing, 15 min clean down. Booking for ${opts.guestName}.`,
    `LOCATION:Crazy Bear Town, Beaconsfield`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
};
