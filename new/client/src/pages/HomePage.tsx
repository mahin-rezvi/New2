import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchFeatured } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export function HomePage() {
  const featured = useQuery({ queryKey: ["featured"], queryFn: fetchFeatured });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">Dealhaven Pro</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your gateway to curated gadgets, wellness, and everyday wins.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-400">
            Fast search, sharp filters, and checkout with cash on delivery or Stripe test cards — built for the same
            shopping journey as classic BD deal stores, with a modern stack underneath.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-brand-900/30 hover:bg-brand-400"
            >
              Shop now
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">New arrivals</h2>
              <p className="mt-1 text-sm text-zinc-500">Fresh picks landing weekly.</p>
            </div>
            <Link to="/shop?sort=newest" className="text-sm font-medium text-brand-400 hover:text-brand-300">
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
                ))
              : featured.data?.newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Best sellers</h2>
              <p className="mt-1 text-sm text-zinc-500">What shoppers are loving right now.</p>
            </div>
            <Link to="/shop?sort=popular" className="text-sm font-medium text-brand-400 hover:text-brand-300">
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
                ))
              : featured.data?.bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
