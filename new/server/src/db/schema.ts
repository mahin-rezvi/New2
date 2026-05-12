import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  compareAtCents: integer("compare_at_cents"),
  currency: text("currency").notNull().default("BDT"),
  imageUrl: text("image_url"),
  badgesJson: text("badges_json").notNull().default("[]"),
  stock: integer("stock").notNull().default(0),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  featuredNew: integer("featured_new", { mode: "boolean" }).notNull().default(false),
  featuredBest: integer("featured_best", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cartItems = sqliteTable(
  "cart_items",
  {
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.cartId, t.productId] }),
  }),
);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull(),
  shippingJson: text("shipping_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  productName: text("product_name").notNull(),
});
