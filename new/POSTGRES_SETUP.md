# Dealhaven Pro - PostgreSQL Setup Guide

This project now uses **PostgreSQL** as an online database system. Follow these steps to get everything running.

## Prerequisites

- Node.js 18+
- PostgreSQL 12+ installed locally or accessible via connection string
- npm or yarn

## Step 1: Install PostgreSQL

### On Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### On macOS (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

### On Windows:
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create the Database

Connect to PostgreSQL and create the database:

```bash
sudo -u postgres psql
```

Then run these commands in the PostgreSQL prompt:

```sql
CREATE DATABASE dealhaven;
CREATE USER dealhaven WITH PASSWORD 'password';
ALTER ROLE dealhaven SET client_encoding TO 'utf8';
ALTER ROLE dealhaven SET default_transaction_isolation TO 'read committed';
ALTER ROLE dealhaven SET default_transaction_deferrable TO on;
ALTER ROLE dealhaven SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE dealhaven TO dealhaven;
\q
```

## Step 3: Configure Environment Variables

The `.env.local` file in `/server` directory should already be configured:

```env
DATABASE_URL=postgresql://dealhaven:password@localhost:5432/dealhaven
BETTER_AUTH_SECRET=your-secret-key-change-this-in-production-must-be-at-least-32-chars-long!
BETTER_AUTH_URL=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173
PORT=8787
NODE_ENV=development
```

**For production**, use a proper secret and secure database credentials.

## Step 4: Create Database Schema

Run migrations to create all tables:

```bash
cd server
npm run db:push
```

This command creates all necessary tables based on the schema defined in `src/db/schema.ts`.

## Step 5: Seed Database with Products

Seed the database with sample products:

```bash
npm run db:seed
```

This will create 5 categories and 13 sample products in your database.

## Step 6: Start Development Server

From the root directory:

```bash
npm run dev
```

This starts both the client and server:
- **Client:** http://localhost:5173
- **Server/API:** http://localhost:8787

## Database Management

### View Database in psql:

```bash
psql postgresql://dealhaven:password@localhost:5432/dealhaven

# List tables
\dt

# View table structure
\d products

# Run SQL queries
SELECT * FROM categories;
```

### Using GUI Tools:

- **pgAdmin**: Web-based PostgreSQL management https://www.pgadmin.org/
- **DBeaver**: Desktop app https://dbeaver.io/

## Project Structure

```
.
├── client/           # React frontend
│  ├── src/
│  └── .env.local    # Client environment
├── server/          # Node.js backend
│  ├── src/
│  │  ├── index.ts   # Main server file
│  │  ├── auth.ts    # Authentication setup
│  │  ├── db/
│  │  │  ├── index.ts    # Database connection
│  │  │  └── schema.ts   # Database schema
│  │  └── seed.ts    # Database seeding script
│  ├── .env.local    # Server environment
│  └── drizzle.config.ts
└── data/            # SQLite backup (deprecated)
```

## Features

✅ **Authentication**: Better Auth with email/password  
✅ **Database**: PostgreSQL with Drizzle ORM  
✅ **E-commerce**: Product catalog, shopping cart, orders  
✅ **Payment**: Stripe integration (optional)  
✅ **Responsive UI**: React + Tailwind CSS  

## Troubleshooting

### Connection Error: "could not connect to server"
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL is correct
- Verify credentials in database creation step

### "relation does not exist" error
- Run: `npm run db:push` to create tables
- Then: `npm run db:seed` to add sample data

### Better Auth warning about baseURL
- This is fixed now - BETTER_AUTH_URL is set in environment

### Port already in use
- Change PORT in .env.local or kill the process:
  ```bash
  # Kill process on port 8787
  lsof -ti:8787 | xargs kill -9
  ```

## Converting to Different Database

To use a different PostgreSQL host/credentials, update `DATABASE_URL` in `.env.local`:

```env
# AWS RDS Example:
DATABASE_URL=postgresql://username:password@dbname.c9akciq32.us-east-1.rds.amazonaws.com:5432/dealhaven

# Heroku Postgres:
DATABASE_URL=postgres://username:password@host.compute-1.amazonaws.com:5432/dbname

# Supabase:
DATABASE_URL=postgresql://[user]:[password]@[ref].supabase.co:5432/postgres
```

## Next Steps

1. ✅ Install PostgreSQL
2. ✅ Create database and user
3. ✅ Configure environment variables
4. ✅ Run `npm run db:push`
5. ✅ Run `npm run db:seed`
6. ✅ Run `npm run dev`

Enjoy your fully functional e-commerce platform! 🚀
