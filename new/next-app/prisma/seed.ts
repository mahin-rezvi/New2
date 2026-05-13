import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.cartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      slug: "electronics",
      name: "Electronics",
      icon: "📱",
    },
  });

  const fashion = await prisma.category.create({
    data: {
      slug: "fashion",
      name: "Fashion",
      icon: "👗",
    },
  });

  const home = await prisma.category.create({
    data: {
      slug: "home-garden",
      name: "Home & Garden",
      icon: "🏠",
    },
  });

  const sports = await prisma.category.create({
    data: {
      slug: "sports",
      name: "Sports & Outdoors",
      icon: "⚽",
    },
  });

  const books = await prisma.category.create({
    data: {
      slug: "books",
      name: "Books & Media",
      icon: "📚",
    },
  });

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        slug: "airpods-pro",
        name: "Apple AirPods Pro",
        description: "Premium wireless earbuds with active noise cancellation",
        price: 24999, // 249.99 USD in cents
        image: "https://via.placeholder.com/300?text=AirPods+Pro",
        stock: 50,
        featured: true,
        categoryId: electronics.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "iphone-15",
        name: "iPhone 15 Pro",
        description: "Latest Apple smartphone with advanced camera system",
        price: 99999,
        image: "https://via.placeholder.com/300?text=iPhone+15",
        stock: 30,
        featured: true,
        categoryId: electronics.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "gaming-mouse",
        name: "Logitech G Pro Wireless Mouse",
        description: "Professional gaming mouse for esports",
        price: 14999,
        image: "https://via.placeholder.com/300?text=Gaming+Mouse",
        stock: 100,
        featured: false,
        categoryId: electronics.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "cotton-shirt",
        name: "Premium Cotton T-Shirt",
        description: "Comfortable everyday cotton shirt",
        price: 1999,
        image: "https://via.placeholder.com/300?text=Cotton+Shirt",
        stock: 200,
        featured: false,
        categoryId: fashion.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "running-shoes",
        name: "Nike Air Max Running Shoes",
        description: "Lightweight running shoes for athletic performance",
        price: 9999,
        image: "https://via.placeholder.com/300?text=Running+Shoes",
        stock: 75,
        featured: false,
        categoryId: sports.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "desk-lamp",
        name: "LED Desk Lamp",
        description: "Adjustable LED lamp for workspace",
        price: 2999,
        image: "https://via.placeholder.com/300?text=Desk+Lamp",
        stock: 60,
        featured: false,
        categoryId: home.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "yoga-mat",
        name: "Premium Yoga Mat",
        description: "Non-slip yoga mat for exercise",
        price: 3499,
        image: "https://via.placeholder.com/300?text=Yoga+Mat",
        stock: 120,
        featured: false,
        categoryId: sports.id,
      },
    }),
    prisma.product.create({
      data: {
        slug: "javascript-book",
        name: "Eloquent JavaScript",
        description: "A comprehensive guide to programming with JavaScript",
        price: 2299,
        image: "https://via.placeholder.com/300?text=JS+Book",
        stock: 40,
        featured: false,
        categoryId: books.id,
      },
    }),
  ]);

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      image: null,
      addresses: {
        create: {
          name: "Home",
          phone: "01712345678",
          street: "123 Main Street",
          city: "Dhaka",
          state: "Dhaka",
          zipCode: "1205",
          country: "BD",
          isDefault: true,
        },
      },
    },
  });

  // Add some items to wishlist
  await prisma.wishlist.createMany({
    data: [
      { userId: demoUser.id, productId: products[0].id },
      { userId: demoUser.id, productId: products[1].id },
    ],
  });

  // Add items to cart
  await prisma.cartItem.createMany({
    data: [
      { userId: demoUser.id, productId: products[2].id, quantity: 1 },
      { userId: demoUser.id, productId: products[3].id, quantity: 2 },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${products.length} products across 5 categories`);
  console.log(`Created demo user: demo@example.com`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
