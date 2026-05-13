const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
};

async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    cache = "no-store",
  } = options;

  const url = `${API_BASE_URL}/api${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

export const api = {
  // Products
  getProducts: (filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    return apiCall(`/products?${params.toString()}`);
  },

  getProductBySlug: (slug: string) => apiCall(`/products/${slug}`),

  // Categories
  getCategories: () => apiCall(`/categories`),

  // Cart
  getCart: () => apiCall(`/cart`),

  addToCart: (productId: string, quantity: number) =>
    apiCall(`/cart/items`, {
      method: "POST",
      body: { productId, quantity },
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    apiCall(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: { quantity },
    }),

  removeFromCart: (itemId: string) =>
    apiCall(`/cart/items/${itemId}`, {
      method: "DELETE",
    }),

  clearCart: () =>
    apiCall(`/cart`, {
      method: "DELETE",
    }),

  // Orders
  getOrders: () => apiCall(`/orders`),

  getOrderById: (orderId: string) => apiCall(`/orders/${orderId}`),

  createOrder: (data: any) =>
    apiCall(`/orders`, {
      method: "POST",
      body: data,
    }),

  // Wishlist
  getWishlist: () => apiCall(`/wishlist`),

  addToWishlist: (productId: string) =>
    apiCall(`/wishlist`, {
      method: "POST",
      body: { productId },
    }),

  removeFromWishlist: (productId: string) =>
    apiCall(`/wishlist/${productId}`, {
      method: "DELETE",
    }),

  // Reviews
  createReview: (productId: string, data: any) =>
    apiCall(`/products/${productId}/reviews`, {
      method: "POST",
      body: data,
    }),

  getProductReviews: (productId: string) =>
    apiCall(`/products/${productId}/reviews`),

  // Stripe
  createCheckoutSession: (items: any[]) =>
    apiCall(`/checkout`, {
      method: "POST",
      body: { items },
    }),

  // Admin
  getAdminStats: () => apiCall(`/admin/stats`),

  getAdminOrders: () => apiCall(`/admin/orders`),

  updateOrder: (orderId: string, data: any) =>
    apiCall(`/admin/orders/${orderId}`, {
      method: "PATCH",
      body: data,
    }),
};
