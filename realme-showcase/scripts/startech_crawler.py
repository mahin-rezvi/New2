import argparse
import hashlib
import json
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET

import requests
from bs4 import BeautifulSoup, Tag


BASE_URL = "https://www.startech.com.bd/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/136.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}
SHOWING_RE = re.compile(
    r"Showing\s+\d+\s+to\s+\d+\s+of\s+(\d+)\s+\((\d+)\s+Pages\)",
    re.IGNORECASE,
)
PRODUCT_ID_RE = re.compile(r"cart\.add\('(\d+)'")
PRICE_RE = re.compile(r"\d[\d,]*")
SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
THREAD_LOCAL = threading.local()


@dataclass
class RootCategory:
    name: str
    url: str
    slug: str


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    return re.sub(r"\s+", " ", value).strip()


def node_text(node: Tag | None) -> str | None:
    if node is None:
        return None
    return clean_text(node.get_text(" ", strip=True))


def to_int_from_price(value: str | None) -> int | None:
    if not value:
        return None
    match = PRICE_RE.search(value.replace("৳", ""))
    if not match:
        return None
    return int(match.group(0).replace(",", ""))


def slug_from_url(url: str) -> str:
    return urlparse(url).path.rstrip("/").split("/")[-1]


def get_session() -> requests.Session:
    session = getattr(THREAD_LOCAL, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update(HEADERS)
        THREAD_LOCAL.session = session
    return session


def url_to_cache_path(cache_dir: Path, url: str) -> Path:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return cache_dir / f"{digest}.html"


def fetch_text(url: str, cache_dir: Path, refresh: bool = False, retries: int = 3) -> str:
    cache_path = url_to_cache_path(cache_dir, url)
    if cache_path.exists() and not refresh:
        return cache_path.read_text(encoding="utf-8")

    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            response = get_session().get(url, timeout=30)
            response.raise_for_status()
            text = response.text
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_text(text, encoding="utf-8")
            return text
        except Exception as error:  # noqa: BLE001
            last_error = error
            time.sleep(1 + attempt)

    raise RuntimeError(f"Failed to fetch {url}") from last_error


def fetch_soup(url: str, cache_dir: Path, refresh: bool = False) -> BeautifulSoup:
    return BeautifulSoup(fetch_text(url, cache_dir, refresh=refresh), "html.parser")


def unique_preserving_order(values: list[str]) -> list[str]:
    seen = set()
    ordered = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


def parse_root_categories(homepage_soup: BeautifulSoup) -> list[RootCategory]:
    categories = []
    for link in homepage_soup.select("#main-nav > .container > ul.navbar-nav > li.nav-item > a.nav-link"):
        name = node_text(link)
        href = link.get("href")
        if not name or not href:
            continue
        categories.append(
            RootCategory(
                name=name,
                url=urljoin(BASE_URL, href),
                slug=slug_from_url(href),
            )
        )
    return categories


def parse_breadcrumbs(soup: BeautifulSoup) -> list[dict[str, str | None]]:
    breadcrumbs = []
    for item in soup.select(".breadcrumb li"):
        link = item.find("a", href=True)
        text = node_text(item)
        if not text:
            continue
        breadcrumbs.append(
            {
                "text": text,
                "url": urljoin(BASE_URL, link["href"]) if link else None,
            }
        )
    return breadcrumbs


def parse_child_categories(soup: BeautifulSoup) -> list[dict[str, str]]:
    child_categories = []
    for link in soup.select(".child-list a[href]"):
        text = node_text(link)
        href = link.get("href")
        if not text or not href:
            continue
        child_categories.append({"name": text, "url": urljoin(BASE_URL, href)})
    return child_categories


def parse_filters(soup: BeautifulSoup) -> list[dict[str, Any]]:
    groups = []
    for group in soup.select(".filter-group"):
        label = node_text(group.select_one(".label span"))
        items = []
        for item in group.select(".items label.filter span"):
            text = node_text(item)
            if text:
                items.append(text)
        if label:
            groups.append({"name": label, "items": items})
    return groups


def parse_category_overview(soup: BeautifulSoup) -> dict[str, Any]:
    html = str(soup)
    match = SHOWING_RE.search(html)
    total_products = int(match.group(1)) if match else 0
    total_pages = int(match.group(2)) if match else 1
    title = clean_text(soup.title.get_text()) if soup.title else None
    h1 = node_text(soup.find("h1"))

    return {
        "title": title,
        "headline": h1,
        "total_products": total_products,
        "total_pages": total_pages,
        "breadcrumbs": parse_breadcrumbs(soup),
        "child_categories": parse_child_categories(soup),
        "filters": parse_filters(soup),
    }


def parse_product_card(card: Tag, root: RootCategory, page_url: str) -> dict[str, Any]:
    link = card.select_one(".p-item-name a[href]")
    image = card.select_one(".p-item-img img")
    action = card.select_one(".btn-add-cart")
    current_price_node = card.select_one(".p-item-price .price-new")
    if current_price_node is None:
        current_price_node = card.select_one(".p-item-price span")
    old_price_node = card.select_one(".p-item-price .price-old")

    product_url = urljoin(BASE_URL, link["href"]) if link and link.get("href") else None
    name = node_text(link)
    current_price_text = node_text(current_price_node)
    old_price_text = node_text(old_price_node)
    save_text = node_text(card.select_one(".marks .mark"))
    product_id = None

    if action and action.get("onclick"):
        match = PRODUCT_ID_RE.search(action["onclick"])
        if match:
            product_id = match.group(1)

    return {
        "slug": slug_from_url(product_url) if product_url else None,
        "product_id": product_id,
        "name": name,
        "url": product_url,
        "image": image.get("src") if image else None,
        "highlights": [
            text
            for text in (node_text(item) for item in card.select(".short-description li"))
            if text
        ],
        "current_price_text": current_price_text,
        "old_price_text": old_price_text,
        "save_text": save_text,
        "current_price_value": to_int_from_price(current_price_text),
        "old_price_value": to_int_from_price(old_price_text),
        "save_value": to_int_from_price(save_text),
        "root_category": root.name,
        "root_category_slug": root.slug,
        "root_category_url": root.url,
        "source_pages": [page_url],
    }


def parse_category_page_products(soup: BeautifulSoup, root: RootCategory, page_url: str) -> list[dict[str, Any]]:
    products = []
    for card in soup.select(".p-item"):
        product = parse_product_card(card, root, page_url)
        if product["url"] and product["name"]:
            products.append(product)
    return products


def merge_products(existing: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    source_pages = unique_preserving_order(existing["source_pages"] + incoming["source_pages"])
    root_categories = unique_preserving_order(
        [existing["root_category"], incoming["root_category"]]
        + existing.get("root_categories", [])
        + incoming.get("root_categories", [])
    )

    merged = {**existing}
    merged["source_pages"] = source_pages
    merged["root_categories"] = root_categories
    merged["root_category"] = existing["root_category"]
    return merged


def crawl_category(
    root: RootCategory,
    cache_dir: Path,
    page_workers: int,
    refresh: bool,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    first_soup = fetch_soup(root.url, cache_dir, refresh=refresh)
    overview = parse_category_overview(first_soup)
    all_products = parse_category_page_products(first_soup, root, root.url)

    page_urls = [f"{root.url}?page={page}" for page in range(2, overview["total_pages"] + 1)]

    def worker(page_url: str) -> list[dict[str, Any]]:
        page_soup = fetch_soup(page_url, cache_dir, refresh=refresh)
        return parse_category_page_products(page_soup, root, page_url)

    if page_urls:
        with ThreadPoolExecutor(max_workers=page_workers) as executor:
            future_map = {executor.submit(worker, page_url): page_url for page_url in page_urls}
            for future in as_completed(future_map):
                all_products.extend(future.result())

    category_record = {
        "name": root.name,
        "slug": root.slug,
        "url": root.url,
        "title": overview["title"],
        "headline": overview["headline"],
        "total_products": overview["total_products"],
        "total_pages": overview["total_pages"],
        "breadcrumbs": overview["breadcrumbs"],
        "child_categories": overview["child_categories"],
        "filters": overview["filters"],
    }
    return category_record, all_products


def load_sitemap_summary(cache_dir: Path, refresh: bool) -> dict[str, Any]:
    sitemap_soup = fetch_text(urljoin(BASE_URL, "sitemap.xml"), cache_dir, refresh=refresh)
    root = ET.fromstring(sitemap_soup)
    urls = [loc.text.strip() for loc in root.findall(".//sm:loc", SITEMAP_NS)]
    top_level_counts: dict[str, int] = {}

    for url in urls:
        path = url.replace("https://www.startech.com.bd", "")
        first_segment = "/" + path.strip("/").split("/")[0] if path.strip("/") else "/"
        top_level_counts[first_segment] = top_level_counts.get(first_segment, 0) + 1

    top_level_breakdown = [
        {"segment": segment, "count": count}
        for segment, count in sorted(top_level_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    robots_text = fetch_text(urljoin(BASE_URL, "robots.txt"), cache_dir, refresh=refresh)
    disallowed = []
    for line in robots_text.splitlines():
        line = line.strip()
        if line.lower().startswith("disallow:"):
            disallowed.append(line.split(":", 1)[1].strip())

    return {
        "sitemap_url_count": len(urls),
        "sitemap_top_level_breakdown": top_level_breakdown[:20],
        "robots_disallow_rules": disallowed,
    }


def build_analysis(categories: list[dict[str, Any]], products: list[dict[str, Any]], sitemap_summary: dict[str, Any]) -> dict[str, Any]:
    priced = [product["current_price_value"] for product in products if product["current_price_value"] is not None]
    discounted = [product for product in products if product["save_value"]]
    root_breakdown = [
        {
            "name": category["name"],
            "slug": category["slug"],
            "products": category["total_products"],
            "pages": category["total_pages"],
        }
        for category in sorted(categories, key=lambda item: item["total_products"], reverse=True)
    ]

    price_bands = [
        {"label": "Under 1k", "min": 0, "max": 999},
        {"label": "1k-5k", "min": 1000, "max": 4999},
        {"label": "5k-10k", "min": 5000, "max": 9999},
        {"label": "10k-25k", "min": 10000, "max": 24999},
        {"label": "25k-50k", "min": 25000, "max": 49999},
        {"label": "50k-100k", "min": 50000, "max": 99999},
        {"label": "100k+", "min": 100000, "max": None},
    ]

    for band in price_bands:
        band["count"] = sum(
            1
            for price in priced
            if price >= band["min"] and (band["max"] is None or price <= band["max"])
        )

    top_deals = sorted(
        (
            {
                "name": product["name"],
                "slug": product["slug"],
                "url": product["url"],
                "current_price_text": product["current_price_text"],
                "old_price_text": product["old_price_text"],
                "save_text": product["save_text"],
                "save_value": product["save_value"],
                "root_category": product["root_category"],
            }
            for product in discounted
        ),
        key=lambda item: item["save_value"] or 0,
        reverse=True,
    )[:20]

    price_summary = {
        "count": len(priced),
        "min": min(priced) if priced else None,
        "max": max(priced) if priced else None,
        "average": round(sum(priced) / len(priced), 2) if priced else None,
        "median": median(priced) if priced else None,
    }

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "site_summary": sitemap_summary,
        "catalog_summary": {
            "total_products": len(products),
            "root_category_count": len(categories),
            "discounted_product_count": len(discounted),
            "price_summary": price_summary,
        },
        "root_category_breakdown": root_breakdown,
        "price_bands": price_bands,
        "top_deals": top_deals,
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crawl Star Tech root catalog pages and generate a normalized dataset."
    )
    parser.add_argument(
        "--output-dir",
        default="src/data/startech",
        help="Directory for generated JSON files",
    )
    parser.add_argument(
        "--cache-dir",
        default=".cache/startech",
        help="Directory for cached HTML pages",
    )
    parser.add_argument(
        "--page-workers",
        type=int,
        default=8,
        help="Concurrent workers per root category for paginated listing pages",
    )
    parser.add_argument(
        "--max-roots",
        type=int,
        default=None,
        help="Optional limit for root categories, useful for dry runs",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Ignore cached HTML and refetch pages",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    cache_dir = Path(args.cache_dir)

    homepage_soup = fetch_soup(BASE_URL, cache_dir, refresh=args.refresh)
    roots = parse_root_categories(homepage_soup)
    if args.max_roots is not None:
        roots = roots[: args.max_roots]

    sitemap_summary = load_sitemap_summary(cache_dir, args.refresh)
    print(f"Discovered {len(roots)} root categories from homepage navigation.")

    categories = []
    product_map: dict[str, dict[str, Any]] = {}

    for index, root in enumerate(roots, start=1):
        print(f"[{index}/{len(roots)}] Crawling {root.name} -> {root.url}")
        category_record, products = crawl_category(
            root,
            cache_dir=cache_dir,
            page_workers=args.page_workers,
            refresh=args.refresh,
        )
        categories.append(category_record)

        for product in products:
            product_url = product["url"]
            if product_url in product_map:
                product_map[product_url] = merge_products(product_map[product_url], product)
            else:
                product["root_categories"] = [product["root_category"]]
                product_map[product_url] = product

        print(
            f"  pages={category_record['total_pages']} products={category_record['total_products']} unique_catalog={len(product_map)}"
        )

    products = sorted(product_map.values(), key=lambda item: item["name"] or "")
    analysis = build_analysis(categories, products, sitemap_summary)

    catalog_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_products": len(products),
        "products": products,
    }
    categories_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_categories": len(categories),
        "categories": sorted(categories, key=lambda item: item["name"]),
    }

    write_json(output_dir / "catalog.json", catalog_payload)
    write_json(output_dir / "categories.json", categories_payload)
    write_json(output_dir / "analysis.json", analysis)

    print(f"Saved catalog: {output_dir / 'catalog.json'}")
    print(f"Saved categories: {output_dir / 'categories.json'}")
    print(f"Saved analysis: {output_dir / 'analysis.json'}")
    print(f"Total products captured: {len(products)}")


if __name__ == "__main__":
    main()
