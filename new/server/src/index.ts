import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import Stripe from "stripe";
import { z } from "zod";
import { getRedis } from "./redis-client.js";
import * as store from "./redis-store.js";
import type { ImportProduct, OrderRecord, StoredProduct } from "./types.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const CART_COOKIE = "dh_cart";
const SESSION_COOKIE = "dh_session";
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: CLIENT_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

async function sessionUserId(c: Context): Promise<string | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const s = await store.getSession(token);
  return s?.userId ?? null;
}

async function getOrCreateCartId(c: Context): Promise<string> {
  let id = getCookie(c, CART_COOKIE);
  if (id) {
    await store.getOrCreateCart(id);
    return id;
  }
  id = crypto.randomUUID();
  await store.getOrCreateCart(id);
  setCookie(c, CART_COOKIE, id, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

function setSessionCookie(c: Context, token: string, maxAgeSec: number) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: maxAgeSec,
  });
}

function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

/** --- Auth --- */
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
});

app.post("/api/auth/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  try {
    const user = await store.createUser(parsed.data.email, parsed.data.password, parsed.data.name);
    const { token, expiresAt } = await store.createSession(user.id);
    const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
    setSessionCookie(c, token, maxAge);
    return c.json({ user: { id: user.id, email: user.email, name: user.name } }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Register failed" }, 400);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

app.post("/api/auth/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const user = await store.verifyUser(parsed.data.email, parsed.data.password);
  if (!user) return c.json({ error: "Invalid credentials" }, 401);
  const { token, expiresAt } = await store.createSession(user.id);
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  setSessionCookie(c, token, maxAge);
  return c.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.post("/api/auth/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await store.deleteSession(token);
  clearSessionCookie(c);
  return c.json({ ok: true });
});

app.get("/api/auth/get-session", async (c) => {
  const uid = await sessionUserId(c);
  if (!uid) return c.json({ user: null });
  const user = await store.getUser(uid);
  if (!user) {
    clearSessionCookie(c);
    return c.json({ user: null });
  }
  return c.json({ user: { id: user.id, email: user.email, name: user.name } });
});

/** --- Catalog --- */
app.get("/api/categories", async (c) => {
  const rows = await store.listCategories();
  return c.json(rows);
});

const productQuerySchema = z.object({
  q: z.string().max(120).optional(),
  category: z.string().max(64).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(12),
});

app.get("/api/products", async (c) => {
  const parsed = productQuerySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const d = parsed.data;
  const res = await store.listProductsPublic({
    q: d.q,
    categorySlug: d.category,
    minPrice: d.minPrice,
    maxPrice: d.maxPrice,
    sort: d.sort,
    page: d.page,
    pageSize: d.pageSize,
  });
  return c.json(res);
});

app.get("/api/products/featured", async (c) => {
  return c.json(await store.featuredProducts());
});

app.get("/api/products/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await store.getProductBySlug(slug);
  if (!row) return c.notFound();
  return c.json(row);
});

async function cartPayload(cartId: string) {
  const lines = await store.cartLines(cartId);
  const subtotalCents = lines.reduce((s, l) => s + l.product.priceCents * l.quantity, 0);
  const currency = lines[0]?.product.currency ?? "BDT";
  return { lines, subtotalCents, currency };
}

app.get("/api/cart", async (c) => {
  const cartId = await getOrCreateCartId(c);
  return c.json(await cartPayload(cartId));
});

const cartItemBody = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(1).max(99),
});

app.post("/api/cart/items", async (c) => {
  const body = cartItemBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const cartId = await getOrCreateCartId(c);
  const product = await store.getProductById(body.data.productId);
  if (!product) return c.json({ error: "Product not found" }, 404);
  const qty = Math.min(body.data.quantity, product.stock);
  if (qty < 1) return c.json({ error: "Out of stock" }, 400);

  const state = await store.getCart(cartId);
  const cur = state.items[product.id] ?? 0;
  state.items[product.id] = Math.min(cur + qty, product.stock);
  await store.setCart(cartId, state);
  return c.json(await cartPayload(cartId));
});

const patchBody = z.object({ quantity: z.coerce.number().int().min(1).max(99) });

