import Link from "next/link";

import { PriceBandChart } from "@/components/price-band-chart";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getAnalysis, getFeaturedProducts } from "@/lib/startech";

export default async function HomePage() {
  const analysis = await getAnalysis();
  const featuredProducts = await getFeaturedProducts(8);
  const topRoots = analysis.root_category_breakdown.slice(0, 6);
  const totalRootPages = analysis.root_category_breakdown.reduce((sum, root) => sum + root.pages, 0);
  const averageProductsPerRoot = Math.round(
    analysis.catalog_summary.total_products / Math.max(analysis.catalog_summary.root_category_count, 1),
  );

  return (
    <main className="shell page-stack">
      <section className="hero-surface">
        <div className="hero-copy-block">
          <span className="section-eyebrow">Whole-site catalog system</span>
          <h1>Star Tech, reimagined as a searchable atlas.</h1>
          <p className="hero-copy">
            The original site is broad and operational. This rebuild turns that sprawl into a cleaner product discovery
            layer: site-scale search, catalog analytics, stronger hierarchy, and a more intentional interface system.
          </p>

          <div className="hero-signal-row">
            <span className="hero-signal-pill">{analysis.site_summary.sitemap_url_count.toLocaleString()} source URLs mapped</span>
            <span className="hero-signal-pill">{totalRootPages.toLocaleString()} crawl pages indexed</span>
            <span className="hero-signal-pill">{averageProductsPerRoot.toLocaleString()} average products per root</span>
          </div>

          <form action="/catalog" className="hero-search">
            <input name="q" placeholder="Search products, features, or terms like RTX, ANC, Ryzen..." />
            <button type="submit">Search Catalog</button>
          </form>

          <div className="hero-stat-grid">
            <article className="stat-card">
              <span>Catalog products</span>
              <strong>{analysis.catalog_summary.total_products.toLocaleString()}</strong>
              <small>Captured from root category pagination</small>
            </article>
            <article className="stat-card">
              <span>Root categories</span>
              <strong>{analysis.catalog_summary.root_category_count}</strong>
              <small>Top-level commerce sections on the live site</small>
            </article>
            <article className="stat-card">
              <span>Discounted items</span>
              <strong>{analysis.catalog_summary.discounted_product_count.toLocaleString()}</strong>
              <small>Products with visible savings on listing pages</small>
            </article>
            <article className="stat-card">
              <span>Sitemap URLs</span>
              <strong>{analysis.site_summary.sitemap_url_count.toLocaleString()}</strong>
              <small>Whole-site inventory published by the source</small>
            </article>
          </div>
        </div>

        <div className="hero-aside">
          <div className="hero-panel-card">
            <span className="section-eyebrow">Price landscape</span>
            <h2>How products spread across price bands</h2>
            <PriceBandChart
              bands={analysis.price_bands.map((band) => ({
                label: band.label,
                count: band.count,
              }))}
            />

            <div className="hero-panel-footer">
              <article>
                <span>Root crawl pages</span>
                <strong>{totalRootPages.toLocaleString()}</strong>
              </article>
              <article>
                <span>Avg. products per root</span>
                <strong>{averageProductsPerRoot.toLocaleString()}</strong>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="content-surface">
        <SectionHeading
          eyebrow="Category Volume"
          title="The store is massive, but the density is uneven"
          description="A few roots dominate the product volume. That matters for navigation design, merchandising, and search defaults."
        />

        <div className="root-grid">
          {topRoots.map((root) => (
            <article className="root-card" key={root.slug}>
              <span className="root-chip">{root.name}</span>
              <strong>{root.products.toLocaleString()}</strong>
              <p>{root.pages} paginated listing pages in the source catalog.</p>
              <Link href={`/catalog?category=${root.slug}`}>Open {root.name}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="content-surface">
        <SectionHeading
          eyebrow="Top Deals"
          title="High-signal products surfaced from the raw crawl"
          description="These are not hand-picked mock cards. They are generated from the live listing data and sorted by visible savings."
        />

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="content-surface split-surface">
        <div className="info-card">
          <span className="section-eyebrow">Why this architecture</span>
          <h2>Own the search index instead of scraping the site search endpoint.</h2>
          <p>
            Star Tech’s `robots.txt` disallows crawling the query search route, so this project builds its own index from
            paginated category listings. That yields a cleaner UX and a more controllable data model.
          </p>
          <Link className="ghost-action" href="/insights">
            See crawl analysis
          </Link>
        </div>

        <div className="info-card accent">
          <span className="section-eyebrow">Next step</span>
          <h2>Search the full catalog or drill into a product route.</h2>
          <p>
            The app is no longer a static hero page. It now has a catalog route, product detail pages, and an insights
            layer over the generated data.
          </p>
          <Link className="primary-action" href="/catalog">
            Explore catalog
          </Link>
        </div>
      </section>
    </main>
  );
}
