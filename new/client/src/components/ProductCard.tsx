import { Link } from "react-router-dom";
import type { Product } from "@/lib/api";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 shadow-lg shadow-black/20 transition hover:border-brand-500/40 hover:shadow-brand-900/20">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-zinc-800">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">📦</div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.badges.map((b) => (
            <span
              key={b}
              className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur"
            >
              {b}
            </span>
          ))}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-400">{product.categoryName}</p>
        <Link to={`/product/${product.slug}`} className="mt-1 line-clamp-2 font-medium text-white hover:text-brand-200">
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-semibold text-white">{formatMoney(product.priceCents, product.currency)}</span>
          {product.compareAtCents != null && product.compareAtCents > product.priceCents ? (
            <span className="text-sm text-zinc-500 line-through">
              {formatMoney(product.compareAtCents, product.currency)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
          <span className="text-amber-400">★</span>
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
        </div>
      </div>
    </article>
  );
}
