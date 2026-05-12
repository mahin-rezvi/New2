import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProductBySlug, postCartItem } from "@/lib/api";

export function ProductPage() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const product = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
  });

  const add = useMutation({
    mutationFn: () => postCartItem(product.data!.id, 1),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const badges = useMemo(() => product.data?.badges ?? [], [product.data?.badges]);

  if (product.isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-zinc-500">Loading…</div>;
  }
  if (product.isError || !product.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-red-400">Product not found.</p>
        <Link to="/shop" className="mt-4 inline-block text-brand-400 hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const p = product.data;
  const inStock = p.stock > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="grid aspect-square place-items-center text-7xl text-zinc-700">📦</div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-400">{p.categoryName}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">{p.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">
                {b}
              </span>
            ))}
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">
              {(p.priceCents / 100).toLocaleString("en-BD", { style: "currency", currency: p.currency })}
            </span>
            {p.compareAtCents != null && p.compareAtCents > p.priceCents ? (
              <span className="text-lg text-zinc-500 line-through">
                {(p.compareAtCents / 100).toLocaleString("en-BD", { style: "currency", currency: p.currency })}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            <span className="text-amber-400">★</span> {p.rating.toFixed(1)} · {p.reviewCount} reviews ·{" "}
            {inStock ? `${p.stock} in stock` : "Out of stock"}
          </p>
          {p.description ? <p className="mt-6 leading-relaxed text-zinc-300">{p.description}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!inStock || add.isPending}
              onClick={() => product.data && add.mutate()}
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {add.isPending ? "Adding…" : "Add to cart"}
            </button>
            <Link
              to="/cart"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              View cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
