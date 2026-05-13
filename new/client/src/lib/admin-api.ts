const base = "";

const STORAGE_KEY = "dh_admin_key";

export function getStoredAdminKey(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredAdminKey(key: string) {
  sessionStorage.setItem(STORAGE_KEY, key);
}

export type AdminStoredProduct = {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  imageUrl: string | null;
  badges: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  featuredNew: boolean;
  featuredBest: boolean;
  createdAt: number;
};

export type AdminCategory = { id: string; slug: string; name: string };

async function adminFetch(path: string, init?: RequestInit, adminKey?: string) {
  const key = adminKey ?? getStoredAdminKey();
  const res = await fetch(`${base}/api/admin${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": key,
      ...init?.headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error ?? (text || res.statusText);
    throw new Error(err);
  }
  return data;
}

export async function adminExport(adminKey?: string) {
  return adminFetch("/export", { method: "GET" }, adminKey) as Promise<{
    categories: AdminCategory[];
    products: AdminStoredProduct[];
  }>;
}

export async function adminImport(
  body: { merge?: boolean; categories?: AdminCategory[]; products?: Record<string, unknown>[] },
  adminKey?: string,
) {
  return adminFetch(
    "/import",
    { method: "POST", body: JSON.stringify(body) },
    adminKey,
  ) as Promise<{ categoriesUpserted: number; productsUpserted: number; errors: string[] }>;
}

export async function adminListProducts(adminKey?: string) {
  const data = (await adminFetch("/products", { method: "GET" }, adminKey)) as { items: AdminStoredProduct[] };
  return data.items;
}

export async function adminCreateProduct(
  body: Partial<AdminStoredProduct> & { slug: string; categoryId: string; name: string; priceCents: number; stock: number },
  adminKey?: string,
) {
  return adminFetch("/products", { method: "POST", body: JSON.stringify(body) }, adminKey) as Promise<{
    product: AdminStoredProduct;
  }>;
}

export async function adminPatchProduct(id: string, patch: Partial<AdminStoredProduct>, adminKey?: string) {
  return adminFetch(`/products/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }, adminKey) as Promise<{
    product: AdminStoredProduct;
  }>;
}

export async function adminDeleteProduct(id: string, adminKey?: string) {
  return adminFetch(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }, adminKey) as Promise<{ ok: boolean }>;
}

export async function adminBulkDelete(ids: string[], adminKey?: string) {
  return adminFetch("/products/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }, adminKey) as Promise<{
    deleted: number;
  }>;
}

export async function adminListCategories(adminKey?: string) {
  const data = (await adminFetch("/categories", { method: "GET" }, adminKey)) as { items: AdminCategory[] };
  return data.items;
}

export async function adminCreateCategory(body: { slug: string; name: string; id?: string }, adminKey?: string) {
  return adminFetch("/categories", { method: "POST", body: JSON.stringify(body) }, adminKey) as Promise<{
    category: AdminCategory;
  }>;
}

export async function adminDeleteCategory(id: string, adminKey?: string) {
  return adminFetch(`/categories/${encodeURIComponent(id)}`, { method: "DELETE" }, adminKey) as Promise<{ ok: boolean }>;
}
