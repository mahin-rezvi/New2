import "server-only";

import { load } from "cheerio";
import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";


export type CatalogProduct = {
  slug: string;
  product_id: string | null;
  name: string;
  url: string;
  image: string | null;
  highlights: string[];
  current_price_text: string | null;
  old_price_text: string | null;
  save_text: string | null;
  current_price_value: number | null;
  old_price_value: number | null;
  save_value: number | null;
  root_category: string;
  root_category_slug: string;
  root_category_url: string;
  source_pages: string[];
  root_categories: string[];
};

export type CatalogFile = {
  generated_at: string;
  total_products: number;
  products: CatalogProduct[];
};

export type CategoryRecord = {
  name: string;
  slug: string;
  url: string;
  title: string | null;
  headline: string | null;
  total_products: number;
  total_pages: number;
  breadcrumbs: Array<{ text: string; url: string | null }>;
  child_categories: Array<{ name: string; url: string }>;
  filters: Array<{ name: string; items: string[] }>;
};

export type CategoriesFile = {
  generated_at: string;
  total_categories: number;
  categories: CategoryRecord[];
};

export type AnalysisFile = {
  generated_at: string;
  site_summary: {
    sitemap_url_count: number;
    sitemap_top_level_breakdown: Array<{ segment: string; count: number }>;
    robots_disallow_rules: string[];
  };
  catalog_summary: {
    total_products: number;
    root_category_count: number;
    discounted_product_count: number;
    price_summary: {
      count: number;
      min: number | null;
      max: number | null;
      average: number | null;
      median: number | null;
    };
  };
  root_category_breakdown: Array<{
    name: string;
    slug: string;
    products: number;
    pages: number;
  }>;
  price_bands: Array<{
    label: string;
    min: number;
    max: number | null;
    count: number;
  }>;
  top_deals: Array<{
    name: string;
    slug: string;
    url: string;
    current_price_text: string | null;
    old_price_text: string | null;
    save_text: string | null;
    save_value: number | null;
    root_category: string;
  }>;
};

export type SearchSort = "featured" | "price-asc" | "price-desc" | "deal" | "alpha";
export type CatalogAvailability = "all" | "in-stock" | "pre-order" | "up-coming" | "out-of-stock";

export type SearchOptions = {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: SearchSort;
  availability?: CatalogAvailability;
  minPrice?: number | null;
  maxPrice?: number | null;
  dealsOnly?: boolean;
};

export type SearchResult = {
  items: CatalogProduct[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  q: string;
  category: string;
  sort: SearchSort;
  availability: CatalogAvailability;
  minPrice: number | null;
  maxPrice: number | null;
  dealsOnly: boolean;
};

export type ProductFact = {
  label: string;
  value: string;
};

export type PaymentOption = {
  price: string;
  compareAt: string | null;
  label: string;
  note: string | null;
};

export type ProductSpecItem = {
  label: string;
  value: string;
};

export type ProductSpecGroup = {
  name: string;
  items: ProductSpecItem[];
};

export type ProductQuestion = {
  askedBy: string | null;
  askedAt: string | null;
  question: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
};

export type LiveProductDetail = {
  name: string | null;
  livePrice: string | null;
  oldPrice: string | null;
  regularPrice: string | null;
  status: string | null;
  productCode: string | null;
  brand: string | null;
  keyFeatures: string[];
  facts: ProductFact[];
  paymentOptions: PaymentOption[];
  specificationGroups: ProductSpecGroup[];
  descriptionHtml: string | null;
  questions: ProductQuestion[];
  reviewSummary: string | null;
  galleryImages: string[];
};

const dataDir = path.join(process.cwd(), "src", "data", "startech");
const STARTECH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "accept-language": "en-US,en;q=0.9",
};

const emptyCatalog: CatalogFile = {
  generated_at: "",
  total_products: 0,
  products: [],
};

const emptyCategories: CategoriesFile = {
  generated_at: "",
  total_categories: 0,
  categories: [],
};

const emptyAnalysis: AnalysisFile = {
  generated_at: "",
  site_summary: {
    sitemap_url_count: 0,
    sitemap_top_level_breakdown: [],
    robots_disallow_rules: [],
  },
  catalog_summary: {
    total_products: 0,
    root_category_count: 0,
    discounted_product_count: 0,
    price_summary: {
      count: 0,
      min: null,
      max: null,
      average: null,
      median: null,
    },
  },
  root_category_breakdown: [],
  price_bands: [],
  top_deals: [],
};

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const fullPath = path.join(dataDir, filename);

  try {
    const content = await fs.readFile(fullPath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function cleanText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    unique.push(value);
  }

  return unique;
}

