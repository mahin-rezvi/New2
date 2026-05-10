import type { Metadata } from "next";

import { PriceBandChart } from "@/components/price-band-chart";
import { SectionHeading } from "@/components/section-heading";
import { getAnalysis } from "@/lib/startech";

export const metadata: Metadata = {
  title: "Insights | Star Tech Atlas",
  description: "Site-wide analysis and crawl summary for the generated Star Tech dataset.",
};

export default async function InsightsPage() {
  const analysis = await getAnalysis();

  return (
    <main className="shell page-stack">
      <section className="content-surface">
        <SectionHeading
          eyebrow="Crawl Analysis"
          title="What the generated dataset says about the source site"
          description="These figures come from the crawler outputs, including the root category inventory, visible discounts, and price-band distribution."
        />

        <div className="hero-stat-grid">
          <article className="stat-card">
            <span>Average listed price</span>
            <strong>
              {analysis.catalog_summary.price_summary.average
                ? `${Math.round(analysis.catalog_summary.price_summary.average).toLocaleString()}৳`
                : "N/A"}
            </strong>
            <small>Across products with visible numeric prices</small>
          </article>
          <article className="stat-card">
            <span>Median listed price</span>
            <strong>
              {analysis.catalog_summary.price_summary.median
                ? `${Math.round(analysis.catalog_summary.price_summary.median).toLocaleString()}৳`
                : "N/A"}
            </strong>
            <small>Less skewed by flagship outliers</small>
          </article>
          <article className="stat-card">
            <span>Visible min / max</span>
            <strong>
              {analysis.catalog_summary.price_summary.min?.toLocaleString() ?? "N/A"}৳ /{" "}
              {analysis.catalog_summary.price_summary.max?.toLocaleString() ?? "N/A"}৳
            </strong>
            <small>Price extremes found on listing pages</small>
          </article>
          <article className="stat-card">
            <span>Robots blocks</span>
            <strong>{analysis.site_summary.robots_disallow_rules.length}</strong>
            <small>Query-pattern disallow rules identified</small>
          </article>
        </div>
      </section>

      <section className="content-surface split-surface">
        <div className="info-card">
          <span className="section-eyebrow">Price Band Shape</span>
          <h2>Where the catalog is concentrated</h2>
          <PriceBandChart
            bands={analysis.price_bands.map((band) => ({
              label: band.label,
              count: band.count,
            }))}
          />
        </div>

        <div className="info-card">
          <span className="section-eyebrow">Crawler Notes</span>
          <h2>What was indexed and what was intentionally avoided</h2>
          <ul className="detail-list">
            <li>The catalog comes from root category listing pages and their pagination.</li>
            <li>The source `robots.txt` disallows crawling `/product/search` query patterns.</li>
            <li>Product summaries are normalized from listing cards, not inferred from slugs.</li>
            <li>The sitemap reported {analysis.site_summary.sitemap_url_count.toLocaleString()} published URLs.</li>
          </ul>
        </div>
      </section>

      <section className="content-surface">
        <SectionHeading
          eyebrow="Root Breakdown"
          title="Category volume by top-level section"
          description="This is where the site’s information architecture matters most. A few roots dominate the overall catalog load."
        />

        <div className="table-surface">
          <div className="table-head">
            <span>Root</span>
            <span>Products</span>
            <span>Pages</span>
          </div>
          {analysis.root_category_breakdown.map((item) => (
            <div className="table-row" key={item.slug}>
              <span>{item.name}</span>
              <strong>{item.products.toLocaleString()}</strong>
              <span>{item.pages}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-surface">
        <SectionHeading
          eyebrow="Deal Extraction"
          title="Top savings visible on listing pages"
          description="The crawl surfaces raw discounts directly from category cards, which is enough for strong merchandising without a full detail-page pass."
        />

        <div className="deal-list">
          {analysis.top_deals.slice(0, 10).map((deal) => (
            <article className="deal-item" key={deal.slug}>
              <div>
                <span className="section-eyebrow">{deal.root_category}</span>
                <h3>{deal.name}</h3>
              </div>
              <div className="deal-meta">
                <strong>{deal.current_price_text ?? "Unavailable"}</strong>
                <span>{deal.save_text}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
