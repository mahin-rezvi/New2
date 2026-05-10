import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import {
  getRootCategoryOptions,
  searchCatalog,
  type CatalogAvailability,
  type SearchSort,
} from "@/lib/startech";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readString(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function toPage(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function toPositiveNumber(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

function buildQueryString(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === "all") {
      continue;
    }
    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const metadata: Metadata = {
  title: "Catalog | Star Tech Atlas",
  description: "Search and filter the Star Tech product catalog generated from live category listings.",
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const q = readString(params.q);
  const category = readString(params.category, "all");
  const sort = readString(params.sort, "featured");
  const availability = readString(params.availability, "all");
  const show = toPage(readString(params.show, "20"));
  const minPrice = toPositiveNumber(readString(params.minPrice));
  const maxPrice = toPositiveNumber(readString(params.maxPrice));
  const dealsOnly = readString(params.deals) === "1";
  const page = toPage(readString(params.page, "1"));

  const [results, categories] = await Promise.all([
    searchCatalog({
      q,
      category,
      sort: sort as SearchSort,
      availability: availability as CatalogAvailability,
      page,
      pageSize: show,
      minPrice,
      maxPrice,
      dealsOnly,
    }),
    getRootCategoryOptions(),
  ]);

  return (
    <main className="shell page-stack">
      <section className="content-surface compact-surface">
        <SectionHeading
          eyebrow="Catalog Search"
          title="Search across the generated Star Tech index"
          description="This catalog mirrors the current Star Tech listing controls we can support from the crawl snapshot: search, category, price range, availability, show-count, and sort order."
        />

        <form action="/catalog" className="catalog-toolbar catalog-toolbar-extended">
          <div className="catalog-toolbar-block catalog-toolbar-search">
            <label className="catalog-control-label" htmlFor="catalog-q">
              Search
            </label>
            <input defaultValue={q} id="catalog-q" name="q" placeholder="Search by product name, feature, or keyword" />
          </div>

          <div className="catalog-toolbar-block">
            <label className="catalog-control-label" htmlFor="catalog-category">
              Category
            </label>
            <select defaultValue={category} id="catalog-category" name="category">
              <option value="all">All root categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="catalog-toolbar-block">
            <label className="catalog-control-label" htmlFor="catalog-availability">
              Availability
            </label>
            <select defaultValue={availability} id="catalog-availability" name="availability">
              <option value="all">All availability</option>
              <option value="in-stock">In Stock</option>
              <option value="pre-order">Pre Order</option>
              <option value="up-coming">Up Coming</option>
              <option value="out-of-stock">Out Of Stock</option>
            </select>
          </div>

          <div className="catalog-toolbar-block">
            <label className="catalog-control-label" htmlFor="catalog-show">
              Show
            </label>
            <select defaultValue={String(show)} id="catalog-show" name="show">
              {["20", "24", "48", "75", "90"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="catalog-toolbar-block">
            <label className="catalog-control-label" htmlFor="catalog-sort">
              Sort By
            </label>
            <select defaultValue={sort} id="catalog-sort" name="sort">
              <option value="featured">Default</option>
              <option value="price-asc">Price (Low &gt; High)</option>
              <option value="price-desc">Price (High &gt; Low)</option>
              <option value="deal">Biggest savings</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>

          <div className="catalog-toolbar-block price-range-block">
            <label className="catalog-control-label">Price Range</label>
            <div className="catalog-price-pair">
              <input defaultValue={minPrice ?? ""} inputMode="numeric" name="minPrice" placeholder="Min" />
              <input defaultValue={maxPrice ?? ""} inputMode="numeric" name="maxPrice" placeholder="Max" />
            </div>
          </div>

          <label className="catalog-check-row">
            <input defaultChecked={dealsOnly} name="deals" type="checkbox" value="1" />
            <span>Deals only</span>
          </label>

          <div className="catalog-toolbar-actions">
            <button type="submit">Apply Filters</button>
            <Link className="ghost-action" href="/catalog">
              Clear
            </Link>
          </div>
        </form>

        <div className="catalog-meta">
          <span>
            {results.total.toLocaleString()} results
            {q ? ` for "${q}"` : ""}
          </span>
          <span>
            Page {results.page} of {results.totalPages} · Showing {results.items.length} of {results.total.toLocaleString()}
          </span>
        </div>

        <div className="catalog-chip-row">
          <Link className={category === "all" ? "tone-chip active" : "tone-chip"} href="/catalog">
            All
          </Link>
          <Link
            className={availability === "in-stock" ? "tone-chip active" : "tone-chip"}
            href={`/catalog${buildQueryString({
              q,
              category,
              sort,
              availability: availability === "in-stock" ? "all" : "in-stock",
              show,
              minPrice,
              maxPrice,
              deals: dealsOnly ? 1 : undefined,
            })}`}
          >
            In Stock
          </Link>
          <Link
            className={availability === "pre-order" ? "tone-chip active" : "tone-chip"}
            href={`/catalog${buildQueryString({
              q,
              category,
              sort,
              availability: availability === "pre-order" ? "all" : "pre-order",
              show,
              minPrice,
              maxPrice,
              deals: dealsOnly ? 1 : undefined,
            })}`}
          >
            Pre Order
          </Link>
          <Link
            className={availability === "up-coming" ? "tone-chip active" : "tone-chip"}
            href={`/catalog${buildQueryString({
              q,
              category,
              sort,
              availability: availability === "up-coming" ? "all" : "up-coming",
              show,
              minPrice,
              maxPrice,
              deals: dealsOnly ? 1 : undefined,
            })}`}
          >
            Up Coming
          </Link>
          <Link
            className={dealsOnly ? "tone-chip active" : "tone-chip"}
            href={`/catalog${buildQueryString({
              q,
              category,
              sort,
              availability,
              show,
              minPrice,
              maxPrice,
              deals: dealsOnly ? undefined : 1,
            })}`}
          >
            Deals
          </Link>
          {categories.slice(0, 12).map((item) => (
            <Link
              className={category === item.slug ? "tone-chip active" : "tone-chip"}
              href={`/catalog${buildQueryString({
                q,
                category: item.slug,
                sort,
                availability,
                show,
                minPrice,
                maxPrice,
                deals: dealsOnly ? 1 : undefined,
              })}`}
              key={item.slug}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      {results.items.length > 0 ? (
        <section className="catalog-results-grid">
          {results.items.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </section>
      ) : (
        <section className="content-surface">
          <div className="info-card">
            <span className="section-eyebrow">No Matches</span>
            <h2>No products matched the current query.</h2>
            <p>Try a broader keyword, switch root categories, or reset to the full catalog.</p>
            <Link className="ghost-action" href="/catalog">
              Reset search
            </Link>
          </div>
        </section>
      )}

      <nav className="pagination-row" aria-label="Catalog pagination">
        <Link
          className={results.page <= 1 ? "page-link disabled" : "page-link"}
          href={`/catalog${buildQueryString({
            q,
            category,
            sort,
            availability,
            show,
            minPrice,
            maxPrice,
            deals: dealsOnly ? 1 : undefined,
            page: Math.max(results.page - 1, 1),
          })}`}
        >
          Previous
        </Link>

        <div className="page-badges">
          {Array.from({ length: Math.min(results.totalPages, 5) }, (_, index) => {
            const safeStart = Math.max(1, Math.min(results.page - 2, results.totalPages - 4));
            const pageNumber = safeStart + index;

            return (
              <Link
                className={pageNumber === results.page ? "page-link active" : "page-link"}
                href={`/catalog${buildQueryString({
                  q,
                  category,
                  sort,
                  availability,
                  show,
                  minPrice,
                  maxPrice,
                  deals: dealsOnly ? 1 : undefined,
                  page: pageNumber,
                })}`}
                key={pageNumber}
              >
                {pageNumber}
              </Link>
            );
          })}
        </div>

        <Link
          className={results.page >= results.totalPages ? "page-link disabled" : "page-link"}
          href={`/catalog${buildQueryString({
            q,
            category,
            sort,
            availability,
            show,
            minPrice,
            maxPrice,
            deals: dealsOnly ? 1 : undefined,
            page: Math.min(results.page + 1, results.totalPages),
          })}`}
        >
          Next
        </Link>
      </nav>

      {results.page < results.totalPages ? (
        <section className="content-surface compact-surface see-more-surface">
          <div className="info-card accent">
            <span className="section-eyebrow">See More</span>
            <h2>Continue browsing the catalog</h2>
            <p>Move to the next result page while keeping the current filters, sorting, and show-count intact.</p>
            <Link
              className="primary-action"
              href={`/catalog${buildQueryString({
                q,
                category,
                sort,
                availability,
                show,
                minPrice,
                maxPrice,
                deals: dealsOnly ? 1 : undefined,
                page: results.page + 1,
              })}`}
            >
              See More Products
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