function toAbsoluteUrl(baseUrl: string, candidate: string | null | undefined) {
  if (!candidate) {
    return null;
  }

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function parseFacts(html: string) {
  const $ = load(html);

  return $(".product-short-info tr.product-info-group")
    .map((_, row) => {
      const label = cleanText($(row).find(".product-info-label").first().text());
      const valueNode = $(row).find(".product-info-data").first();
      const value =
        label?.toLowerCase() === "price"
          ? cleanText(valueNode.find(".price-new").first().text()) ?? cleanText(valueNode.text())
          : cleanText(valueNode.text());

      if (!label || !value) {
        return null;
      }

      return { label, value };
    })
    .get()
    .filter((fact): fact is ProductFact => fact !== null);
}

function parsePaymentOptions(html: string) {
  const $ = load(html);

  return $(".product-price-options .p-wrap")
    .map((_, node) => {
      const tags = $(node)
        .find(".p-tag")
        .map((__, tag) => cleanText($(tag).text()))
        .get()
        .filter((value): value is string => Boolean(value));
      const isEmi = $(node).hasClass("emi");
      const label = isEmi ? "0% EMI" : (tags[0] ?? "Payment Option");
      const note = cleanText(isEmi ? tags.join(" · ") : tags.slice(1).join(" · "));
      const currentPrice =
        cleanText($(node).find(".price-new").first().text()) ??
        cleanText($(node).find(".price").first().clone().children().remove().end().text()) ??
        cleanText($(node).find(".price").first().text());
      const compareAt = cleanText($(node).find(".price-old").first().text());

      if (!label || !currentPrice) {
        return null;
      }

      return {
        label,
        note,
        price: currentPrice,
        compareAt,
      };
    })
    .get()
    .filter((option): option is PaymentOption => option !== null);
}

function parseSpecificationGroups(html: string) {
  const $ = load(html);
  const rows = $("#specification table tr").toArray();
  const groups: ProductSpecGroup[] = [];
  let currentGroup: ProductSpecGroup | null = null;

  for (const row of rows) {
    const cells = $(row)
      .find("th, td")
      .map((_, cell) => cleanText($(cell).text()))
      .get()
      .filter((value): value is string => Boolean(value));

    if (cells.length === 0) {
      continue;
    }

    if (cells.length === 1) {
      if (currentGroup && currentGroup.items.length > 0) {
        groups.push(currentGroup);
      }

      currentGroup = {
        name: cells[0],
        items: [],
      };
      continue;
    }

    if (!currentGroup) {
      currentGroup = {
        name: "General",
        items: [],
      };
    }

    currentGroup.items.push({
      label: cells[0],
      value: cells.slice(1).join(" "),
    });
  }

  if (currentGroup && currentGroup.items.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function sanitizeDescriptionHtml(html: string, productUrl: string) {
  const $ = load(html);
  const description = $("#description .full-description").first().clone();

  if (!description.length) {
    return null;
  }

  description.find("script, style, iframe, noscript, form, button").remove();

  description.find("*").each((_, node) => {
    const element = $(node);

    for (const attribute of Object.keys(node.attribs ?? {})) {
      if (attribute.startsWith("on")) {
        element.removeAttr(attribute);
      }
    }

    element.removeAttr("style");
    element.removeAttr("id");
  });

  description.find("a[href]").each((_, node) => {
    const element = $(node);
    const href = toAbsoluteUrl(productUrl, element.attr("href"));

    if (!href) {
      element.replaceWith(element.text());
      return;
    }

    element.attr("href", href);
    element.attr("target", "_blank");
    element.attr("rel", "noreferrer");
  });

  description.find("img").each((_, node) => {
    const element = $(node);
    const src = toAbsoluteUrl(productUrl, element.attr("src") ?? element.attr("data-src"));

    if (!src) {
      element.remove();
      return;
    }

    element.attr("src", src);
    element.attr("loading", "lazy");
    element.attr("decoding", "async");
    element.removeAttr("srcset");
    element.removeAttr("class");
    element.addClass("product-description-image");
  });

  description.find("table").each((_, node) => {
    const element = $(node);
    element.removeAttr("class");
    element.addClass("product-description-table");
  });

  description.find("ul, ol").each((_, node) => {
    const element = $(node);
    element.removeAttr("class");
    element.addClass("product-description-list");
  });

  const sanitized = cleanText(description.html() ?? null);
  return sanitized ? description.html() ?? null : null;
}

function parseQuestions(html: string) {
  const $ = load(html);

  return $("#question .question-wrap")
    .map((_, node) => {
      const askedBy = cleanText($(node).find(".author .name").first().text());
      const askedAt = cleanText($(node).find(".author time").first().text());
      const question = cleanText($(node).find(".question [itemprop='name']").first().text() || $(node).find(".question").first().text());
      const answer = cleanText($(node).find(".answer [itemprop='text']").first().text() || $(node).find(".answer").first().text());
      const answeredBy = cleanText($(node).find(".answerer [itemprop='author']").first().text());
      const answeredAt = cleanText($(node).find(".answerer time").first().text());

      if (!question) {
        return null;
      }

      return {
        askedBy,
        askedAt,
        question,
        answer,
        answeredBy,
        answeredAt,
      };
    })
    .get()
    .filter((item): item is ProductQuestion => item !== null);
}

function parseReviewSummary(html: string) {
  const $ = load(html);
  const summary = cleanText($("#review").text());

  if (!summary) {
    return null;
  }

  return summary.replace(/^assignment\s+/i, "");
}

function parseGalleryImages(html: string, productUrl: string, fallbackImage: string | null) {
  const $ = load(html);
  const thumbnailImages = $(".thumbnail")
    .map((_, node) => toAbsoluteUrl(productUrl, $(node).attr("href") ?? $(node).find("img").attr("src")))
    .get();

  return uniqueStrings(thumbnailImages.length > 0 ? thumbnailImages : [fallbackImage]);
}

export const getCatalog = cache(async () => {
  return readJsonFile<CatalogFile>("catalog.json", emptyCatalog);
});

export const getCategories = cache(async () => {
  return readJsonFile<CategoriesFile>("categories.json", emptyCategories);
});

export const getAnalysis = cache(async () => {
  return readJsonFile<AnalysisFile>("analysis.json", emptyAnalysis);
});

export async function getRootCategoryOptions() {
  const analysis = await getAnalysis();
  return analysis.root_category_breakdown;
}

function searchableText(product: CatalogProduct) {
  return [
    product.name,
    ...product.highlights,
    ...product.root_categories,
  ]
    .join(" ")
    .toLowerCase();
}

function scoreProduct(product: CatalogProduct, terms: string[]) {
  if (terms.length === 0) {
    return 0;
  }

  const name = product.name.toLowerCase();
  const text = searchableText(product);
  let score = 0;

  for (const term of terms) {
    if (name === term) {
      score += 90;
    } else if (name.startsWith(term)) {
      score += 55;
    } else if (name.includes(term)) {
      score += 30;
    } else if (text.includes(term)) {
      score += 12;
    }
  }

  if (product.save_value) {
    score += Math.min(product.save_value / 1000, 15);
  }

  return score;
}

function sortProducts(products: CatalogProduct[], sort: SearchSort, terms: string[]) {
  const sorted = [...products];

  sorted.sort((left, right) => {
    if (sort === "price-asc") {
      return (left.current_price_value ?? Number.POSITIVE_INFINITY) - (right.current_price_value ?? Number.POSITIVE_INFINITY);
    }

    if (sort === "price-desc") {
      return (right.current_price_value ?? -1) - (left.current_price_value ?? -1);
    }

    if (sort === "deal") {
      return (right.save_value ?? -1) - (left.save_value ?? -1);
    }

    if (sort === "alpha") {
      return left.name.localeCompare(right.name);
    }

    const scoreDelta = scoreProduct(right, terms) - scoreProduct(left, terms);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return (right.save_value ?? 0) - (left.save_value ?? 0) || left.name.localeCompare(right.name);
  });

  return sorted;
}

function normalizeSort(value: string | undefined): SearchSort {
  if (
    value === "featured" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "deal" ||
    value === "alpha"
  ) {
    return value;
  }

  return "featured";
}

export function getCatalogAvailability(product: CatalogProduct): Exclude<CatalogAvailability, "all"> {
  const priceText = (product.current_price_text ?? "").trim().toLowerCase();

  if (priceText.includes("out of stock")) {
    return "out-of-stock";
  }

  if (priceText.includes("pre order")) {
    return "pre-order";
  }

  if (priceText.includes("up coming") || priceText.includes("upcoming")) {
    return "up-coming";
  }

  return "in-stock";
}

function normalizeAvailability(value: string | undefined): CatalogAvailability {
  if (
    value === "all" ||
    value === "in-stock" ||
    value === "pre-order" ||
    value === "up-coming" ||
    value === "out-of-stock"
  ) {
    return value;
  }

  return "all";
}

export async function searchCatalog({
  q = "",
  category = "all",
  page = 1,
  pageSize = 24,
  sort = "featured",
  availability = "all",
  minPrice = null,
  maxPrice = null,
  dealsOnly = false,
}: SearchOptions): Promise<SearchResult> {
  const catalog = await getCatalog();
  const normalizedQ = q.trim().toLowerCase();
  const terms = normalizedQ.split(/\s+/).filter(Boolean);
  const normalizedCategory = category.trim().toLowerCase();
  const normalizedSort = normalizeSort(sort);
  const normalizedAvailability = normalizeAvailability(availability);
  let normalizedMinPrice = typeof minPrice === "number" && Number.isFinite(minPrice) ? minPrice : null;
  let normalizedMaxPrice = typeof maxPrice === "number" && Number.isFinite(maxPrice) ? maxPrice : null;

  if (normalizedMinPrice !== null && normalizedMaxPrice !== null && normalizedMinPrice > normalizedMaxPrice) {
    [normalizedMinPrice, normalizedMaxPrice] = [normalizedMaxPrice, normalizedMinPrice];
  }

  let filtered = catalog.products.filter((product) => {
    const matchesCategory =
      normalizedCategory === "all" ||
      product.root_category_slug === normalizedCategory ||
      product.root_categories.some((value) => value.toLowerCase() === normalizedCategory);

    if (!matchesCategory) {
      return false;
    }

    if (normalizedAvailability !== "all" && getCatalogAvailability(product) !== normalizedAvailability) {
      return false;
    }

    if (dealsOnly && !product.save_value) {
      return false;
    }

    if (normalizedMinPrice !== null || normalizedMaxPrice !== null) {
      const price = product.current_price_value;

      if (price === null) {
        return false;
      }

      if (normalizedMinPrice !== null && price < normalizedMinPrice) {
        return false;
      }

      if (normalizedMaxPrice !== null && price > normalizedMaxPrice) {
        return false;
      }
    }

    if (terms.length === 0) {
      return true;
    }

    const haystack = searchableText(product);
    return terms.every((term) => haystack.includes(term));
  });

  filtered = sortProducts(filtered, normalizedSort, terms);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    totalPages,
    page: safePage,
    pageSize,
    q,
    category: normalizedCategory || "all",
    sort: normalizedSort,
    availability: normalizedAvailability,
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
    dealsOnly,
  };
}

export async function getFeaturedProducts(limit = 8) {
  const catalog = await getCatalog();
  return sortProducts(catalog.products, "deal", []).slice(0, limit);
}

export const getLiveProductDetail = cache(async (productUrl: string, fallbackImage: string | null = null) => {
  try {
    const response = await fetch(productUrl, {
      cache: "no-store",
      headers: STARTECH_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Live scrape failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);
    const facts = parseFacts(html);
    const factMap = new Map(facts.map((fact) => [fact.label.toLowerCase(), fact.value]));
    const paymentOptions = parsePaymentOptions(html);

    return {
      name: cleanText($(".product-name").first().text()),
      livePrice: paymentOptions[0]?.price ?? cleanText($(".product-price-options .price-new").first().text()),
      oldPrice: paymentOptions[0]?.compareAt ?? cleanText($(".product-price-options .price-old").first().text()),
      regularPrice: factMap.get("regular price") ?? paymentOptions[1]?.label.replace(/^Regular Price:\s*/i, "") ?? null,
      status: factMap.get("status") ?? null,
      productCode: factMap.get("product code") ?? null,
      brand: factMap.get("brand") ?? null,
      keyFeatures: $(".short-description li")
        .map((_, node) => cleanText($(node).text()))
        .get()
        .filter((value): value is string => Boolean(value) && !/view more info/i.test(value)),
      facts,
      paymentOptions,
      specificationGroups: parseSpecificationGroups(html),
      descriptionHtml: sanitizeDescriptionHtml(html, productUrl),
      questions: parseQuestions(html),
      reviewSummary: parseReviewSummary(html),
      galleryImages: parseGalleryImages(html, productUrl, fallbackImage),
    } satisfies LiveProductDetail;
  } catch (error) {
    console.error(`Failed to scrape live product detail for ${productUrl}`, error);
    return null;
  }
});

export async function getProductBySlug(slug: string) {
  const catalog = await getCatalog();
  return catalog.products.find((product) => product.slug === slug) ?? null;
}

export async function getRelatedProducts(product: CatalogProduct, limit = 4) {
  const catalog = await getCatalog();

  return sortProducts(
    catalog.products.filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        candidate.root_categories.some((value) => product.root_categories.includes(value)),
    ),
    "deal",
    [],
  ).slice(0, limit);
}
