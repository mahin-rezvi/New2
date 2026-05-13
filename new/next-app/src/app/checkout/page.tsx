"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: elements.getElement(CardElement)!,
        });

      if (stripeError) {
        setError(stripeError.message || "An error occurred");
        return;
      }

      // Create order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const data = await response.json();

      // Redirect to success page
      window.location.href = `/order-success/${data.data.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipping Information */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="input-base"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="input-base"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              className="input-base"
              required
            />
            <input
              type="text"
              placeholder="Address"
              className="input-base"
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="City"
                className="input-base"
                required
              />
              <input
                type="text"
                placeholder="State"
                className="input-base"
                required
              />
              <input
                type="text"
                placeholder="Zip Code"
                className="input-base"
                required
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="mb-4 p-4 border rounded bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Complete Order"}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t text-center">
        <p className="text-muted-foreground mb-4">
          Want to continue shopping instead?
        </p>
        <Link href="/shop" className="text-primary hover:underline">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
