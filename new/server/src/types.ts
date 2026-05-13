export type Category = {
  id: string;
  slug: string;
  name: string;
};

export type StoredProduct = {
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

export type PublicProduct = StoredProduct & {
  categorySlug: string;
  categoryName: string;
};

export type CartState = {
  updatedAt: number;
  items: Record<string, number>;
};

export type OrderRecord = {
  id: string;
  userId: string;
  status: string;
  paymentMethod: "cod" | "stripe";
  paymentStatus: string;
  stripePaymentIntentId: string | null;
  totalCents: number;
  currency: string;
  shippingJson: string;
  createdAt: number;
};

export type OrderLine = {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  productName: string;
};

export type SessionRecord = {
  userId: string;
  expiresAt: number;
};

/** Loose product shape for JSON import (may reference category by slug). */
export type ImportProduct = Partial<StoredProduct> & {
  categorySlug?: string;
};

export const K = {
  category: (id: string) => `category:${id}`,
  categorySlug: (slug: string) => `category:slug:${slug}`,
  categoriesAll: () => `categories:all`,
  product: (id: string) => `product:${id}`,
  productSlug: (slug: string) => `product:slug:${slug}`,
  productsAll: () => `products:all`,
  cart: (id: string) => `cart:${id}`,
  order: (id: string) => `order:${id}`,
  orderLines: (id: string) => `order:${id}:lines`,
  userOrders: (userId: string) => `user:${userId}:orders`,
  user: (id: string) => `user:${id}`,
  userEmail: (email: string) => `user:email:${email.toLowerCase()}`,
  userPwd: (id: string) => `user:${id}:pwd`,
  session: (token: string) => `session:${token}`,
};
