# Dealhaven Pro - Complete Setup & Troubleshooting Guide

## ✅ What's Been Done

Your project has been fully converted to use **PostgreSQL** (online database system) with proper authentication, environment configuration, and all dependencies installed.

### Changes Made:

1. **Database Migration**: SQLite → PostgreSQL
   - Updated `drizzle.config.ts` to use PostgreSQL dialect
   - Converted schema to use `pgTable` and PostgreSQL-specific types
   - Updated database connection in `db/index.ts` to use `pg` driver

2. **Dependencies Updated**:
   - ✅ Removed: `better-sqlite3`
   - ✅ Added: `pg` (PostgreSQL client)
   - ✅ Added: `@types/pg`
   - All packages installed in `/server`

3. **Authentication Fixed**:
   - Better Auth now uses Drizzle adapter with PostgreSQL
   - `BETTER_AUTH_URL` environment variable configured
   - Fixed "Base URL could not be determined" warning

4. **Environment Files Created**:
   - `/server/.env.local` - Server configuration
   - `/.env.local` - Root configuration  
   - `/client/.env.local` - Client configuration

5. **Documentation**:
   - `POSTGRES_SETUP.md` - Complete PostgreSQL setup guide
   - This file - Troubleshooting and quick reference

## 🚀 Quick Start

### Prerequisites
- PostgreSQL 12+ installed
- Node.js 18+
- npm

### 1-5 Minute Setup:

```bash
# 1. Create database (run in terminal)
sudo -u postgres psql

# In PostgreSQL prompt, paste:
CREATE DATABASE dealhaven;
CREATE USER dealhaven WITH PASSWORD 'password';
ALTER ROLE dealhaven SET client_encoding TO 'utf8';
ALTER ROLE dealhaven SET default_transaction_isolation TO 'read committed';
ALTER ROLE dealhaven SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE dealhaven TO dealhaven;
\q

# 2. Create schema and seed data
cd /home/mahin/Pictures/new/server
npm run db:push
npm run db:seed

# 3. Start development
cd ..
npm run dev
```

The app will be running at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8787

## 🔧 Project Structure

```
new/
├── POSTGRES_SETUP.md          ← Detailed PostgreSQL guide
├── .env.local                 ← Root environment
│
├── client/
│  ├── .env.local             ← Client config (API_URL)
│  ├── src/
│  │  ├── main.tsx
│  │  ├── lib/
│  │  │  ├── api.ts           ← API calls
│  │  │  └── auth-client.ts   ← Auth client
│  │  ├── pages/
│  │  └── components/
│  ├── vite.config.ts
│  └── package.json
│
├── server/
│  ├── .env.local             ← Server config (DATABASE_URL)
│  ├── src/
│  │  ├── index.ts            ← Main server
│  │  ├── auth.ts             ← Auth setup
│  │  ├── seed.ts             ← Database seeding
│  │  └── db/
│  │     ├── index.ts         ← DB connection
│  │     └── schema.ts        ← Database schema
│  ├── drizzle.config.ts
│  ├── tsconfig.json
│  └── package.json
│
└── data/
   └── (sqlite files - deprecated)
```

## 📋 Environment Variables Reference

### Server (.env.local in /server)
```env
# Database
DATABASE_URL=postgresql://dealhaven:password@localhost:5432/dealhaven

# Authentication
BETTER_AUTH_SECRET=your-32-char-minimum-secret-key!
BETTER_AUTH_URL=http://localhost:5173

# Server
PORT=8787
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Client (.env.local in /client)
```env
# API Configuration
VITE_API_URL=http://localhost:8787

# Stripe (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## ⚠️ Common Issues & Solutions

### Issue 1: "could not connect to server: No such file or directory"

**Problem**: PostgreSQL is not running or connection string is wrong.

**Solution**:
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# OR on macOS
brew services start postgresql@15

# Verify connection
psql postgresql://dealhaven:password@localhost:5432/dealhaven
```

### Issue 2: "password authentication failed"

**Problem**: Wrong password or user doesn't exist.

**Solution**:
```bash
# Reset as postgres user
sudo -u postgres psql

# Change password:
ALTER USER dealhaven WITH PASSWORD 'newpassword';

