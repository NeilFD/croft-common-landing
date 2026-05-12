import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
export interface GoldStatus {
  isGold: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
}

export function useGoldStatus(): GoldStatus & { refetch: () => Promise<void> } {
  const { user } = useAuth();
  const [state, setState] = useState<GoldStatus>({
    isGold: false,
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    loading: true,
  });

  const load = useCallback(async () => {
    if (!user?.id) {
      setState({ isGold: false, status: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, loading: false });
      return;
    }
    const unlocked = typeof window !== 'undefined' &&
      window.sessionStorage?.getItem('gold_access_unlocked') === '1';
    const env = unlocked ? 'sandbox' : getStripeEnvironment();
    const { data } = await (supabase as any)
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, price_id")
      .eq("user_id", user.id)
      .eq("environment", env)
      .eq("price_id", "gold_monthly")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    const periodEnd = data?.current_period_end ? new Date(data.current_period_end).getTime() : null;
    const isGold = !!(
      data &&
      ((["active", "trialing", "past_due"].includes(data.status) && (!periodEnd || periodEnd > now)) ||
        (data.status === "canceled" && periodEnd && periodEnd > now))
    );

    setState({
      isGold,
      status: data?.status ?? null,
      currentPeriodEnd: data?.current_period_end ?? null,
      cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
      loading: false,
    });
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refetch when this user's subscription row changes.
  // Build the channel + listener BEFORE subscribe(); use a unique name per mount
  // so React StrictMode's double-effect doesn't reuse an already-subscribed channel
  // (which would throw "cannot add postgres_changes callbacks ... after subscribe()").
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`subs-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => load(),
      );
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, load]);

  return { ...state, refetch: load };
}
