const base = "";

export type Category = {
  id: string;
  slug: string;
  name: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  badges: string[];
  stock: number;
  rating: number;
  reviewCount: number;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export type CartLine = {
  productId: string;
  quantity: number;
  product: Pick<Product, "id" | "name" | "slug" | "priceCents" | "currency" | "imageUrl" | "stock">;
};

export type CartResponse = { lines: CartLine[]; subtotalCents: number; currency: string };

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${base}/api/categories`);
  return parseJson<Category[]>(res);
}

export type ProductQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  pageSize?: number;
};

export function productsUrl(query: ProductQuery): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.category) p.set("category", query.category);
  if (query.minPrice != null) p.set("minPrice", String(query.minPrice));
  if (query.maxPrice != null) p.set("maxPrice", String(query.maxPrice));
  if (query.sort) p.set("sort", query.sort);
  if (query.page) p.set("page", String(query.page));
  if (query.pageSize) p.set("pageSize", String(query.pageSize));
  const qs = p.toString();
  return `${base}/api/products${qs ? `?${qs}` : ""}`;
}

export async function fetchProducts(query: ProductQuery): Promise<ProductListResponse> {
  const res = await fetch(productsUrl(query));
  return parseJson<ProductListResponse>(res);
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`${base}/api/products/${encodeURIComponent(slug)}`);
  return parseJson<Product>(res);
}

export async function fetchFeatured(): Promise<{ newArrivals: Product[]; bestSellers: Product[] }> {
  const res = await fetch(`${base}/api/products/featured`);
  return parseJson(res);
}

export async function fetchCart(): Promise<CartResponse> {
  const res = await fetch(`${base}/api/cart`, { credentials: "include" });
  return parseJson<CartResponse>(res);
}

export async function postCartItem(productId: string, quantity: number): Promise<CartResponse> {
  const res = await fetch(`${base}/api/cart/items`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  return parseJson<CartResponse>(res);
}

export async function patchCartLine(productId: string, quantity: number): Promise<CartResponse> {
  const res = await fetch(`${base}/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  return parseJson<CartResponse>(res);
}

export async function deleteCartLine(productId: string): Promise<CartResponse> {
  const res = await fetch(`${base}/api/cart/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson<CartResponse>(res);
}

export type CheckoutInput = {
  paymentMethod: "cod" | "stripe";
  shipping: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
  };
};

export type CheckoutResponse =
  | { orderId: string; status: string; paymentMethod: "cod" }
  | { clientSecret: string; orderId: string; paymentMethod: "stripe" };

export async function postCheckout(body: CheckoutInput): Promise<CheckoutResponse> {
  const res = await fetch(`${base}/api/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<CheckoutResponse>(res);
}

export async function postStripeConfirm(orderId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${base}/api/checkout/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return parseJson(res);
}

export type OrderSummary = {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  currency: string;
};

export async function fetchMyOrders(): Promise<OrderSummary[]> {
  const res = await fetch(`${base}/api/orders/me`, { credentials: "include" });
  return parseJson<OrderSummary[]>(res);
}
