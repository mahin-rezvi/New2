import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature")!;
    const body = await request.text();

    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, message: "Webhook not configured" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      // Update payment status
      await prisma.payment.updateMany({
        where: { stripeId: paymentIntent.id },
        data: { status: "COMPLETED" },
      });

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;

      // Update payment status
      await prisma.payment.updateMany({
        where: { stripeId: paymentIntent.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, message: "Webhook failed" },
      { status: 400 }
    );
  }
}