app.patch("/api/cart/items/:productId", async (c) => {
  const productId = c.req.param("productId");
  const body = patchBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const cartId = await getOrCreateCartId(c);
  const product = await store.getProductById(productId);
  if (!product) return c.json({ error: "Product not found" }, 404);
  const qty = Math.min(body.data.quantity, product.stock);
  const state = await store.getCart(cartId);
  state.items[productId] = qty;
  await store.setCart(cartId, state);
  return c.json(await cartPayload(cartId));
});

app.delete("/api/cart/items/:productId", async (c) => {
  const productId = c.req.param("productId");
  const cartId = await getOrCreateCartId(c);
  const state = await store.getCart(cartId);
  delete state.items[productId];
  await store.setCart(cartId, state);
  return c.json(await cartPayload(cartId));
});

const checkoutSchema = z.object({
  paymentMethod: z.enum(["cod", "stripe"]),
  shipping: z.object({
    fullName: z.string().min(2).max(120),
    phone: z.string().min(6).max(32),
    line1: z.string().min(3).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(2).max(80),
    postalCode: z.string().min(2).max(32),
  }),
});

app.post("/api/checkout", async (c) => {
  const userId = await sessionUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const parsed = checkoutSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const cartId = await getOrCreateCartId(c);
  const payload = await cartPayload(cartId);
  if (!payload.lines.length) return c.json({ error: "Cart is empty" }, 400);

  const orderId = crypto.randomUUID();
  const totalCents = payload.subtotalCents;
  const currency = payload.currency;

  const order: OrderRecord = {
    id: orderId,
    userId,
    status: "placed",
    paymentMethod: parsed.data.paymentMethod,
    paymentStatus: parsed.data.paymentMethod === "cod" ? "pending_cod" : "awaiting_payment",
    stripePaymentIntentId: null,
    totalCents,
    currency,
    shippingJson: JSON.stringify(parsed.data.shipping),
    createdAt: Date.now(),
  };

  const lines = payload.lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPriceCents: l.product.priceCents,
    productName: l.product.name,
  }));

  await store.createOrder(order, lines);

  if (parsed.data.paymentMethod === "cod") {
    const state = await store.getCart(cartId);
    state.items = {};
    await store.setCart(cartId, state);
    return c.json({ orderId, status: "placed", paymentMethod: "cod" as const });
  }

  if (!stripe) return c.json({ error: "Stripe is not configured on the server" }, 400);

  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: currency.toLowerCase() === "bdt" ? "bdt" : "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId },
  });

  await store.updateOrder(orderId, { stripePaymentIntentId: pi.id });

  return c.json({
    clientSecret: pi.client_secret!,
    orderId,
    paymentMethod: "stripe" as const,
  });
});

const confirmSchema = z.object({ orderId: z.string().min(8).max(64) });

app.post("/api/checkout/confirm", async (c) => {
  const userId = await sessionUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const parsed = confirmSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  if (!stripe) return c.json({ error: "Stripe not configured" }, 400);

  const got = await store.getOrder(parsed.data.orderId);
  if (!got || got.order.userId !== userId) return c.json({ error: "Order not found" }, 404);
  if (!got.order.stripePaymentIntentId) return c.json({ error: "No payment intent" }, 400);

  const pi = await stripe.paymentIntents.retrieve(got.order.stripePaymentIntentId);
  if (pi.status !== "succeeded") return c.json({ error: `Payment not complete (${pi.status})` }, 400);

  await store.updateOrder(got.order.id, { paymentStatus: "paid", status: "paid" });

  const cartId = await getOrCreateCartId(c);
  const state = await store.getCart(cartId);
  state.items = {};
  await store.setCart(cartId, state);

  return c.json({ ok: true });
});

app.get("/api/orders/me", async (c) => {
  const userId = await sessionUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const rows = await store.listUserOrders(userId);
  return c.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: new Date(r.createdAt).toISOString(),
      status: r.status,
      paymentStatus: r.paymentStatus,
      totalCents: r.totalCents,
      currency: r.currency,
    })),
  );
});

/** --- Admin (X-Admin-Key) --- */
const admin = new Hono();
admin.use("*", async (c, next) => {
  if (!ADMIN_API_KEY) return c.json({ error: "ADMIN_API_KEY is not configured" }, 503);
  const key = c.req.header("X-Admin-Key");
  if (key !== ADMIN_API_KEY) return c.json({ error: "Forbidden" }, 403);
  await next();
});

