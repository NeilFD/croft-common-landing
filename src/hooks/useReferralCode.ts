import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useReferralCode() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    supabase.functions
      .invoke("get-referral-code", { body: {} })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.code) setCode(data.code);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { code, loading };
}
