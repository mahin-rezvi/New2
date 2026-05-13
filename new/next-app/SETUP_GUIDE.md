# Setup Guide - Dealhaven Pro (Next.js)

## Complete Step-by-Step Setup

### Phase 1: Local Development Setup (10-15 minutes)

#### Step 1: Install Dependencies

```bash
cd /home/mahin/Pictures/new/next-app
npm install
```

#### Step 2: Create Environment Variables

Create `.env.local` with your configurations:

```bash
cp .env.example .env.local
```

**Edit `.env.local` with:**

1. **PostgreSQL Database**
   ```env
   DATABASE_URL="postgresql://dealhaven:password@localhost:5432/dealhaven_pro"
   ```

2. **Clerk Auth**
   - Go to [clerk.com](https://clerk.com)
   - Create app → Get Secret & Publishable keys
   ```env
   CLERK_SECRET_KEY="your_key"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_key"
   ```

3. **Stripe**
   - Go to [stripe.com](https://stripe.com)
   - Get Secret & Publishable keys
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

4. **Upstash Redis**
   - Go to [upstash.com](https://upstash.com)
   - Create Redis instance
   - Copy REST URL and Token
   ```env
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="your_token"
   ```

5. **Other Services**
   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SENTRY_DSN="optional"
   NEXT_PUBLIC_POSTHOG_KEY="optional"
   ```

#### Step 3: Setup PostgreSQL

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Create database
sudo -u postgres psql

# In PostgreSQL:
CREATE DATABASE dealhaven_pro;
CREATE USER dealhaven WITH PASSWORD 'password';
ALTER ROLE dealhaven SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE dealhaven_pro TO dealhaven;
\q
```

#### Step 4: Create Database Schema

```bash
npm run db:push
npm run db:seed
```

This will:
- Create all tables from Prisma schema
- Add 8 sample products
- Create 5 categories
- Add demo user

#### Step 5: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

### Phase 2: Configuration Services (15-20 minutes)

#### Clerk Setup

1. Go to [clerk.com](https://clerk.com)
2. Create account and new application
3. In Settings → API Keys:
   - Copy `CLERK_SECRET_KEY`
   - Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Add to `.env.local`

**Optional: Enable Social Login**
- Settings → Social Connections
- Add Google, GitHub, etc.

#### Stripe Setup

1. Go to [stripe.com](https://stripe.com)
2. Create account
3. In API Keys:
   - Copy Secret Key (starts with `sk_test_`)
   - Copy Publishable Key (starts with `pk_test_`)
4. Add to `.env.local`

**Setup Webhook (for payment updates):**
- Developers → Webhooks
- Click "Add an endpoint"
- URL: `http://localhost:3000/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Click "Reveal signing secret"
- Add `STRIPE_WEBHOOK_SECRET` to `.env.local`

#### Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Sign up
3. Create Database → Copy Endpoint URL and Auth Token
4. Add to `.env.local`

---

### Phase 3: Deployment to Vercel (5-10 minutes)

#### Step 1: Push to GitHub

```bash
cd /home/mahin/Pictures/new/next-app
git init
git add .
git commit -m "Initial Dealhaven Pro commit"
git remote add origin https://github.com/YOUR_USERNAME/dealhaven-pro.git
git push -u origin main
```

#### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your GitHub repository
5. Click "Import"

#### Step 3: Add Environment Variables in Vercel

In Vercel dashboard → Settings → Environment Variables:

```
DATABASE_URL=your_production_database_url
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Click "Visit" to see live site

#### Step 5: Update Stripe Webhook

In Stripe Dashboard → Developers → Webhooks:
- Edit endpoint URL to: `https://your-domain.vercel.app/api/webhooks/stripe`

---

### Phase 4: Production Database (Optional)

For production, use a hosted PostgreSQL:

**Options:**
1. **Vercel Postgres** (Recommended)
   - Integrated with Vercel
   - Free tier available

2. **Heroku Postgres**
   - Reliable option
   - Requires credit card

3. **Railway**
   - Developer-friendly
   - Pay-per-use pricing

**Update DATABASE_URL** in Vercel environment variables with production database.

---

### Verification Checklist

- [ ] Local dev server runs at http://localhost:3000
- [ ] Products load on home page
- [ ] Can search products
- [ ] Can add to cart
- [ ] Cart persists
- [ ] Clerk sign-in works
- [ ] Stripe test payment works
- [ ] Site deployed on Vercel
- [ ] Production database connected
- [ ] Analytics appear in PostHog (optional)
- [ ] Errors logged in Sentry (optional)

---

### Testing

#### Local Testing

```bash
# Visit different sections
http://localhost:3000              # Home
http://localhost:3000/shop         # Shop
http://localhost:3000/cart         # Cart
http://localhost:3000/sign-in      # Sign in
http://localhost:3000/account      # Account (after sign-in)
```

#### Test Payment (Stripe)

Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

#### Database Testing

```bash
# Open Prisma Studio GUI
npm run db:studio

# View all tables and data
# http://localhost:5555
```

---

### Common Issues

#### Database Connection Error
```
Error: Could not find database
```
**Solution:** Verify DATABASE_URL and PostgreSQL is running
```bash
psql $DATABASE_URL
```

#### Clerk Not Loading
```
Clerk loading error
```
**Solution:** Check NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local

#### Stripe Payment Fails
```
No API key found
```
**Solution:** Verify STRIPE_SECRET_KEY is in .env.local

#### Redis Connection Error
```
Cannot connect to Upstash
```
**Solution:** Verify UPSTASH_REDIS_REST_URL and token

---

### Next Steps

1. ✅ Review database schema in `prisma/schema.prisma`
2. ✅ Add your company branding in components
3. ✅ Customize product categories
4. ✅ Set up email notifications
5. ✅ Add more payment methods
6. ✅ Configure analytics dashboards
7. ✅ Set up monitoring alerts
8. ✅ Add SSL certificate (automatic on Vercel)

---

### Support

- **Docs**: See README.md
- **Errors**: Check server logs
- **Database**: Run `npm run db:studio`
- **Deployment**: Check Vercel build logs

---

**🎉 You're ready to sell! Have fun! 🚀**
