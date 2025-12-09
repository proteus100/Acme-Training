# TrainKit Railway Deployment Reference

## Project Structure
```
Acme-training.co.uk/
├── acme-training-website/     # <-- Main Next.js app is HERE
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   └── .env.example
├── railway.toml               # Railway config (points to subdirectory)
└── RAILWAY_DEPLOYMENT_REFERENCE.md (this file)
```

**IMPORTANT**: The actual Next.js app is inside `acme-training-website/` subdirectory, not at root.

## GitHub Repository
- **URL**: https://github.com/proteus100/trainkit
- **Branch**: master

## Railway Deployment Steps

### 1. Create New Railway Project
1. Go to https://railway.app/
2. Login with GitHub (proteus100)
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose: **proteus100/trainkit**

### 2. Configure Root Directory
Railway needs to know the app is in a subdirectory:

**Option A: Using railway.toml** (Already added to repo)
- The `railway.toml` file at root tells Railway to build from `acme-training-website/`

**Option B: Manual Settings**
1. Click on the trainkit service
2. Go to "Settings" tab
3. Find "Root Directory" setting
4. Set to: `acme-training-website`
5. Save

### 3. Add PostgreSQL Database
1. In Railway project dashboard, click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway auto-provisions it

### 4. Configure Environment Variables
Go to trainkit service → Variables tab, add these:

#### Required Variables:

```bash
# Database (Railway provides this automatically when you add PostgreSQL)
DATABASE_URL=postgresql://...  # Auto-set by Railway

# NextAuth
NEXTAUTH_SECRET=fgdOZu1Hqvm5ssJKnwyXcacEkWXIE98kPd4NERr9m14=
NEXTAUTH_URL=https://YOUR-APP.railway.app  # Update with actual Railway URL

# App URLs
NEXT_PUBLIC_APP_URL=https://YOUR-APP.railway.app  # Update with actual Railway URL

# Stripe (Required for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get after setting up webhook

# Email Service
RESEND_API_KEY=re_...  # Get from https://resend.com/api-keys
# OR use SMTP:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Optional Variables:
```bash
NODE_ENV=production
```

### 5. Get Railway App URL
After deployment:
1. Click on your trainkit service
2. Go to "Settings" tab
3. Find "Domains" section
4. Copy the Railway-provided URL (e.g., `trainkit-production-xxxx.railway.app`)
5. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` with this URL

### 6. Run Database Migrations
After first deployment, you need to initialize the database:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
railway run npx prisma db seed  # Optional: seed initial data
```

**Option B: Using Railway Shell**
1. In Railway dashboard, click on trainkit service
2. Click "Shell" or "Console" tab
3. Run:
```bash
cd acme-training-website
npx prisma migrate deploy
npx prisma db seed  # Optional
```

### 7. Set Up Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter: `https://YOUR-APP.railway.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add it to Railway as `STRIPE_WEBHOOK_SECRET`

## Tech Stack
- **Framework**: Next.js 15.5.3
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **Email**: Resend or SMTP
- **Styling**: Tailwind CSS

## Features
- Multi-tenant SaaS platform
- Training course booking system
- Stripe payment integration (full payment & deposits)
- Admin portal (dashboard, bookings, courses, students)
- Student portal with progress tracking
- Email automation
- Session and certification management

## Local Development
```bash
cd acme-training-website
npm install
cp .env.example .env.local
# Edit .env.local with your local values
npx prisma migrate dev
npm run dev
```

## Troubleshooting

### Build fails with "Script start.sh not found"
- **Cause**: Railway can't find the Next.js app
- **Fix**: Ensure `railway.toml` exists at root OR set Root Directory to `acme-training-website`

### Database connection errors
- **Cause**: DATABASE_URL not set or Prisma can't connect
- **Fix**:
  1. Ensure PostgreSQL database is added to Railway project
  2. Check DATABASE_URL is set in Variables
  3. Run migrations: `railway run npx prisma migrate deploy`

### Environment variables not loading
- **Cause**: Variables not set in Railway
- **Fix**: Go to service → Variables → Add all required variables

### Stripe webhook failing
- **Cause**: Webhook secret mismatch or endpoint URL wrong
- **Fix**:
  1. Verify webhook URL: `https://your-app.railway.app/api/webhooks/stripe`
  2. Update `STRIPE_WEBHOOK_SECRET` in Railway with correct secret

### "Invalid NEXTAUTH_URL"
- **Cause**: NEXTAUTH_URL not set or wrong
- **Fix**: Set to your Railway app URL (e.g., `https://trainkit-production-xxxx.railway.app`)

## Important Notes
1. **Never commit .env files** - They're in .gitignore
2. **Use test Stripe keys** for development
3. **Database is persistent** - Railway PostgreSQL data persists across deployments
4. **Logs**: View in Railway dashboard → Service → Logs tab
5. **Costs**: Monitor usage in Railway dashboard → Usage tab

## Support & Resources
- Railway Docs: https://docs.railway.app/
- TrainKit Docs: See other .md files in this repo
- Stripe Docs: https://stripe.com/docs
- Prisma Docs: https://www.prisma.io/docs

## Generated Keys
- **NEXTAUTH_SECRET** (for this deployment): `fgdOZu1Hqvm5ssJKnwyXcacEkWXIE98kPd4NERr9m14=`
- Generate new: `openssl rand -base64 32`

---
Last updated: 2025-12-09
Deployed from: https://github.com/proteus100/trainkit