# Update .env.local with new password
```

### Issue 3: "relation 'products' does not exist"

**Problem**: Database schema hasn't been created.

**Solution**:
```bash
cd server
npm run db:push      # Creates all tables
npm run db:seed      # Adds sample data
```

### Issue 4: "[Better Auth]: Base URL could not be determined" warning

**Status**: ✅ FIXED - `BETTER_AUTH_URL` is now set in environment variables

### Issue 5: Port 8787 already in use

**Solution**:
```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9

# OR change PORT in server/.env.local
PORT=8788
```

### Issue 6: "No suitable authentication method found" error

**Problem**: PostgreSQL authentication issue or password in connection string wrong.

**Solution**:
```bash
# Test connection directly
psql -U dealhaven -d dealhaven -h localhost

# Verify user exists and can login
sudo -u postgres psql -c "SELECT * FROM pg_user WHERE usename='dealhaven';"
```

### Issue 7: Client can't reach API

**Problem**: API URL not configured or API not running.

**Solution**:
- Verify `VITE_API_URL=http://localhost:8787` in `/client/.env.local`
- Make sure server is running: `npm run dev` from root
- Check browser console for actual error

### Issue 8: Migrations failing

**Problem**: drizzle-kit can't find database.

**Solution**:
```bash
# Verify config
cat server/drizzle.config.ts

# Check environment variable is loaded
cd server
echo $DATABASE_URL

# Try explicit URL in command
npx drizzle-kit push --config ./server/drizzle.config.ts
```

## 🗄️ Database Management

### Connect to Database

```bash
# Using psql
psql postgresql://dealhaven:password@localhost:5432/dealhaven

# Inside psql - useful commands:
\dt                           # List tables
\d products                   # Describe products table
SELECT * FROM categories;     # View categories
SELECT COUNT(*) FROM products; # Count products
```

### View Data in GUI

Install **pgAdmin** or **DBeaver**:
- pgAdmin: https://www.pgadmin.org/ (web-based)
- DBeaver: https://dbeaver.io/ (desktop)

Connection settings:
- Host: localhost
- Port: 5432
- Database: dealhaven
- User: dealhaven
- Password: password

### Reset Database

```bash
# Delete all data and recreate schema
cd server
npm run db:push   # Recreates all tables (destructive)
npm run db:seed   # Repopulates with sample data
```

## 📦 Available Commands

```bash
# Root directory
npm run dev          # Start both client and server
npm run build        # Build both client and server
npm run db:push      # Migrate database schema
npm run db:seed      # Seed sample data

# Server directory only
cd server
npm run dev          # Start only server (localhost:8787)
npm run db:push      # Create database tables
npm run db:seed      # Add sample products
npm run build        # Build TypeScript

# Client directory only
cd client
npm run dev          # Start only client (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🎯 Features Enabled

✅ **User Authentication**
- Email/password registration and login
- Session management with cookies
- Better Auth framework

✅ **E-Commerce**
- Product catalog with search and filters
- Shopping cart (persistent via cookies)
- Multiple payment methods (COD, Stripe)
- Order management

✅ **Database**
- PostgreSQL for production-ready data
- Drizzle ORM for type-safe queries
- Automatic relationships and constraints

✅ **Frontend**
- React 19 with TypeScript
- Tailwind CSS for styling
- TanStack React Query for data management
- React Router for navigation

## 🔐 Security Notes

For **production deployment**:

1. **Change secrets**:
   - Update `BETTER_AUTH_SECRET` to a long random string
   - Use strong database password

2. **Use environment management**:
   - Never commit `.env.local` to git
   - Use GitHub Secrets, AWS Secrets Manager, or similar

3. **Database**:
   - Use managed PostgreSQL (AWS RDS, Supabase, etc.)
   - Enable SSL connections
   - Regular backups

4. **API**:
   - Configure CORS properly for production domain
   - Use HTTPS
   - Rate limiting

## 📚 Useful Links

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Better Auth**: https://www.better-auth.com/
- **Hono**: https://hono.dev/
- **React Documentation**: https://react.dev/
- **Stripe Testing**: https://stripe.com/docs/testing

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: Look at both client and server terminal output
2. **Verify environment**: Run `echo $DATABASE_URL` to check env vars
3. **Test connection**: Try `psql` directly to PostgreSQL
4. **Clear cache**: `npm clean-install` and restart
5. **Check ports**: Make sure 5173 and 8787 are available

## ✨ Next Steps

1. Test the app at http://localhost:5173
2. Create an account
3. Browse products
4. Add items to cart
5. Proceed to checkout
6. View your orders in Account page

Enjoy your fully functional e-commerce platform! 🚀
