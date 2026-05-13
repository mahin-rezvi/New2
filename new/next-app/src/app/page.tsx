import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/redis";
import { ProductCard } from "@/components/product-card";
import { SearchProducts } from "@/components/search-products";
import { FeaturedSection } from "@/components/featured-section";

export const revalidate = 60; // Revalidate every 60 seconds

async function getFeaturedProducts() {
  const cacheKey = "featured-products";
  const cached = await cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const products = await prisma.product.findMany({
    where: { featured: true },
    take: 8,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  await cache.set(cacheKey, products, 3600);
  return products;
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to Dealhaven Pro</h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover amazing deals on quality products
          </p>
          <SearchProducts />
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Featured Section Component */}
      <FeaturedSection />

      {/* CTA Section */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Shop?</h2>
          <p className="text-gray-600 mb-8">
            Browse our full collection of products and find exactly what you need
          </p>
          <a
            href="/shop"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Shop Now
          </a>
        </div>
      </section>
    </div>
  );
}
