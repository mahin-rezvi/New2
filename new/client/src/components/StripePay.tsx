import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

export function StripePay({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setLoading(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) {
      setErr(error.message ?? "Payment failed");
      setLoading(false);
      return;
    }
    onSuccess();
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <button
        type="button"
        disabled={!stripe || loading}
        onClick={() => void pay()}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay securely"}
      </button>
    </div>
  );
}