admin.get("/export", async (c) => {
  return c.json(await store.exportAll());
});

const importBody = z.object({
  merge: z.boolean().optional(),
  categories: z.array(z.object({ id: z.string(), slug: z.string(), name: z.string() })).optional(),
  products: z.array(z.record(z.unknown())).optional(),
});

admin.post("/import", async (c) => {
  const parsed = importBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const res = await store.importPayload({
    merge: parsed.data.merge,
    categories: parsed.data.categories,
    products: parsed.data.products as ImportProduct[] | undefined,
  });
  return c.json(res);
});

admin.get("/products", async (c) => {
  const { products } = await store.exportAll();
  return c.json({ items: products });
});

const adminProductCreate = z.object({
  id: z.string().min(1).max(64).optional(),
  slug: z.string().min(1).max(120),
  categoryId: z.string().min(1).max(64),
  name: z.string().min(1).max(300),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().max(8).optional(),
  imageUrl: z.string().nullable().optional(),
  badges: z.array(z.string()).optional(),
  stock: z.number().int().min(0),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  featuredNew: z.boolean().optional(),
  featuredBest: z.boolean().optional(),
});

admin.post("/products", async (c) => {
  const parsed = adminProductCreate.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const d = parsed.data;
  const id = d.id ?? crypto.randomUUID();
  const now = Date.now();
  const p: StoredProduct = {
    id,
    slug: store.slugify(d.slug),
    categoryId: d.categoryId,
    name: d.name,
    description: d.description ?? null,
    priceCents: d.priceCents,
    compareAtCents: d.compareAtCents ?? null,
    currency: d.currency ?? "BDT",
    imageUrl: d.imageUrl ?? null,
    badges: d.badges ?? [],
    stock: d.stock,
    rating: d.rating ?? 4.5,
    reviewCount: d.reviewCount ?? 0,
    featuredNew: d.featuredNew ?? false,
    featuredBest: d.featuredBest ?? false,
    createdAt: now,
  };
  const existing = await store.getProductById(id);
  if (existing) p.createdAt = existing.createdAt;
  await store.saveProduct(p);
  return c.json({ product: p });
});

admin.patch("/products/:id", async (c) => {
  const id = c.req.param("id");
  const cur = await store.getProductById(id);
  if (!cur) return c.json({ error: "Not found" }, 404);
  const patch = (await c.req.json().catch(() => ({}))) as Partial<StoredProduct>;
  const next: StoredProduct = {
    ...cur,
    ...patch,
    id: cur.id,
    slug: patch.slug != null ? store.slugify(patch.slug) : cur.slug,
    badges: Array.isArray(patch.badges) ? patch.badges : cur.badges,
  };
  await store.saveProduct(next);
  return c.json({ product: next });
});

admin.delete("/products/:id", async (c) => {
  await store.deleteProduct(c.req.param("id"));
  return c.json({ ok: true });
});

const bulkDelete = z.object({ ids: z.array(z.string().min(1)).min(1) });

admin.post("/products/bulk-delete", async (c) => {
  const parsed = bulkDelete.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const n = await store.bulkDeleteProducts(parsed.data.ids);
  return c.json({ deleted: n });
});

admin.get("/categories", async (c) => {
  return c.json({ items: await store.listCategories() });
});

const catBody = z.object({ id: z.string().min(1).max(64).optional(), slug: z.string().min(1), name: z.string().min(1) });

admin.post("/categories", async (c) => {
  const parsed = catBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const id = parsed.data.id ?? crypto.randomUUID();
  const cat = { id, slug: store.slugify(parsed.data.slug), name: parsed.data.name };
  await store.saveCategory(cat);
  return c.json({ category: cat });
});

admin.delete("/categories/:id", async (c) => {
  const r = await store.deleteCategory(c.req.param("id"));
  if (!r.ok) return c.json({ error: r.reason }, 400);
  return c.json({ ok: true });
});

app.route("/api/admin", admin);

app.get("/api/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 8787);

async function main() {
  await getRedis();
  serve({ fetch: app.fetch, port });
  console.log(`API listening on http://127.0.0.1:${port}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
