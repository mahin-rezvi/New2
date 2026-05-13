# Dealhaven Pro - E-Commerce Platform

A modern, full-stack e-commerce platform built with **React**, **TypeScript**, **Hono**, and **PostgreSQL**.

## 🎯 Overview

Dealhaven Pro is an online shopping platform inspired by Bangladesh's deal marketplace ecosystem. It features:

- 🛍️ Product catalog with advanced search and filtering
- 🔐 Secure user authentication
- 🛒 Shopping cart and order management  
- 💳 Payment processing (Cash on Delivery & Stripe)
- 📱 Fully responsive design
- 🚀 Production-ready architecture

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **TanStack React Query** - Data fetching
- **Better Auth (Client)** - Authentication UI

### Backend
- **Hono** - Lightweight web framework
- **Node.js** - Runtime
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication & authorization
- **Stripe** - Payment processing

## 📋 Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 12 or higher
- **npm** or yarn package manager

## ⚡ Quick Start

### 1. Setup PostgreSQL Database

```bash
# On Linux/Ubuntu:
sudo -u postgres psql

# Run these SQL commands:
CREATE DATABASE dealhaven;
CREATE USER dealhaven WITH PASSWORD 'password';
ALTER ROLE dealhaven SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE dealhaven TO dealhaven;
\q
```

[Detailed PostgreSQL setup →](./POSTGRES_SETUP.md)

### 2. Install Dependencies

```bash
cd /home/mahin/Pictures/new
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Create Database Schema

```bash
cd server
npm run db:push    # Creates tables
npm run db:seed    # Adds sample data
```

### 4. Start Development

```bash
cd ..
npm run dev
```

Visit:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8787

## 📁 Project Structure

```
new/
├── client/                 # React frontend
│  ├── src/
│  │  ├── pages/           # Page components
│  │  ├── components/      # Reusable components
│  │  ├── lib/             # Utilities and API calls
│  │  └── index.css        # Global styles
│  ├── vite.config.ts
│  └── .env.local
│
├── server/                 # Express backend
│  ├── src/
│  │  ├── index.ts         # Main server
│  │  ├── auth.ts          # Auth configuration
│  │  ├── seed.ts          # Database seeding
│  │  └── db/
│  │     ├── index.ts      # Database connection
│  │     └── schema.ts     # Database schema
│  ├── drizzle.config.ts
│  └── .env.local
│
├── SETUP_GUIDE.md         # Complete setup guide
└── POSTGRES_SETUP.md      # PostgreSQL specific guide
```

## 🔧 Configuration

### Server Environment (`.env.local` in `/server`)

```env
DATABASE_URL=postgresql://dealhaven:password@localhost:5432/dealhaven
BETTER_AUTH_SECRET=your-32-character-minimum-secret-key!
BETTER_AUTH_URL=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173
PORT=8787
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_...      # Optional
```

### Client Environment (`.env.local` in `/client`)

```env
VITE_API_URL=http://localhost:8787
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Optional
```

## 📚 Available Commands

```bash
# Development
npm run dev          # Start client + server
npm run build        # Build for production

# Database
npm run db:push      # Create/update schema
npm run db:seed      # Seed sample data

# Client only
cd client
npm run dev          # Start Vite dev server
npm run build        # Build production bundle

# Server only  
cd server
npm run dev          # Start with tsx watch
npm run db:push      # Create tables
npm run db:seed      # Add sample products
```

## 🛣️ API Routes

### Products
- `GET /api/products` - Search products with filters
- `GET /api/products/:slug` - Get single product
- `GET /api/products/featured` - Get featured products
- `GET /api/categories` - Get all categories

### Cart
- `GET /api/cart` - Get cart contents
- `POST /api/cart/items` - Add item to cart
- `PATCH /api/cart/items/:productId` - Update quantity
- `DELETE /api/cart/items/:productId` - Remove item

### Checkout
- `POST /api/checkout` - Create order (requires auth)
- `POST /api/checkout/confirm` - Confirm Stripe payment

### Orders
- `GET /api/orders/me` - Get user's orders (requires auth)

### Auth
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login user
- `POST /api/auth/sign-out` - Logout user

## 🔐 Authentication

The app uses **Better Auth** for secure authentication:

- Email/password based sign-up and login
- Secure session management with cookies
- Protected routes for authenticated users
- Automatic session persistence

## 💳 Payment Methods

1. **Cash on Delivery (COD)**
   - No configuration needed
   - Orders marked as pending

2. **Stripe** (Optional)
   - Set `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`
   - Use test cards: `4242 4242 4242 4242`
   - Automatic payment intent creation

## 🗄️ Database Schema

### Tables
- **categories** - Product categories
- **products** - Product catalog
- **carts** - Shopping carts
- **cart_items** - Items in carts
- **orders** - Customer orders
- **order_items** - Items in orders
- **users** - Auth users (managed by Better Auth)
- **sessions** - Auth sessions (managed by Better Auth)

## 🐛 Troubleshooting

### "could not connect to server"
```bash
sudo systemctl start postgresql
```

### "relation does not exist"
```bash
npm run db:push
npm run db:seed
```

### Port already in use
```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9
```

### Clear all data and restart
```bash
cd server
npm run db:push  # Recreates schema (destructive)
npm run db:seed  # Repopulates data
```

[→ Full Troubleshooting Guide](./SETUP_GUIDE.md)

## 📖 Documentation

- [**SETUP_GUIDE.md**](./SETUP_GUIDE.md) - Complete setup and troubleshooting
- [**POSTGRES_SETUP.md**](./POSTGRES_SETUP.md) - PostgreSQL configuration

## 🚀 Deployment

For production, consider deploying to:

### Frontend
- **Vercel** - Recommended for Vite/React apps
- **Netlify** - Alternative
- **AWS S3 + CloudFront**

### Backend  
- **Heroku** - Simple deployment
- **AWS EC2 / Lambda**
- **Railway.app**
- **Render**

### Database
- **AWS RDS PostgreSQL**
- **Supabase** - PostgreSQL + Auth
- **Vercel Postgres**
- **Neon** - Serverless Postgres

## 📝 Sample Data

After running `npm run db:seed`, the database includes:

- **5 Categories**: Accessories, Gadgets, Gift Items, Medicine, Punjabi
- **13 Products**: Chargers, fans, wellness items, apparel, etc.
- **Realistic pricing**: From ৳390 to ৳3,490
- **Product metadata**: Images, ratings, stock levels, badges

## 🤝 Contributing

To add features or fix issues:

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

## 🙋 Support

For issues or questions:

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Verify environment variables are set correctly
3. Ensure PostgreSQL is running
4. Check server and client terminal output for errors

## 🎉 Getting Started

```bash
# Clone or navigate to project
cd /home/mahin/Pictures/new

# Setup database (follow POSTGRES_SETUP.md)
# ...

# Install and start
npm install
npm run dev

# Visit http://localhost:5173
```

Happy shopping! 🛍️
