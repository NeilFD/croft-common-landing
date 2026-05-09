import { useMemo } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

export type CheckoutPayload =
  | {
      kind: "gold";
      returnUrl: string;
      referralCode?: string | null;
    }
  | {
      kind: "lunch";
      returnUrl: string;
      site: "town" | "country";
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        category: string;
      }>;
      memberName: string;
      memberPhone: string;
      notes?: string;
    };

interface Props {
  payload: CheckoutPayload;
  onOrderCreated?: (orderId: string) => void;
}

export function StripeEmbeddedCheckout({ payload, onOrderCreated }: Props) {
  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { ...payload, environment: getStripeEnvironment() },
        });
        if (error || !data?.clientSecret) {
          throw new Error(error?.message || data?.error || "Failed to start checkout");
        }
        if (data.orderId && onOrderCreated) onOrderCreated(data.orderId);
        return data.clientSecret as string;
      },
    }),
    // Intentionally only recompute when the kind changes; basket items mounted once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [payload.kind, payload.returnUrl],
  );

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
