"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "@/lib/types";

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", slug);
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const handlePriceChange = (min: number, max: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("minPrice", min.toString());
    params.set("maxPrice", max.toString());
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-4">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              onChange={() => router.push("/shop")}
              defaultChecked={!searchParams.get("category")}
              className="w-4 h-4"
            />
            <span className="ml-2 text-sm">All Categories</span>
          </label>

          {categories.map((category) => (
            <label key={category.id} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value={category.slug}
                onChange={() => handleCategoryChange(category.slug)}
                checked={searchParams.get("category") === category.slug}
                className="w-4 h-4"
              />
              <span className="ml-2 text-sm">
                {category.icon} {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-4">Price Range</h3>
        <div className="space-y-3">
          <button
            onClick={() => handlePriceChange(0, 50)}
            className="w-full text-left text-sm px-3 py-2 hover:bg-muted rounded"
          >
            $0 - $50
          </button>
          <button
            onClick={() => handlePriceChange(50, 100)}
            className="w-full text-left text-sm px-3 py-2 hover:bg-muted rounded"
          >
            $50 - $100
          </button>
          <button
            onClick={() => handlePriceChange(100, 500)}
            className="w-full text-left text-sm px-3 py-2 hover:bg-muted rounded"
          >
            $100 - $500
          </button>
          <button
            onClick={() => handlePriceChange(500, 10000)}
            className="w-full text-left text-sm px-3 py-2 hover:bg-muted rounded"
          >
            $500+
          </button>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="font-semibold mb-4">Sort By</h3>
        <select
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("sort", e.target.value);
            params.set("page", "1");
            router.push(`/shop?${params.toString()}`);
          }}
          defaultValue={searchParams.get("sort") || "newest"}
          className="w-full px-3 py-2 rounded border bg-background"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
    </div>
  );
}
