import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchProducts, type ProductQuery } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

const sorts: { value: ProductQuery["sort"]; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = (params.get("sort") as ProductQuery["sort"]) || "newest";
  const page = Number(params.get("page") || "1") || 1;

  const [draftQ, setDraftQ] = useState(q);

  useEffect(() => {
    setDraftQ(q);
  }, [q]);

  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");

  const productQuery = useMemo<ProductQuery>(
    () => ({
      q: q || undefined,
      category: category || undefined,
      sort: sorts.some((s) => s.value === sort) ? sort : "newest",
      page,
      pageSize: 12,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [q, category, sort, page, minPrice, maxPrice],
  );

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const products = useQuery({ queryKey: ["products", productQuery], queryFn: () => fetchProducts(productQuery) });

  const setFilter = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!patch.page) next.delete("page");
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFilter({ q: draftQ.trim() || undefined, page: undefined });
  }

  const totalPages = Math.max(1, Math.ceil((products.data?.total ?? 0) / (products.data?.pageSize ?? 12)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="lg:w-56 lg:shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Categories</h2>
          <ul className="mt-3 space-y-1">
            <li>
              <button
                type="button"
                onClick={() => setFilter({ category: undefined, page: undefined })}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  !category ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                All
              </button>
            </li>
            {categories.data?.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setFilter({ category: c.slug, page: undefined })}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    category === c.slug ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-zinc-500">Price (BDT)</h2>
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Min"
              defaultValue={minPrice ?? ""}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
              onBlur={(e) => setFilter({ minPrice: e.target.value || undefined, page: undefined })}
            />
            <input
              placeholder="Max"
              defaultValue={maxPrice ?? ""}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
              onBlur={(e) => setFilter({ maxPrice: e.target.value || undefined, page: undefined })}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <form onSubmit={onSearchSubmit} className="flex gap-2">
            <input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search products…"
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none ring-brand-500 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Sort</span>
            {sorts.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilter({ sort: s.value, page: undefined })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  sort === s.value ? "bg-brand-600 text-white" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            {products.isLoading ? "Loading…" : `${products.data?.total ?? 0} products`}
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.isLoading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-zinc-900" />)
              : products.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {totalPages > 1 ? (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pnum) => (
                <button
                  key={pnum}
                  type="button"
                  onClick={() => setFilter({ page: String(pnum) })}
                  className={`grid h-9 min-w-9 place-items-center rounded-lg text-sm ${
                    pnum === page ? "bg-brand-600 text-white" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {pnum}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
