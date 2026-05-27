import { useEffect, useMemo, useState } from "react";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSlotWindow, formatLongDate } from "@/lib/karaoke/slots";
import { sendBookingEmails, type KaraokeBooking } from "@/lib/karaoke/api";

interface SlotRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string | null;
  subtitle: string | null;
  is_active: boolean;
  sort_order: number;
}

interface PackageRow {
  id: string;
  kind: "food" | "drink";
  name: string;
  description: string | null;
  price_per_person_pennies: number | null;
  is_active: boolean;
  sort_order: number;
}

interface SettingsRow {
  venue_email: string;
  cancellation_cutoff_hours: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    confirmed: "bg-green-100 text-green-900 border-green-200",
    pending_payment: "bg-amber-100 text-amber-900 border-amber-200",
    cancelled: "bg-zinc-200 text-zinc-700 border-zinc-300",
    cancelled_by_venue: "bg-red-100 text-red-900 border-red-200",
    no_show: "bg-zinc-200 text-zinc-700 border-zinc-300",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status.replace(/_/g, " ")}</Badge>;
};

import KaraokeCalendar from "@/components/management/KaraokeCalendar";

export default function KaraokeManagement() {
  return (
    <ManagementLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display uppercase tracking-wide">Karaoke</h1>
          <p className="text-muted-foreground font-cb-sans">Single booth. 2 hour slots. 90 minute sing.</p>
        </div>
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar"><KaraokeCalendar /></TabsContent>
          <TabsContent value="packages"><PackagesTab /></TabsContent>
          <TabsContent value="settings">
            <div className="space-y-6">
              <SettingsTab />
              <SlotsTab />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ManagementLayout>
  );
}

/* ---------------- Bookings ---------------- */

function BookingsTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<KaraokeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("karaoke_bookings" as any)
      .select("id, slot_date, slot_start, slot_end, guest_first_name, guest_last_name, guest_email, guest_phone, party_size, food_package_id, drink_package_id, notes, status, deposit_status, manage_token, cancelled_at, cancelled_reason, created_at")
      .order("slot_date", { ascending: false })
      .order("slot_start", { ascending: false })
      .limit(500);
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setRows(((data as unknown) as KaraokeBooking[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.guest_first_name} ${r.guest_last_name ?? ""} ${r.guest_email} ${r.guest_phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, search]);

  const exportCsv = () => {
    const headers = ["Date", "Slot", "Guest", "Email", "Phone", "Party", "Status", "Notes"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const guest = `${r.guest_first_name} ${r.guest_last_name ?? ""}`.trim();
      const row = [r.slot_date, `${r.slot_start} to ${r.slot_end}`, guest, r.guest_email, r.guest_phone ?? "", r.party_size, r.status, (r.notes ?? "").replace(/\n/g, " ")];
      lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karaoke-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cancelByVenue = async (b: KaraokeBooking) => {
    const reason = window.prompt("Reason for cancelling on behalf of guest?");
    if (!reason) return;
    const { data, error } = await supabase.rpc("management_cancel_karaoke_booking" as any, {
      p_id: b.id,
      p_reason: reason,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    const updated = { ...(data as any) } as KaraokeBooking;
    await sendBookingEmails(updated, "cancelled");
    toast({ title: "Cancelled", description: "Guest and venue notified." });
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <CardTitle>All bookings</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search guest, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md px-2 text-sm bg-background">
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_payment">Pending payment</option>
            <option value="cancelled">Cancelled</option>
            <option value="cancelled_by_venue">Cancelled by venue</option>
            <option value="no_show">No show</option>
          </select>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatLongDate(r.slot_date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatSlotWindow(r.slot_start, r.slot_end)}</TableCell>
                  <TableCell>{r.guest_first_name} {r.guest_last_name}</TableCell>
                  <TableCell className="text-xs">
                    <div>{r.guest_email}</div>
                    {r.guest_phone && <div className="text-muted-foreground">{r.guest_phone}</div>}
                  </TableCell>
                  <TableCell>{r.party_size}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <a href={`/town/karaoke/manage/${r.manage_token}`} target="_blank" rel="noreferrer" className="text-xs underline">Guest view</a>
                    {!["cancelled", "cancelled_by_venue"].includes(r.status) && (
                      <Button size="sm" variant="outline" onClick={() => cancelByVenue(r)}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Slots ---------------- */

function SlotsTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("karaoke_slots" as any)
      .select("id, day_of_week, start_time, end_time, label, subtitle, is_active, sort_order")
      .order("day_of_week").order("start_time");
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    setRows(((data as unknown) as SlotRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (slot: SlotRow) => {
    const { error } = await supabase.from("karaoke_slots" as any).update({ is_active: !slot.is_active }).eq("id", slot.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Weekly slot schedule</CardTitle></CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{DAYS[s.day_of_week]}</TableCell>
                  <TableCell>{formatSlotWindow(s.start_time, s.end_time)}</TableCell>
                  <TableCell className="text-sm">
                    <div>{s.label}</div>
                    <div className="text-muted-foreground text-xs">{s.subtitle}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch checked={s.is_active} onCheckedChange={() => toggle(s)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Packages ---------------- */

function PackagesTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PackageRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("karaoke_packages" as any)
      .select("id, kind, name, description, price_per_person_pennies, is_active, sort_order")
      .order("kind").order("sort_order");
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    setRows(((data as unknown) as PackageRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      kind: editing.kind,
      name: editing.name,
      description: editing.description,
      price_per_person_pennies: editing.price_per_person_pennies,
      is_active: editing.is_active,
      sort_order: editing.sort_order,
    };
    const { error } = editing.id
      ? await supabase.from("karaoke_packages" as any).update(payload).eq("id", editing.id)
      : await supabase.from("karaoke_packages" as any).insert(payload);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setEditing(null);
    load();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>F&B packages</CardTitle>
          <Button size="sm" onClick={() => setEditing({ id: "", kind: "drink", name: "", description: "", price_per_person_pennies: null, is_active: true, sort_order: 0 })}>
            New package
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price pp</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="capitalize">{p.kind}</TableCell>
                    <TableCell>
                      <div>{p.name}</div>
                      {!p.is_active && <span className="text-xs text-muted-foreground">inactive</span>}
                    </TableCell>
                    <TableCell>{p.price_per_person_pennies == null ? "TBC" : `£${(p.price_per_person_pennies / 100).toFixed(2)}`}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? "Edit" : "New"} package</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Kind</Label>
              <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as "food" | "drink" })} className="block w-full border rounded-md px-2 py-2 bg-background">
                <option value="drink">Drink</option>
                <option value="food">Food</option>
              </select>
            </div>
            <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div>
              <Label>Price per person (pennies, blank = TBC)</Label>
              <Input
                type="number"
                value={editing.price_per_person_pennies ?? ""}
                onChange={(e) => setEditing({ ...editing, price_per_person_pennies: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> <span className="text-sm">Active</span></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab() {
  const { toast } = useToast();
  const [row, setRow] = useState<SettingsRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("karaoke_settings" as any).select("venue_email, cancellation_cutoff_hours").eq("id", 1).single();
      if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
      setRow(data as unknown as SettingsRow);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!row) return;
    const { error } = await supabase.from("karaoke_settings" as any).update({
      venue_email: row.venue_email,
      cancellation_cutoff_hours: row.cancellation_cutoff_hours,
    }).eq("id", 1);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
  };

  if (loading || !row) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>Karaoke settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Venue email (reservation sheets)</Label>
          <Input type="email" value={row.venue_email} onChange={(e) => setRow({ ...row, venue_email: e.target.value })} />
        </div>
        <div>
          <Label>Cancellation cut-off (hours before slot)</Label>
          <Input type="number" min={1} value={row.cancellation_cutoff_hours} onChange={(e) => setRow({ ...row, cancellation_cutoff_hours: Number(e.target.value) })} />
        </div>
        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}
