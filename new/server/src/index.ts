import { serve } from "@hono/node-server";
import { and, asc, count, desc, eq, gte, like, lte, or, sql, type SQL } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import Stripe from "stripe";
import { z } from "zod";
import { auth } from "./auth.js";
import { db } from "./db/index.js";
import { cartItems, carts, categories, orderItems, orders, products } from "./db/schema.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const CART_COOKIE = "dh_cart";
const stripeSecret = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const app = new Hono();

app.use(
  "*",
  cors({
    origin: CLIENT_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

function cartIdFromCookie(c: Context) {
  return getCookie(c, CART_COOKIE);
}

async function getOrCreateCart(c: Context) {
  let id = cartIdFromCookie(c);
  if (id) {
    const row = await db.select().from(carts).where(eq(carts.id, id)).get();
    if (row) return row.id;
  }
  id = crypto.randomUUID();
  await db.insert(carts).values({ id });
  setCookie(c, CART_COOKIE, id, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

app.get("/api/categories", async (c) => {
  const rows = await db.select().from(categories).orderBy(asc(categories.name));
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
  const { q, category, minPrice, maxPrice, sort, page, pageSize } = parsed.data;

  const conds: SQL[] = [];
  if (q && q.trim()) {
    const cleaned = q.trim().replace(/[%_]/g, "");
    if (cleaned.length) {
      const term = `%${cleaned}%`;
      conds.push(
        or(like(products.name, term), like(sql`coalesce(${products.description}, '')`, term))!,
      );
    }
  }
  if (category) {
    const cat = await db.select().from(categories).where(eq(categories.slug, category)).get();
    if (cat) conds.push(eq(products.categoryId, cat.id));
  }
  if (minPrice != null) conds.push(gte(products.priceCents, minPrice));
  if (maxPrice != null) conds.push(lte(products.priceCents, maxPrice));

  const whereClause = conds.length ? and(...conds) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(products)
    .where(whereClause);

  const orderBy =
    sort === "price_asc"
      ? [asc(products.priceCents)]
      : sort === "price_desc"
        ? [desc(products.priceCents)]
        : sort === "popular"
          ? [desc(products.reviewCount), desc(products.rating)]
          : [desc(products.createdAt)];

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      compareAtCents: products.compareAtCents,
      currency: products.currency,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      imageUrl: products.imageUrl,
      badgesJson: products.badgesJson,
      stock: products.stock,
      rating: products.rating,
      reviewCount: products.reviewCount,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json({
    items: rows.map((r) => ({
      ...r,
      badges: JSON.parse(r.badgesJson || "[]") as string[],
    })),
    total,
    page,
    pageSize,
  });
});

app.get("/api/products/featured", async (c) => {
  const newArrivals = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      compareAtCents: products.compareAtCents,
      currency: products.currency,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      imageUrl: products.imageUrl,
      badgesJson: products.badgesJson,
      stock: products.stock,
      rating: products.rating,
      reviewCount: products.reviewCount,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.featuredNew, true))
    .orderBy(desc(products.createdAt))
    .limit(8);

  const bestSellers = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      compareAtCents: products.compareAtCents,
      currency: products.currency,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      imageUrl: products.imageUrl,
      badgesJson: products.badgesJson,
      stock: products.stock,
      rating: products.rating,
      reviewCount: products.reviewCount,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.featuredBest, true))
    .orderBy(desc(products.reviewCount))
    .limit(8);

  const map = (rows: typeof newArrivals) =>
    rows.map((r) => ({
      ...r,
      badges: JSON.parse(r.badgesJson || "[]") as string[],
    }));

  return c.json({ newArrivals: map(newArrivals), bestSellers: map(bestSellers) });
});

app.get("/api/products/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      compareAtCents: products.compareAtCents,
      currency: products.currency,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
      imageUrl: products.imageUrl,
      badgesJson: products.badgesJson,
      stock: products.stock,
      rating: products.rating,
      reviewCount: products.reviewCount,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .get();
  if (!row) return c.notFound();
  return c.json({
    ...row,
    badges: JSON.parse(row.badgesJson || "[]") as string[],
  });
});

async function cartPayload(cartId: string) {
  const lines = await db
    .select({
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      name: products.name,
      slug: products.slug,
      priceCents: products.priceCents,
      currency: products.currency,
      imageUrl: products.imageUrl,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartId));

  const subtotalCents = lines.reduce((s, l) => s + l.priceCents * l.quantity, 0);
  const currency = lines[0]?.currency ?? "BDT";
  return {
    lines: lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      product: {
        id: l.productId,
        name: l.name,
        slug: l.slug,
        priceCents: l.priceCents,
        currency: l.currency,
        imageUrl: l.imageUrl,
        stock: l.stock,
      },
    })),
    subtotalCents,
    currency,
  };
}

