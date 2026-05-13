import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 12;
  const minPrice = searchParams.get("minPrice")
    ? parseInt(searchParams.get("minPrice")!)
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice")!)
    : undefined;

  // Build cache key
  const cacheKey = `api:products:${query}:${category}:${sort}:${page}:${minPrice}:${maxPrice}`;

  // Try to get from cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // Build where clause
    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice !== undefined) {
      where.price = { gte: minPrice };
    }

    if (maxPrice !== undefined) {
      where.price = where.price || {};
      where.price.lte = maxPrice;
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    }

    const skip = (page - 1) * pageSize;

    // Get products and total count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: { category: true },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.product.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    const response = {
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };

    // Cache for 1 hour
    await cache.set(cacheKey, response, 3600);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
