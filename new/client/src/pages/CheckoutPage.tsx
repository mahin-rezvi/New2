import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchCart, postCheckout, postStripeConfirm, type CheckoutInput } from "@/lib/api";
import { useAuthSession } from "@/lib/auth-client";
import { StripePay } from "@/components/StripePay";

const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = pk ? loadStripe(pk) : null;

export function CheckoutPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const session = useAuthSession();
  const cart = useQuery({ queryKey: ["cart"], queryFn: fetchCart });

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [stripeCtx, setStripeCtx] = useState<{ clientSecret: string; orderId: string } | null>(null);

  useEffect(() => {
    if (session.isPending) return;
    if (!session.data?.user) nav("/login", { replace: true, state: { from: "/checkout" } });
  }, [session.isPending, session.data?.user, nav]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cart.data?.lines.length) {
      setError("Your cart is empty.");
      return;
    }
    const body: CheckoutInput = {
      paymentMethod,
      shipping: {
        fullName: shipping.fullName,
        phone: shipping.phone,
        line1: shipping.line1,
        line2: shipping.line2 || undefined,
        city: shipping.city,
        postalCode: shipping.postalCode,
      },
    };
    try {
      const res = await postCheckout(body);
      if (res.paymentMethod === "cod") {
        await qc.invalidateQueries({ queryKey: ["cart"] });
        nav(`/account?order=${encodeURIComponent(res.orderId)}`);
        return;
      }
      if (!stripePromise) {
        setError("Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY or choose COD.");
        return;
      }
      setStripeCtx({ clientSecret: res.clientSecret, orderId: res.orderId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  if (!session.data?.user) {
    return <div className="mx-auto max-w-lg px-4 py-20 text-center text-zinc-500">Checking session…</div>;
  }

  if (stripeCtx && stripePromise) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-white">Card payment</h1>
        <p className="mt-2 text-sm text-zinc-400">Use Stripe test cards (for example 4242 4242 4242 4242).</p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <Elements stripe={stripePromise} options={{ clientSecret: stripeCtx.clientSecret }}>
            <StripePay
              onSuccess={async () => {
                await postStripeConfirm(stripeCtx.orderId);
                await qc.invalidateQueries({ queryKey: ["cart"] });
                nav("/account");
              }}
            />
          </Elements>
        </div>
        <button type="button" className="mt-4 text-sm text-zinc-400 hover:text-white" onClick={() => setStripeCtx(null)}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-white">Checkout</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Signed in as <span className="text-zinc-200">{session.data.user.email}</span>
      </p>
      {!cart.data?.lines.length ? (
        <p className="mt-6 text-zinc-400">
          Cart is empty.{" "}
          <Link className="text-brand-400 hover:underline" to="/shop">
            Continue shopping
          </Link>
        </p>
      ) : (
        <form onSubmit={(e) => void placeOrder(e)} className="mt-8 space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-zinc-300">Payment</legend>
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="radio"
                name="pm"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on delivery (no gateway fees)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="radio"
                name="pm"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
              />
              Card via Stripe (test mode — no real charges)
            </label>
          </fieldset>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-300" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                required
                value={shipping.fullName}
                onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-300" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                required
                value={shipping.phone}
                onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-300" htmlFor="line1">
                Address line 1
              </label>
              <input
                id="line1"
                required
                value={shipping.line1}
                onChange={(e) => setShipping((s) => ({ ...s, line1: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-300" htmlFor="line2">
                Address line 2 (optional)
              </label>
              <input
                id="line2"
                value={shipping.line2}
                onChange={(e) => setShipping((s) => ({ ...s, line2: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-zinc-300" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-300" htmlFor="postal">
                  Postal code
                </label>
                <input
                  id="postal"
                  required
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none ring-brand-500 focus:ring-2"
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-300">
            <p>
              Subtotal:{" "}
              <span className="font-semibold text-white">
                {((cart.data?.subtotalCents ?? 0) / 100).toLocaleString("en-BD", {
                  style: "currency",
                  currency: cart.data?.currency ?? "BDT",
                })}
              </span>
            </p>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500"
          >
            {paymentMethod === "cod" ? "Place order" : "Continue to payment"}
          </button>
        </form>
      )}
    </div>
  );
}
