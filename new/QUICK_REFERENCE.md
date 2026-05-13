# Dealhaven Pro - Quick Reference

## 🚀 Start Development (3 steps)

```bash
# 1. Create database (one-time setup)
sudo -u postgres psql << EOF
CREATE DATABASE dealhaven;
CREATE USER dealhaven WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE dealhaven TO dealhaven;
EOF

# 2. Setup schema and data
cd /home/mahin/Pictures/new/server
npm run db:push
npm run db:seed

# 3. Start the app
cd ..
npm run dev
```

Then open: **http://localhost:5173**

## 📋 Common Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run build` | Build for production |
| `npm run db:push` | Create/update database tables |
| `npm run db:seed` | Add sample product data |

## 🔧 Environment Variables

**Server** (`/server/.env.local`):
```
DATABASE_URL=postgresql://dealhaven:password@localhost:5432/dealhaven
BETTER_AUTH_SECRET=your-32-char-secret!
CLIENT_ORIGIN=http://localhost:5173
PORT=8787
```

**Client** (`/client/.env.local`):
```
VITE_API_URL=http://localhost:8787
```

## 📊 Database Quick Reference

```bash
# Connect to database
psql postgresql://dealhaven:password@localhost:5432/dealhaven

# Inside psql:
\dt                  # List all tables
SELECT * FROM categories;  # View data
SELECT COUNT(*) FROM products;  # Count products
\q                   # Exit
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| PostgreSQL won't start | `sudo systemctl start postgresql` |
| "relation doesn't exist" | `npm run db:push && npm run db:seed` |
| Port 8787 in use | `lsof -ti:8787 \| xargs kill -9` |
| API can't reach database | Check `DATABASE_URL` in `.env.local` |
| Auth warning | Already fixed - URLs configured |

## 📱 Test the App

1. Go to http://localhost:5173
2. Click **"Create account"**
3. Sign up with email: test@example.com, password: password123
4. Browse products in Shop
5. Add items to cart
6. Proceed to checkout (select "Cash on Delivery")
7. View order in Account page

## 💡 Project Locations

| What | Where |
|------|-------|
| Frontend code | `/client/src/` |
| Backend code | `/server/src/` |
| Database schema | `/server/src/db/schema.ts` |
| Environment setup | `/.env.local` (root) |
| Server config | `/server/.env.local` |
| Client config | `/client/.env.local` |

## 🔐 Important Files

- `README.md` - Project overview
- `POSTGRES_SETUP.md` - PostgreSQL detailed guide
- `SETUP_GUIDE.md` - Complete setup + troubleshooting
- `.env.local` - Environment variables (don't commit!)

## 🎯 What's Working

✅ PostgreSQL database (online, scalable)  
✅ User authentication (email/password)  
✅ Product catalog (13 sample products)  
✅ Shopping cart (persistent)  
✅ Order management  
✅ Payment processing (COD ready)  
✅ Responsive UI  

## 🚨 Before Deployment

- [ ] Change `BETTER_AUTH_SECRET` to random string
- [ ] Use strong database password
- [ ] Set up real Stripe keys (if using)
- [ ] Configure proper CORS domain
- [ ] Use HTTPS everywhere
- [ ] Set up database backups
- [ ] Add rate limiting to API

## 📞 Support

- Check `SETUP_GUIDE.md` for detailed troubleshooting
- Verify all `.env.local` files exist with correct values
- Make sure PostgreSQL is running: `sudo systemctl status postgresql`
- Check terminal output for specific error messages

## 📚 Useful Links

- React: https://react.dev
- PostgreSQL: https://www.postgresql.org/docs/
- Drizzle ORM: https://orm.drizzle.team/
- Better Auth: https://www.better-auth.com/
- Hono: https://hono.dev/

---

**Ready to go!** 🎉 Run `npm run dev` and start building.
