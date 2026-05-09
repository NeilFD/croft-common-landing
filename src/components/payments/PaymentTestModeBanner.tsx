import { isPaymentsTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isPaymentsTestMode) return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs uppercase tracking-[0.3em] font-mono text-orange-900">
      Test mode. Use card 4242 4242 4242 4242, any future expiry, any CVC.
    </div>
  );
}