app.get("/api/cart", async (c) => {
  const cartId = await getOrCreateCart(c);
  return c.json(await cartPayload(cartId));
});

const cartItemBody = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.coerce.number().int().min(1).max(99),
});

app.post("/api/cart/items", async (c) => {
  const body = cartItemBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const cartId = await getOrCreateCart(c);
  const product = await db.select().from(products).where(eq(products.id, body.data.productId)).get();
  if (!product) return c.json({ error: "Product not found" }, 404);
  const qty = Math.min(body.data.quantity, product.stock);
  if (qty < 1) return c.json({ error: "Out of stock" }, 400);

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, product.id)))
    .get();

  if (existing) {
    const nextQty = Math.min(existing.quantity + qty, product.stock);
    await db
      .update(cartItems)
      .set({ quantity: nextQty })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, product.id)));
  } else {
    await db.insert(cartItems).values({ cartId, productId: product.id, quantity: qty });
  }
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  return c.json(await cartPayload(cartId));
});

const patchBody = z.object({ quantity: z.coerce.number().int().min(1).max(99) });

app.patch("/api/cart/items/:productId", async (c) => {
  const productId = c.req.param("productId");
  const body = patchBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const cartId = await getOrCreateCart(c);
  const product = await db.select().from(products).where(eq(products.id, productId)).get();
  if (!product) return c.json({ error: "Product not found" }, 404);
  const qty = Math.min(body.data.quantity, product.stock);
  await db
    .update(cartItems)
    .set({ quantity: qty })
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  return c.json(await cartPayload(cartId));
});

app.delete("/api/cart/items/:productId", async (c) => {
  const productId = c.req.param("productId");
  const cartId = await getOrCreateCart(c);
  await db.delete(cartItems).where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
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
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const parsed = checkoutSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const cartId = await getOrCreateCart(c);
  const payload = await cartPayload(cartId);
  if (!payload.lines.length) return c.json({ error: "Cart is empty" }, 400);

  const orderId = crypto.randomUUID();
  const totalCents = payload.subtotalCents;
  const currency = payload.currency;

  await db.insert(orders).values({
    id: orderId,
    userId: session.user.id,
    status: "placed",
    paymentMethod: parsed.data.paymentMethod,
    paymentStatus: parsed.data.paymentMethod === "cod" ? "pending_cod" : "awaiting_payment",
    totalCents,
    currency,
    shippingJson: JSON.stringify(parsed.data.shipping),
  });

  for (const line of payload.lines) {
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId: line.productId,
      quantity: line.quantity,
      unitPriceCents: line.product.priceCents,
      productName: line.product.name,
    });
  }

  if (parsed.data.paymentMethod === "cod") {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
    return c.json({ orderId, status: "placed", paymentMethod: "cod" as const });
  }

  if (!stripe) return c.json({ error: "Stripe is not configured on the server" }, 400);

  const pi = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: currency.toLowerCase() === "bdt" ? "bdt" : "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId },
  });

  await db
    .update(orders)
    .set({ stripePaymentIntentId: pi.id })
    .where(eq(orders.id, orderId));

  return c.json({
    clientSecret: pi.client_secret!,
    orderId,
    paymentMethod: "stripe" as const,
  });
});

const confirmSchema = z.object({ orderId: z.string().uuid() });

app.post("/api/checkout/confirm", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
  const parsed = confirmSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  if (!stripe) return c.json({ error: "Stripe not configured" }, 400);

  const order = await db.select().from(orders).where(eq(orders.id, parsed.data.orderId)).get();
  if (!order || order.userId !== session.user.id) return c.json({ error: "Order not found" }, 404);
  if (!order.stripePaymentIntentId) return c.json({ error: "No payment intent" }, 400);

  const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  if (pi.status !== "succeeded") return c.json({ error: `Payment not complete (${pi.status})` }, 400);

  await db
    .update(orders)
    .set({ paymentStatus: "paid", status: "paid" })
    .where(eq(orders.id, order.id));

  const cartId = await getOrCreateCart(c);
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));

  return c.json({ ok: true });
});

app.get("/api/orders/me", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalCents: orders.totalCents,
      currency: orders.currency,
    })
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));
  return c.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

app.get("/api/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`API listening on http://127.0.0.1:${port}`);
