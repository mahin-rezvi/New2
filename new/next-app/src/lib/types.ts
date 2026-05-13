import { z } from "zod";

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
};

// Product types
export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  image: z.string().nullable(),
  stock: z.number(),
  featured: z.boolean(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  createdAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

// Category types
export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
});

export type Category = z.infer<typeof CategorySchema>;

// Cart types
export const CartItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  product: ProductSchema,
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Order types
export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  total: z.number(),
  shippingCost: z.number(),
  createdAt: z.date(),
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      price: z.number(),
      product: z.object({
        id: z.string(),
        name: z.string(),
        image: z.string().nullable(),
      }),
    })
  ),
  payment: z
    .object({
      id: z.string(),
      status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
      method: z.enum(["CARD", "COD", "BANK_TRANSFER"]),
    })
    .nullable(),
});

export type Order = z.infer<typeof OrderSchema>;

// User types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

// Filter types
export const ProductFilterSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).optional().default("newest"),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(48).optional().default(12),
});

export type ProductFilter = z.infer<typeof ProductFilterSchema>;
