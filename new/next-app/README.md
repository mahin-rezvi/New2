# 🚀 Dealhaven Pro - Next.js Redesign

A modern, production-ready e-commerce platform built with cutting-edge technologies.

## 📋 Tech Stack

### Core
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library

### Backend & Data
- **Prisma** - Type-safe ORM for PostgreSQL
- **PostgreSQL** - Relational database
- **Upstash Redis** - Serverless caching & rate limiting

### Authentication & Payments
- **Clerk** - Modern authentication
- **Stripe** - Payment processing

### Monitoring & Analytics
- **Sentry** - Error tracking and monitoring
- **PostHog** - Product analytics

### Deployment
- **Vercel** - Serverless hosting platform

## 🎯 Key Features

- ✅ Modern product catalog with advanced filtering
- ✅ Secure user authentication with Clerk
- ✅ Shopping cart and wishlist management
- ✅ Stripe payment integration (Card & Cash on Delivery)
- ✅ Order tracking and history
- ✅ Admin dashboard functionality
- ✅ Redis caching for performance
- ✅ Sentry error tracking
- ✅ PostHog analytics integration
- ✅ Mobile-responsive design
- ✅ Dark mode support
- ✅ SEO optimized

## 📁 Project Structure

```
next-app/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Authentication pages
│   │   ├── api/                    # API routes
│   │   ├── shop/                   # Shop pages
│   │   ├── cart/                   # Cart page
│   │   ├── checkout/               # Checkout page
│   │   ├── account/                # User account
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── globals.css             # Global styles
│   │   └── providers.tsx           # App providers
│   ├── components/
│   │   ├── layout/                 # Layout components
│   │   ├── product-card.tsx
│   │   ├── product-filters.tsx
│   │   ├── search-products.tsx
│   │   └── featured-section.tsx
│   └── lib/
│       ├── api.ts                  # API client
│       ├── prisma.ts               # Prisma client
│       ├── redis.ts                # Redis utilities
│       ├── stripe.ts               # Stripe utilities
│       ├── sentry.ts               # Sentry integration
│       ├── posthog.ts              # PostHog integration
│       └── types.ts                # Shared types
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Seeding script
├── public/                         # Static files
└── package.json
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### 2. Installation

```bash
cd next-app
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dealhaven_pro"

# Clerk Authentication
CLERK_SECRET_KEY="your_clerk_secret_key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"

# Stripe
STRIPE_SECRET_KEY="your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Upstash Redis
UPSTASH_REDIS_REST_URL="your_upstash_redis_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token"

# Sentry
SENTRY_AUTH_TOKEN="your_sentry_auth_token"
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"

# PostHog
NEXT_PUBLIC_POSTHOG_KEY="your_posthog_key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Create database and tables
npm run db:push

# Seed sample data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Available Commands

```bash
# Development
npm run dev          # Start dev server

# Build & Production
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Create/update database schema
npm run db:migrate   # Create new migration
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (GUI)
```

## 🔐 Authentication

The app uses **Clerk** for authentication:

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your API keys
4. Add to `.env.local`

## 💳 Payment Processing

Stripe integration for payments:

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Set up webhook at `/api/webhooks/stripe`
4. Add keys to `.env.local`

## 🗄️ Database Schema

### Core Models
- **User** - User accounts with Clerk integration
- **Product** - Product catalog with categories
- **Category** - Product categories
- **Order** - Order management
- **OrderItem** - Individual items in orders
- **Payment** - Payment records
- **CartItem** - Shopping cart items
- **Wishlist** - User wishlists
- **Review** - Product reviews
- **Address** - Shipping addresses
- **Shipment** - Shipment tracking
- **AuditLog** - Admin activity logs

## 📊 Monitoring & Analytics

### Sentry (Error Tracking)
- Automatically captures errors
- Performance monitoring
- Session replays

### PostHog (Analytics)
- User behavior tracking
- Feature analytics
- Funnels and cohorts

### Redis Caching
- Product caching (1 hour TTL)
- Session management
- Rate limiting

## 🌐 Deployment on Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables
5. Deploy

### 3. Set Webhook URLs

Update in Stripe dashboard:
- Endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`

## 📖 API Routes

### Public Routes
- `GET /api/products` - List products
- `GET /api/products/[slug]` - Get product details
- `GET /api/categories` - List categories

### Protected Routes (Requires Auth)
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `PATCH /api/cart/items/[id]` - Update cart item
- `DELETE /api/cart/items/[id]` - Remove from cart
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order

### Webhooks
- `POST /api/webhooks/stripe` - Stripe events

## 🎨 Styling

The project uses Tailwind CSS with a custom color scheme:

```css
/* Color variables in globals.css */
--primary: Blue (#2563EB)
--secondary: Dark Gray (#1F2937)
--accent: Bright colors for highlights
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Clerk Not Loading
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
- Check Clerk dashboard for API keys
- Clear browser cache and cookies

### Stripe Errors
- Verify webhook secret is correct
- Check Stripe dashboard for failed events
- Use Stripe CLI for local testing

## 📞 Support

For issues and questions:
- Check the [docs](./docs)
- Review [GitHub Issues](https://github.com/dealhaven/dealhaven-pro)
- Contact support@dealhaven.com

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with Next.js, Prisma, Clerk, Stripe, and Vercel.

---

**Happy coding! 🚀**
