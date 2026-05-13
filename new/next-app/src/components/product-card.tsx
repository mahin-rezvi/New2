"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const priceInDollars = (product.price / 100).toFixed(2);

  return (
    <Link href={`/shop/${product.slug}`}>
      <div className="group cursor-pointer rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow">
        {/* Product Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-4xl">
            📦
          </div>

          {/* Badge */}
          {product.featured && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Featured
            </div>
          )}

          {/* Wishlist button */}
          <button className="absolute top-2 left-2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition opacity-0 group-hover:opacity-100">
            <Heart className="w-5 h-5 text-red-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {product.category?.name}
          </p>

          <h3 className="font-semibold text-sm line-clamp-2 mb-2">
            {product.name}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              ${priceInDollars}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
              {product.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button className="w-full mt-4 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium text-sm">
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}
