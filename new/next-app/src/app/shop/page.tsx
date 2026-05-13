import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/redis";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";

export const revalidate = 60;

interface ShopPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ShopPage(props: ShopPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const category = searchParams.category;
  const sort = searchParams.sort || "newest";
  const page = parseInt(searchParams.page || "1");
  const pageSize = 12;
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined;

  // Build cache key
  const cacheKey = `products:${query}:${category}:${sort}:${page}:${minPrice}:${maxPrice}`;
  let products = await cache.get(cacheKey);

  if (!products) {
    // Build query filters
    const where: any = {
      AND: [],
    };

    if (query) {
      where.AND.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    if (category) {
      where.AND.push({
        category: { slug: category },
      });
    }

    if (minPrice !== undefined) {
      where.AND.push({ price: { gte: minPrice } });
    }

    if (maxPrice !== undefined) {
      where.AND.push({ price: { lte: maxPrice } });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    }

    const skip = (page - 1) * pageSize;

    products = await prisma.product.findMany({
      where: where.AND ? where : undefined,
      include: { category: true },
      orderBy,
      skip,
      take: pageSize,
    });

    await cache.set(cacheKey, products, 3600);
  }

  const categories = await prisma.category.findMany();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shop</h1>
        <p className="text-muted-foreground">
          Browse our collection of quality products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <div className="lg:col-span-1">
          <ProductFilters categories={categories} />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No products found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
