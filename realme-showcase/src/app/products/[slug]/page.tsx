import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { getLiveProductDetail, getProductBySlug, getRelatedProducts } from "@/lib/startech";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const surfaceClass =
  "relative overflow-hidden rounded-[30px] border border-[color:var(--line)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow)] sm:p-6";
const panelClass = "rounded-3xl border border-[color:var(--line)] bg-[var(--panel)] p-5 shadow-card";
const chipClass =
  "inline-flex items-center rounded-full border border-[color:var(--line)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[color:var(--muted-strong)]";
const eyebrowClass = "text-xs font-semibold uppercase tracking-[0.16em] text-atlas-gold";
const mutedTextClass = "text-[color:var(--muted)]";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Star Tech Atlas",
    };
  }

  return {
    title: `${product.name} | Star Tech Atlas`,
    description: product.highlights.join(" · "),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const liveDetail = await getLiveProductDetail(product.url, product.image);
  const related = await getRelatedProducts(product, 4);
  const productName = liveDetail?.name ?? product.name;
  const currentPrice = liveDetail?.livePrice ?? product.current_price_text;
  const oldPrice = liveDetail?.oldPrice ?? product.old_price_text;
  const keyFeatures = liveDetail?.keyFeatures.length ? liveDetail.keyFeatures : product.highlights;
  const galleryImages = liveDetail?.galleryImages.length ? liveDetail.galleryImages : product.image ? [product.image] : [];
  const primaryImage = galleryImages[0] ?? product.image;
  const detailFacts =
    liveDetail?.facts.filter((fact) => !["price", "regular price"].includes(fact.label.toLowerCase())) ?? [];
  const specificationGroups = liveDetail?.specificationGroups ?? [];
  const paymentOptions = liveDetail?.paymentOptions ?? [];
  const questions = liveDetail?.questions ?? [];

  return (
    <main className="shell page-stack">
      <section className={surfaceClass}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="grid content-start gap-3 xl:sticky xl:top-28">
            <div className="relative min-h-[340px] overflow-hidden rounded-[26px] border border-[color:var(--line)] bg-[var(--product-image-bg)] shadow-card sm:min-h-[460px]">
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={productName}
                  fill
                  className="object-contain p-8 sm:p-10"
                  sizes="(max-width: 900px) 100vw, 44vw"
                  priority
                />
              ) : (
                <div className="grid h-full place-items-center text-sm font-semibold text-slate-500">No image</div>
              )}
              {product.save_text ? (
                <span className="absolute bottom-4 left-4 right-4 inline-flex min-h-10 items-center justify-center rounded-full bg-orange-500/95 px-4 text-center text-sm font-bold text-white shadow-[0_16px_34px_rgba(234,88,12,0.3)]">
                  {product.save_text}
                </span>
              ) : null}
            </div>

            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {galleryImages.slice(0, 6).map((image, index) => (
                  <a
                    className="relative aspect-square overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--product-image-bg)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)]"
                    href={image}
                    key={image}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src={image}
                      alt={`${productName} gallery image ${index + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="96px"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid content-start gap-5 xl:py-4">
            <div className="flex flex-wrap gap-2">
              {product.root_categories.map((category) => (
                <span className={chipClass} key={category}>
                  {category}
                </span>
              ))}
            </div>

            <div className="grid gap-3">
              <span className={eyebrowClass}>Product Detail</span>
              <h1 className="m-0 max-w-5xl text-balance font-['Bricolage_Grotesque_Variable'] text-[clamp(2.35rem,5vw,5.4rem)] leading-[0.94] text-[var(--text-strong)]">
                {productName}
              </h1>
              <p className={`max-w-3xl text-base leading-8 ${mutedTextClass}`}>
                {liveDetail
                  ? "Live data is pulled from the Star Tech product detail page at request time, then normalized into this cleaner buying view."
                  : "Live product detail is temporarily unavailable, so this page is using the catalog snapshot."}
              </p>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-[color:var(--line)] bg-[var(--panel-strong)] p-5 shadow-card sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-2">
                <span className={eyebrowClass}>Current Price</span>
                <span className="font-['Bricolage_Grotesque_Variable'] text-[clamp(2.25rem,4vw,4.4rem)] leading-none text-[var(--text-strong)]">
                  {currentPrice ?? "Unavailable"}
                </span>
                <div className="flex flex-wrap gap-2 text-sm text-[color:var(--muted)]">
                  {oldPrice ? <span className="line-through">{oldPrice}</span> : null}
                  {liveDetail?.regularPrice ? <span>Regular: {liveDetail.regularPrice}</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end">
                {liveDetail?.brand ? <span className={chipClass}>Brand: {liveDetail.brand}</span> : null}
                {liveDetail?.productCode ? <span className={chipClass}>Code: {liveDetail.productCode}</span> : null}
                {liveDetail?.status ? <span className={`${chipClass} border-atlas-red/30 text-atlas-red`}>Status: {liveDetail.status}</span> : null}
              </div>
            </div>

            {keyFeatures.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {keyFeatures.slice(0, 8).map((highlight) => (
                  <div className="relative rounded-2xl border border-[color:var(--line)] bg-[var(--panel)] p-4 pl-9 text-sm leading-6 text-[color:var(--muted-strong)]" key={highlight}>
                    <span className="absolute left-4 top-5 h-2 w-2 rounded-full bg-atlas-mint" />
                    {highlight}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-atlas-red px-5 text-sm font-bold text-white shadow-[0_16px_34px_rgba(235,28,36,0.28)] transition hover:bg-red-500"
                href={product.url}
                target="_blank"
                rel="noreferrer"
              >
                View live listing
              </a>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-[var(--panel)] px-5 text-sm font-bold text-[var(--text)] transition hover:border-[color:var(--line-strong)] hover:bg-[var(--panel-strong)]"
                href={`/catalog?category=${product.root_category_slug}`}
              >
                More in {product.root_category}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className={`${surfaceClass} grid content-start gap-5`}>
          <div className="grid gap-2">
            <span className={eyebrowClass}>Product Facts</span>
            <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-3xl leading-tight text-[var(--text-strong)]">Live facts pulled from the source page</h2>
          </div>

          {detailFacts.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {detailFacts.map((fact) => (
                <article className="rounded-2xl border border-[color:var(--line)] bg-[var(--panel)] p-4" key={`${fact.label}-${fact.value}`}>
                  <span className="font-['IBM_Plex_Mono'] text-[0.72rem] uppercase tracking-[0.08em] text-[color:var(--muted)]">{fact.label}</span>
                  <strong className="mt-2 block text-base leading-snug text-[var(--text-strong)]">{fact.value}</strong>
                </article>
              ))}
            </div>
          ) : (
            <p className={`m-0 leading-8 ${mutedTextClass}`}>No additional source-page facts were available for this product.</p>
          )}
        </article>

        <article className={`${surfaceClass} grid content-start gap-5`}>
          <div className="grid gap-2">
            <span className={eyebrowClass}>Payment Options</span>
            <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-3xl leading-tight text-[var(--text-strong)]">Cash and EMI view from Star Tech</h2>
          </div>

          {paymentOptions.length > 0 ? (
            <div className="grid gap-3">
              {paymentOptions.map((option) => (
                <article className="rounded-2xl border border-[color:var(--line)] bg-[var(--panel)] p-4" key={`${option.label}-${option.price}`}>
                  <span className="font-['IBM_Plex_Mono'] text-[0.72rem] uppercase tracking-[0.08em] text-[color:var(--muted)]">{option.label}</span>
                  <strong className="mt-2 block text-xl leading-snug text-[var(--text-strong)]">{option.price}</strong>
                  {option.compareAt ? <span className="text-sm text-[color:var(--muted)] line-through">{option.compareAt}</span> : null}
                  {option.note ? <p className={`mt-2 m-0 text-sm leading-7 ${mutedTextClass}`}>{option.note}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <p className={`m-0 leading-8 ${mutedTextClass}`}>No structured payment options were exposed on the source page.</p>
          )}
        </article>
      </section>

      {liveDetail?.descriptionHtml ? (
        <section className={surfaceClass}>
          <div className="grid max-w-4xl gap-2">
            <span className={eyebrowClass}>Description</span>
            <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-[clamp(2rem,4vw,4rem)] leading-none text-[var(--text-strong)]">
              Full product narrative from the source page
            </h2>
            <p className={`m-0 leading-8 ${mutedTextClass}`}>
              This section is scraped from the live Star Tech product description so the route carries the same long-form
              context as the source listing.
            </p>
          </div>

          <div className="product-description-prose" dangerouslySetInnerHTML={{ __html: liveDetail.descriptionHtml }} />
        </section>
      ) : null}

      {specificationGroups.length > 0 ? (
        <section className={surfaceClass}>
          <div className="grid max-w-4xl gap-2">
            <span className={eyebrowClass}>Specification</span>
            <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-[clamp(2rem,4vw,4rem)] leading-none text-[var(--text-strong)]">
              Structured specification groups
            </h2>
            <p className={`m-0 leading-8 ${mutedTextClass}`}>The source table is grouped and normalized so long specs stay readable inside the Atlas layout.</p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {specificationGroups.map((group) => (
              <article className={panelClass} key={group.name}>
                <h3 className="m-0 font-['Bricolage_Grotesque_Variable'] text-2xl leading-tight text-[var(--text-strong)]">{group.name}</h3>
                <div className="mt-4 divide-y divide-[color:var(--line)]">
                  {group.items.map((item) => (
                    <div className="grid gap-2 py-3 sm:grid-cols-[minmax(140px,0.72fr)_minmax(0,1.28fr)] sm:gap-5" key={`${group.name}-${item.label}`}>
                      <span className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.08em] text-[color:var(--muted)]">{item.label}</span>
                      <span className="leading-7 text-[color:var(--muted-strong)]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className={`${surfaceClass} grid content-start gap-5`}>
          <div className="grid gap-2">
            <span className={eyebrowClass}>Questions</span>
            <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-3xl leading-tight text-[var(--text-strong)]">Source-page Q&amp;A</h2>
          </div>
          {questions.length > 0 ? (
            <div className="grid gap-3">
              {questions.map((entry) => (
                <article className="rounded-2xl border border-[color:var(--line)] bg-[var(--panel)] p-4" key={`${entry.question}-${entry.askedAt ?? "na"}`}>
                  <strong className="block text-base leading-7 text-[var(--text-strong)]">{entry.question}</strong>
                  <p className={`m-0 mt-2 text-sm leading-7 ${mutedTextClass}`}>
                    {entry.askedBy ? `${entry.askedBy}` : "Customer"}
                    {entry.askedAt ? ` on ${entry.askedAt}` : ""}
                  </p>
                  {entry.answer ? <p className="m-0 mt-3 leading-7 text-[color:var(--muted-strong)]">{entry.answer}</p> : null}
                  {entry.answeredBy || entry.answeredAt ? (
                    <p className={`m-0 mt-2 text-sm leading-7 ${mutedTextClass}`}>
                      {entry.answeredBy ? `Answered by ${entry.answeredBy}` : "Answered"}
                      {entry.answeredAt ? ` on ${entry.answeredAt}` : ""}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className={`m-0 leading-8 ${mutedTextClass}`}>No customer questions were exposed on the source page.</p>
          )}
        </article>

        <article className={`${surfaceClass} grid content-start gap-5`}>
          <div className="grid gap-2">
            <span className={eyebrowClass}>Traceability</span>
            <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-3xl leading-tight text-[var(--text-strong)]">Source and review state</h2>
          </div>
          {liveDetail?.reviewSummary ? (
            <p className={`m-0 leading-8 ${mutedTextClass}`}>{liveDetail.reviewSummary}</p>
          ) : (
            <p className={`m-0 leading-8 ${mutedTextClass}`}>No review summary was exposed on the source page.</p>
          )}
          <ul className="m-0 grid gap-2 p-0">
            {product.source_pages.map((sourcePage) => (
              <li className="list-none rounded-2xl border border-[color:var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[color:var(--muted-strong)]" key={sourcePage}>
                {sourcePage}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className={surfaceClass}>
        <div className="grid max-w-4xl gap-2">
          <span className={eyebrowClass}>Related</span>
          <h2 className="m-0 font-['Bricolage_Grotesque_Variable'] text-[clamp(2rem,4vw,4rem)] leading-none text-[var(--text-strong)]">
            More products from the same root category
          </h2>
          <p className={`m-0 leading-8 ${mutedTextClass}`}>Selected from the same root grouping and sorted toward visible deals first.</p>
        </div>

        <div className="product-grid mt-6">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
