import Image from "next/image";
import Link from "next/link";

import { getCatalogAvailability, type CatalogProduct } from "@/lib/startech";

type ProductCardProps = {
  product: CatalogProduct;
};

const cardShellClass =
  "group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[color:var(--line)] bg-[var(--card-bg)] shadow-card transition duration-300 hover:-translate-y-1 hover:border-[color:var(--line-strong)] hover:bg-[var(--card-bg-hover)]";

const softButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[var(--panel)] px-3 text-sm font-semibold text-[color:var(--muted-strong)] transition hover:border-[color:var(--line-strong)] hover:bg-[var(--panel-strong)] hover:text-[var(--text-strong)]";

export function ProductCard({ product }: ProductCardProps) {
  const availability = getCatalogAvailability(product);
  const availabilityLabel =
    availability === "in-stock"
      ? "In Stock"
      : availability === "pre-order"
        ? "Pre Order"
        : availability === "up-coming"
          ? "Up Coming"
          : "Out Of Stock";
  const statusClass =
    availability === "in-stock"
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-300/25"
      : availability === "pre-order"
        ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:bg-amber-300/10 dark:text-amber-100 dark:ring-amber-200/25"
        : availability === "up-coming"
          ? "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:bg-sky-300/10 dark:text-sky-100 dark:ring-sky-200/25"
          : "bg-red-500/10 text-red-700 ring-red-500/20 dark:bg-red-400/10 dark:text-red-100 dark:ring-red-300/25";
  const visibleHighlights = product.highlights.slice(0, 2);

  return (
    <article className={cardShellClass}>
      <Link
        className="product-card-image relative mx-3 mt-3 block aspect-[4/3] overflow-hidden rounded-[18px] border border-[color:var(--line)] bg-[var(--product-image-bg)]"
        href={`/products/${product.slug}`}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-5 transition duration-300 group-hover:scale-[1.045]"
            sizes="(max-width: 640px) 100vw, (max-width: 820px) 50vw, (max-width: 1120px) 33vw, 25vw"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm font-semibold text-slate-500">No image</div>
        )}
        {product.save_text ? (
          <span className="absolute right-3 top-3 z-[1] inline-flex max-w-[72%] truncate rounded-full bg-orange-500 px-3 py-1.5 text-[0.72rem] font-bold leading-none text-white shadow-[0_12px_26px_rgba(234,88,12,0.28)]">
            {product.save_text}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <div className="flex min-h-7 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.08em] text-[var(--chip-text)]">
            {product.root_category}
          </span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold leading-none ring-1 ${statusClass}`}
          >
            {availabilityLabel}
          </span>
        </div>

        <div className="grid gap-2.5">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-[var(--text-strong)] transition group-hover:text-atlas-red">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>

        {visibleHighlights.length > 0 ? (
          <ul className="grid min-h-[3.7rem] gap-1.5 text-sm leading-6 text-[color:var(--muted)]">
            {visibleHighlights.map((highlight) => (
              <li
                className="relative line-clamp-1 pl-4 before:absolute before:left-0 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-atlas-mint before:content-['']"
                key={highlight}
              >
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto grid gap-3 pt-1">
          <div className="grid min-h-[3.2rem] content-end gap-1">
            <span className="font-['Bricolage_Grotesque_Variable'] text-2xl font-semibold leading-none text-[var(--text-strong)]">
              {product.current_price_text ?? "Unavailable"}
            </span>
            {product.old_price_text ? <span className="text-sm text-[color:var(--muted)] line-through">{product.old_price_text}</span> : null}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-[color:var(--line)] pt-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-atlas-red px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(235,28,36,0.28)] transition hover:bg-red-500"
              href={`/products/${product.slug}`}
            >
              View Details
            </Link>
            <a
              className={softButtonClass}
              href={product.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${product.name} on Star Tech`}
            >
              Source
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
