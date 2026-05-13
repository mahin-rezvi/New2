import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getRedis } from "./redis-client.js";
import type {
  CartState,
  Category,
  ImportProduct,
  OrderLine,
  OrderRecord,
  PublicProduct,
  SessionRecord,
  StoredProduct,
} from "./types.js";
import { K } from "./types.js";

const SESSION_DAYS = 14;

async function r() {
  return getRedis();
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

export async function listCategories(): Promise<Category[]> {
  const redis = await r();
  const ids = await redis.sMembers(K.categoriesAll());
  const out: Category[] = [];
  for (const id of ids) {
    const raw = await redis.get(K.category(id));
    if (raw) out.push(JSON.parse(raw) as Category);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const redis = await r();
  const id = await redis.get(K.categorySlug(slug));
  if (!id) return null;
  const raw = await redis.get(K.category(id));
  return raw ? (JSON.parse(raw) as Category) : null;
}

export async function saveCategory(c: Category): Promise<void> {
  const redis = await r();
  const prevRaw = await redis.get(K.category(c.id));
  if (prevRaw) {
    const prev = JSON.parse(prevRaw) as Category;
    if (prev.slug !== c.slug) {
      await redis.del(K.categorySlug(prev.slug));
    }
  }
  await redis.set(K.category(c.id), JSON.stringify(c));
  await redis.set(K.categorySlug(c.slug), c.id);
  await redis.sAdd(K.categoriesAll(), c.id);
}

export async function deleteCategory(id: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const redis = await r();
  const products = await loadAllProducts();
  if (products.some((p) => p.categoryId === id)) {
    return { ok: false, reason: "Category still has products" };
  }
  const raw = await redis.get(K.category(id));
  if (raw) {
    const c = JSON.parse(raw) as Category;
    await redis.del(K.categorySlug(c.slug));
  }
  await redis.del(K.category(id));
  await redis.sRem(K.categoriesAll(), id);
  return { ok: true };
}

async function loadAllProducts(): Promise<StoredProduct[]> {
  const redis = await r();
  const ids = await redis.sMembers(K.productsAll());
  const out: StoredProduct[] = [];
  for (const id of ids) {
    const raw = await redis.get(K.product(id));
    if (raw) out.push(JSON.parse(raw) as StoredProduct);
  }
  return out;
}

async function enrich(p: StoredProduct, cat: Map<string, Category>): Promise<PublicProduct> {
  const c = cat.get(p.categoryId);
  return {
    ...p,
    categorySlug: c?.slug ?? "unknown",
    categoryName: c?.name ?? "Unknown",
  };
}

export async function getProductById(id: string): Promise<StoredProduct | null> {
  const redis = await r();
  const raw = await redis.get(K.product(id));
  return raw ? (JSON.parse(raw) as StoredProduct) : null;
}

export async function getProductBySlug(slug: string): Promise<PublicProduct | null> {
  const redis = await r();
  const id = await redis.get(K.productSlug(slug));
  if (!id) return null;
  const p = await getProductById(id);
  if (!p) return null;
  const cats = await categoryMap();
  return enrich(p, cats);
}

async function categoryMap(): Promise<Map<string, Category>> {
  const list = await listCategories();
  return new Map(list.map((c) => [c.id, c]));
}

export type ProductListQuery = {
  q?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: "newest" | "price_asc" | "price_desc" | "popular";
  page: number;
  pageSize: number;
};

export async function listProductsPublic(q: ProductListQuery): Promise<{
  items: PublicProduct[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const cats = await categoryMap();
  let all = await loadAllProducts();
  const catBySlug = new Map([...cats.values()].map((c) => [c.slug, c]));

  if (q.categorySlug) {
    const c = catBySlug.get(q.categorySlug);
    if (c) all = all.filter((p) => p.categoryId === c.id);
    else all = [];
  }
  if (q.q?.trim()) {
    const t = q.q.trim().toLowerCase();
    all = all.filter((p) => {
      const d = (p.description ?? "").toLowerCase();
      return p.name.toLowerCase().includes(t) || d.includes(t);
    });
  }
  if (q.minPrice != null) all = all.filter((p) => p.priceCents >= q.minPrice!);
  if (q.maxPrice != null) all = all.filter((p) => p.priceCents <= q.maxPrice!);

  if (q.sort === "price_asc") all.sort((a, b) => a.priceCents - b.priceCents);
  else if (q.sort === "price_desc") all.sort((a, b) => b.priceCents - a.priceCents);
  else if (q.sort === "popular") all.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
  else all.sort((a, b) => b.createdAt - a.createdAt);

  const total = all.length;
  const start = (q.page - 1) * q.pageSize;
  const slice = all.slice(start, start + q.pageSize);
  const items = await Promise.all(slice.map((p) => enrich(p, cats)));
  return { items, total, page: q.page, pageSize: q.pageSize };
}

export async function featuredProducts(): Promise<{ newArrivals: PublicProduct[]; bestSellers: PublicProduct[] }> {
  const cats = await categoryMap();
  const all = await loadAllProducts();
  const na = all.filter((p) => p.featuredNew).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
  const bs = all.filter((p) => p.featuredBest).sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
  return {
    newArrivals: await Promise.all(na.map((p) => enrich(p, cats))),
    bestSellers: await Promise.all(bs.map((p) => enrich(p, cats))),
  };
}

export async function saveProduct(p: StoredProduct): Promise<void> {
  const redis = await r();
  const prevId = await redis.get(K.productSlug(p.slug));
  if (prevId && prevId !== p.id) {
    throw new Error(`Slug already used by another product: ${p.slug}`);
  }
  const old = await getProductById(p.id);
  if (old && old.slug !== p.slug) {
    await redis.del(K.productSlug(old.slug));
  }
  await redis.set(K.product(p.id), JSON.stringify(p));
  await redis.set(K.productSlug(p.slug), p.id);
  await redis.sAdd(K.productsAll(), p.id);
}

export async function deleteProduct(id: string): Promise<void> {
  const redis = await r();
  const raw = await redis.get(K.product(id));
  if (raw) {
    const p = JSON.parse(raw) as StoredProduct;
    await redis.del(K.productSlug(p.slug));
  }
  await redis.del(K.product(id));
  await redis.sRem(K.productsAll(), id);
}

export async function getOrCreateCart(cartId: string): Promise<void> {
  const redis = await r();
  const exists = await redis.exists(K.cart(cartId));
  if (!exists) {
    const state: CartState = { updatedAt: Date.now(), items: {} };
    await redis.set(K.cart(cartId), JSON.stringify(state));
  }
}

export async function getCart(cartId: string): Promise<CartState> {
  const redis = await r();
  const raw = await redis.get(K.cart(cartId));
  if (!raw) return { updatedAt: Date.now(), items: {} };
  return JSON.parse(raw) as CartState;
}

export async function setCart(cartId: string, state: CartState): Promise<void> {
  const redis = await r();
  state.updatedAt = Date.now();
  await redis.set(K.cart(cartId), JSON.stringify(state));
}

export type CartLineRow = {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    priceCents: number;
    currency: string;
    imageUrl: string | null;
    stock: number;
  };
};

export async function cartLines(cartId: string): Promise<CartLineRow[]> {
  const state = await getCart(cartId);
  const lines: CartLineRow[] = [];
  for (const [productId, quantity] of Object.entries(state.items)) {
    const p = await getProductById(productId);
    if (!p) continue;
    lines.push({
      productId,
      quantity,
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceCents: p.priceCents,
        currency: p.currency,
        imageUrl: p.imageUrl,
        stock: p.stock,
      },
    });
  }
  return lines;
}

export async function createOrder(
  o: OrderRecord,
  lines: Omit<OrderLine, "id">[],
): Promise<void> {
  const redis = await r();
  await redis.set(K.order(o.id), JSON.stringify(o));
  const withIds: OrderLine[] = lines.map((l) => ({ ...l, id: crypto.randomUUID() }));
  await redis.set(K.orderLines(o.id), JSON.stringify(withIds));
  await redis.lPush(K.userOrders(o.userId), o.id);
}

export async function getOrder(orderId: string): Promise<{ order: OrderRecord; lines: OrderLine[] } | null> {
  const redis = await r();
  const raw = await redis.get(K.order(orderId));
  if (!raw) return null;
  const order = JSON.parse(raw) as OrderRecord;
  const lr = await redis.get(K.orderLines(orderId));
  const lines = lr ? (JSON.parse(lr) as OrderLine[]) : [];
  return { order, lines };
}

export async function updateOrder(orderId: string, patch: Partial<OrderRecord>): Promise<void> {
  const redis = await r();
  const cur = await getOrder(orderId);
  if (!cur) return;
  const next = { ...cur.order, ...patch };
  await redis.set(K.order(orderId), JSON.stringify(next));
}

export async function listUserOrders(userId: string): Promise<OrderRecord[]> {
  const redis = await r();
  const ids = await redis.lRange(K.userOrders(userId), 0, -1);
  const out: OrderRecord[] = [];
  for (const id of ids) {
    const raw = await redis.get(K.order(id));
    if (raw) out.push(JSON.parse(raw) as OrderRecord);
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

/** --- Auth --- */
export type UserPublic = { id: string; email: string; name: string | null; createdAt: number };

export async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const redis = await r();
  const id = await redis.get(K.userEmail(email));
  return id ? { id } : null;
}

export async function getUser(id: string): Promise<UserPublic | null> {
  const redis = await r();
  const raw = await redis.get(K.user(id));
  return raw ? (JSON.parse(raw) as UserPublic) : null;
}

export async function createUser(email: string, password: string, name: string): Promise<UserPublic> {
  const redis = await r();
  const id = crypto.randomUUID();
  const lower = email.toLowerCase();
  if (await redis.get(K.userEmail(lower))) throw new Error("Email already registered");
  const hash = bcrypt.hashSync(password, 10);
  const user: UserPublic = { id, email: lower, name, createdAt: Date.now() };
  await redis.set(K.user(id), JSON.stringify(user));
  await redis.set(K.userEmail(lower), id);
  await redis.set(K.userPwd(id), hash);
  return user;
}

export async function verifyUser(email: string, password: string): Promise<UserPublic | null> {
  const redis = await r();
  const id = await redis.get(K.userEmail(email.toLowerCase()));
  if (!id) return null;
  const hash = await redis.get(K.userPwd(id));
  if (!hash) return null;
  const ok = bcrypt.compareSync(password, hash);
  if (!ok) return null;
  const raw = await redis.get(K.user(id));
  return raw ? (JSON.parse(raw) as UserPublic) : null;
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: number }> {
  const redis = await r();
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const rec: SessionRecord = { userId, expiresAt };
  await redis.set(K.session(token), JSON.stringify(rec), { PXAT: expiresAt });
  return { token, expiresAt };
}

export async function getSession(token: string): Promise<SessionRecord | null> {
  const redis = await r();
  const raw = await redis.get(K.session(token));
  if (!raw) return null;
  const s = JSON.parse(raw) as SessionRecord;
  if (s.expiresAt < Date.now()) {
    await redis.del(K.session(token));
    return null;
  }
  return s;
}

export async function deleteSession(token: string): Promise<void> {
  const redis = await r();
  await redis.del(K.session(token));
}

/** --- Admin / bulk --- */
export async function exportAll(): Promise<{ categories: Category[]; products: StoredProduct[] }> {
  const categories = await listCategories();
  const products = await loadAllProducts();
  return { categories, products };
}

export async function importPayload(
  body: { categories?: Category[]; products?: ImportProduct[]; merge?: boolean },
): Promise<{ categoriesUpserted: number; productsUpserted: number; errors: string[] }> {
  const errors: string[] = [];
  let categoriesUpserted = 0;
  let productsUpserted = 0;

  if (body.categories?.length) {
    for (const c of body.categories) {
      if (!c.id || !c.slug || !c.name) {
        errors.push(`Invalid category: ${JSON.stringify(c)}`);
        continue;
      }
      await saveCategory(c);
      categoriesUpserted += 1;
    }
  }

  const catList = await listCategories();
  const catBySlug = new Map(catList.map((c) => [c.slug, c]));

  if (body.products?.length) {
    for (const raw of body.products) {
      try {
        const id = raw.id ?? crypto.randomUUID();
        const slug = raw.slug ? slugify(raw.slug) : slugify(raw.name ?? id);
        let categoryId = raw.categoryId;
        if (!categoryId && typeof raw.categorySlug === "string") {
          const c = catBySlug.get(raw.categorySlug);
          if (!c) {
            const nid = crypto.randomUUID();
            const nc: Category = { id: nid, slug: raw.categorySlug, name: raw.categorySlug };
            await saveCategory(nc);
            catBySlug.set(nc.slug, nc);
            categoryId = nid;
          } else categoryId = c.id;
        }
        if (!categoryId) {
          errors.push(`Product missing category: ${raw.name ?? id}`);
          continue;
        }
        const now = Date.now();
        const existing = await getProductById(id);
        const createdAt = existing?.createdAt ?? raw.createdAt ?? now;
        const p: StoredProduct = {
          id,
          slug,
          categoryId,
          name: raw.name ?? "Untitled",
          description: raw.description ?? null,
          priceCents: raw.priceCents ?? 0,
          compareAtCents: raw.compareAtCents ?? null,
          currency: raw.currency ?? "BDT",
          imageUrl: raw.imageUrl ?? null,
          badges: Array.isArray(raw.badges) ? raw.badges : [],
          stock: raw.stock ?? 0,
          rating: raw.rating ?? 4.5,
          reviewCount: raw.reviewCount ?? 0,
          featuredNew: raw.featuredNew ?? false,
          featuredBest: raw.featuredBest ?? false,
          createdAt,
        };
        if (!body.merge && existing) {
          errors.push(`Product id exists (use merge): ${id}`);
          continue;
        }
        await saveProduct(p);
        productsUpserted += 1;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }

  return { categoriesUpserted, productsUpserted, errors };
}

export async function bulkDeleteProducts(ids: string[]): Promise<number> {
  let n = 0;
  for (const id of ids) {
    await deleteProduct(id);
    n += 1;
  }
  return n;
}

export { slugify };
