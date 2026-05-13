"use client";

import { Zap, Shield, Truck, Award } from "lucide-react";

export function FeaturedSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="flex flex-col items-center text-center p-6">
          <Zap className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="font-semibold mb-2">Fast Delivery</h3>
          <p className="text-sm text-muted-foreground">
            Quick and reliable shipping to your doorstep
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6">
          <Shield className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="font-semibold mb-2">Secure Payment</h3>
          <p className="text-sm text-muted-foreground">
            Safe transactions with encrypted payment methods
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6">
          <Truck className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="font-semibold mb-2">Easy Returns</h3>
          <p className="text-sm text-muted-foreground">
            Hassle-free return policy within 30 days
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6">
          <Award className="w-12 h-12 text-orange-600 mb-4" />
          <h3 className="font-semibold mb-2">Quality Assured</h3>
          <p className="text-sm text-muted-foreground">
            Premium products from trusted sellers
          </p>
        </div>
      </div>
    </section>
  );
}
