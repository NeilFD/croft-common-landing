import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type Release = {
  id: string;
  month_key: string;
  screening_date: string;
  doors_time: string;
  screening_time: string;
  title: string | null;
};

type Booking = {
  id: string;
  release_id: string;
  user_id: string | null;
  quantity: number;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string;
  wallet_token: string | null;
};

type BookingWithTickets = Booking & {
  release: Release;
  ticketNumbers: number[];
  primaryName: string;
  guestName?: string;
};

const SUPABASE_URL = "https://szokkwlleqndyiojhsll.supabase.co";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const splitNames = (combined: string | null) => {
  if (!combined) return { primary: "Guest", guest: undefined as string | undefined };
  const parts = combined.split(/\s*\+\s*/);
  return { primary: parts[0]?.trim() || "Guest", guest: parts[1]?.trim() };
};

export const CinemaBookings: React.FC = () => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: releases } = useQuery({
    queryKey: ["cinema-releases-for-bookings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cinema_releases")
        .select("id, month_key, screening_date, doors_time, screening_time, title")
        .order("screening_date", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Release[];
    },
  });

  const { data: bookings, refetch } = useQuery({
    queryKey: ["cinema-bookings-admin", releases?.map((r) => r.id).join(",")],
    enabled: !!releases?.length,
    queryFn: async () => {
      const ids = releases!.map((r) => r.id);
      const { data, error } = await (supabase as any)
        .from("cinema_bookings")
        .select("*")
        .in("release_id", ids)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Booking[];
    },
  });

  const grouped: Record<string, BookingWithTickets[]> = useMemo(() => {
    if (!bookings || !releases) return {};
    const releaseMap = Object.fromEntries(releases.map((r) => [r.id, r]));
    const out: Record<string, BookingWithTickets[]> = {};
    const counters: Record<string, number> = {};
    for (const b of bookings) {
      const release = releaseMap[b.release_id];
      if (!release) continue;
      const prior = counters[b.release_id] || 0;
      const ticketNumbers = Array.from({ length: b.quantity }, (_, i) => prior + i + 1);
      counters[b.release_id] = prior + b.quantity;
      const { primary, guest } = splitNames(b.guest_name);
      (out[b.release_id] ||= []).push({
        ...b,
        release,
        ticketNumbers,
        primaryName: primary,
        guestName: guest,
      });
    }
    return out;
  }, [bookings, releases]);

  const handleResend = async (b: BookingWithTickets) => {
    if (!b.guest_email) {
      toast({ title: "No email on this booking", variant: "destructive" });
      return;
    }
    setBusyId(b.id);
    try {
      const { error } = await supabase.functions.invoke("send-cinema-ticket-email", {
        body: {
          toEmail: b.guest_email,
          primaryName: b.primaryName,
          guestName: b.guestName,
          quantity: b.quantity,
          ticketNumbers: b.ticketNumbers,
          screeningDate: b.release.screening_date,
          doorsTime: b.release.doors_time?.slice(0, 5),
          screeningTime: b.release.screening_time?.slice(0, 5),
          title: b.release.title,
          walletToken: b.wallet_token,
          bookingId: b.id,
          releaseId: b.release.id,
          forceResend: true,
          resendReason: "admin_manual_resend",
        },
      });
      if (error) throw error;
      toast({
        title: "Ticket email queued",
        description: `Resent to ${b.guest_email}`,
      });
    } catch (err: any) {
      toast({
        title: "Resend failed",
        description: err?.message || "Could not queue ticket email.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const copyWalletLink = async (b: BookingWithTickets) => {
    if (!b.wallet_token) {
      toast({ title: "No wallet token on this booking", variant: "destructive" });
      return;
    }
    const url = `${SUPABASE_URL}/functions/v1/create-cinema-wallet-pass?token=${encodeURIComponent(b.wallet_token)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Wallet link copied", description: "Send this directly to the guest if email fails." });
    } catch {
      window.prompt("Copy this wallet link:", url);
    }
  };

  if (!releases?.length) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Secret Cinema bookings</h3>
        <p className="text-sm text-muted-foreground">
          Resend ticket emails or copy a direct wallet link if a guest hasn't received theirs.
        </p>
      </div>

      {releases.map((r) => {
        const list = grouped[r.id] || [];
        if (!list.length) return null;
        return (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>{r.title || "Untitled"}</span>
                <Badge variant="secondary">{formatDate(r.screening_date)}</Badge>
                <Badge variant="outline">{list.reduce((n, b) => n + b.quantity, 0)} tickets</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {list.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-border rounded-md p-3"
                  >
                    <div className="text-sm">
                      <div className="font-medium">
                        {b.primaryName}
                        {b.guestName ? ` + ${b.guestName}` : ""}
                      </div>
                      <div className="text-muted-foreground">
                        {b.guest_email || "no email"} · Ticket{b.ticketNumbers.length > 1 ? "s" : ""} #
                        {b.ticketNumbers.join(", ")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyWalletLink(b)}
                        disabled={!b.wallet_token}
                      >
                        Copy wallet link
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResend(b)}
                        disabled={busyId === b.id || !b.guest_email}
                      >
                        {busyId === b.id ? "Resending..." : "Resend ticket"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CinemaBookings;
