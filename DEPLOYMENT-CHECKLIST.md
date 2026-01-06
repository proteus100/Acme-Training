# TrainKit Live Deployment Checklist

## Overview
This document outlines all steps needed to deploy TrainKit to production with the onboarding system fully functional.

---

## 1. Environment Variables Setup

### Required Environment Variables for Production

Create/update your production environment variables (Vercel/Railway/etc.) with:

```bash
# Database (Production PostgreSQL - Already configured: Neon)
DATABASE_URL=postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Stripe (Switch to LIVE keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# Stripe Price IDs (Create these in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID=price_LIVE_STARTER_PRICE_ID
STRIPE_PROFESSIONAL_PRICE_ID=price_LIVE_PROFESSIONAL_PRICE_ID
STRIPE_ENTERPRISE_PRICE_ID=price_LIVE_ENTERPRISE_PRICE_ID

NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_LIVE_STARTER_PRICE_ID
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_LIVE_PROFESSIONAL_PRICE_ID
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_LIVE_ENTERPRISE_PRICE_ID

# NextAuth
NEXTAUTH_URL=https://www.trainkit.co.uk
NEXTAUTH_SECRET=YOUR_SECURE_RANDOM_SECRET_HERE

# Security
JWT_SECRET=YOUR_SECURE_RANDOM_SECRET_HERE
DEFAULT_ADMIN_PASSWORD=YOUR_SECURE_DEFAULT_PASSWORD

# App URLs
NEXT_PUBLIC_APP_URL=https://www.trainkit.co.uk

# Email (Resend API)
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
FROM_EMAIL=noreply@trainkit.co.uk
TO_EMAIL=support@trainkit.co.uk

# Google OAuth (if using)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

---

## 2. Stripe Live Mode Setup

### Create Live Products & Prices

1. **Go to Stripe Dashboard** → Switch to **Live Mode**
2. **Create Products:**

   **Starter Plan:**
   - Name: TrainKit Starter
   - Price: £247/month (or one-time)
   - Billing: Recurring monthly
   - Copy the **Price ID** → Use as `STRIPE_STARTER_PRICE_ID`

   **Professional Plan:**
   - Name: TrainKit Professional
   - Price: £497/month
   - Billing: Recurring monthly
   - Copy the **Price ID** → Use as `STRIPE_PROFESSIONAL_PRICE_ID`

   **Enterprise Plan:**
   - Name: TrainKit Enterprise
   - Price: £997/month
   - Billing: Recurring monthly
   - Copy the **Price ID** → Use as `STRIPE_ENTERPRISE_PRICE_ID`

3. **Get Live API Keys:**
   - Go to Developers → API Keys
   - Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → `STRIPE_SECRET_KEY`

### Configure Stripe Webhooks (Optional but Recommended)

1. Go to Developers → Webhooks
2. Add endpoint: `https://www.trainkit.co.uk/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy **Webhook signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 3. Database Migration

### Run Prisma Migrations on Production

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to production database
DATABASE_URL="postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require" \
npx prisma db push

# Verify tables were created
npx prisma studio --port 5555
```

---

## 4. Email Service Setup (Resend)

### Configure Resend for Production

1. **Sign up at** https://resend.com
2. **Add your domain:**
   - Go to Domains → Add Domain
   - Add `trainkit.co.uk`
   - Update DNS records (MX, TXT, CNAME) as instructed
   - Wait for verification (can take 24-48 hours)

3. **Create API Key:**
   - Go to API Keys → Create API Key
   - Copy key → Use as `RESEND_API_KEY`

4. **Update email templates** in:
   - `src/app/api/onboarding/route.ts` (welcome email)
   - Update FROM_EMAIL to use your domain: `noreply@trainkit.co.uk`

---

## 5. Domain & DNS Configuration

### Update DNS Records

Point your domain to your hosting provider:

**If using Vercel:**
```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

**Email DNS (for Resend):**
- Follow Resend's DNS instructions when adding the domain

---

## 6. Update Dynamic URLs in Code

### ✅ COMPLETED - Files Updated

All dynamic URLs have been updated to use `NEXT_PUBLIC_APP_URL`:

1. **Onboarding API** (`src/app/api/onboarding/route.ts` lines 310-311)
   - Now uses: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin`
   - Now uses: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`

2. **Success Page** (`src/app/onboarding/success/page.tsx` lines 12-14)
   - Now uses: `${baseUrl}/${tenantSlug}/admin`
   - Now uses: `${baseUrl}/${tenantSlug}`

3. **Admin Provision** (`src/app/api/admin/provision-tenant/route.ts` lines 185-187)
   - Now uses: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/admin`

**Local Development:** `NEXT_PUBLIC_APP_URL=http://localhost:3000`
**Production:** `NEXT_PUBLIC_APP_URL=https://www.trainkit.co.uk`

---

## 7. Security Hardening

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate DEFAULT_ADMIN_PASSWORD
openssl rand -base64 16
```

### Update Production Environment
- Never use the same secrets as development
- Store secrets in your hosting platform's environment variables
- Enable environment variable encryption if available

---

## 8. Pre-Deployment Testing

### Local Production Build Test

```bash
# Build the production bundle
npm run build

# Start production server locally
npm start

# Test onboarding flow at http://localhost:3000/onboarding
# Use Stripe TEST mode first (test card: 4242 4242 4242 4242)
```

### Checklist:
- [ ] Onboarding form loads correctly
- [ ] All 3 steps work (Plan selection, Company details, Payment)
- [ ] Stripe payment processes successfully
- [ ] Success page displays with correct URLs
- [ ] Welcome email is sent
- [ ] Tenant is created in database
- [ ] Admin user is created with MANAGER role
- [ ] No console errors in browser

---

## 9. Deploy to Production

### Deployment Steps (Vercel Example)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Or use Vercel Dashboard:
# 1. Connect GitHub repo
# 2. Add environment variables
# 3. Deploy
```

### Post-Deployment Verification

1. Visit `https://www.trainkit.co.uk/onboarding`
2. Complete test onboarding with **Stripe Live Mode**
3. Verify email delivery
4. Check database for new tenant
5. Test admin login

---

## 10. Post-Launch Monitoring

### Things to Monitor

- **Stripe Dashboard:** Check for successful payments
- **Database:** Monitor tenant creation
- **Email Deliverability:** Check Resend dashboard for delivery rates
- **Error Logs:** Monitor Vercel/hosting logs for errors
- **Performance:** Check page load times

### Setup Alerts

- Stripe: Enable email notifications for failed payments
- Resend: Set up bounce/complaint notifications
- Hosting: Configure error monitoring (Sentry, LogRocket, etc.)

---

## 11. Known Issues to Fix Before Launch

### Environment Variable Management

**Issue:** Shell environment variables were overriding `.env` files locally

**Solution Applied:**
- Added unset commands to `~/.zshrc` for local development
- For production, ensure hosting platform manages environment variables

**Files Modified:**
- `~/.zshrc` (lines 23-35) - Unsets placeholder env vars

### Prisma Schema Issue

**Fixed:** Changed admin user role from `TENANT_ADMIN` to `MANAGER` in:
- `src/app/api/onboarding/route.ts` (line 270)

---

## 12. Quick Reference

### Current Working Test Credentials

**Test Stripe Card:**
```
Card: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123
```

**Live Stripe:**
- Use real payment methods
- Ensure customers understand they're being charged

### Price Points
- Starter: £247/month
- Professional: £497/month
- Enterprise: £997/month

### Trial Period
- 14 days free trial
- Calculated from today's date

---

## 13. Launch Checklist

- [ ] All environment variables configured in production
- [ ] Stripe Live Mode products created with correct prices
- [ ] Stripe webhook configured
- [ ] Database migrated to production
- [ ] Resend domain verified and API key configured
- [ ] DNS records updated
- [ ] Dynamic URLs updated in code (admin portal, public site)
- [ ] Security secrets generated and configured
- [ ] Production build tested locally
- [ ] Deployed to hosting platform
- [ ] End-to-end onboarding test completed in production
- [ ] Welcome email received and tested
- [ ] Admin login works
- [ ] Monitoring and alerts configured

---

## Support

If you encounter issues during deployment:

1. Check server logs in your hosting dashboard
2. Verify all environment variables are set correctly
3. Test database connection: `npx prisma studio`
4. Check Stripe dashboard for payment issues
5. Verify email delivery in Resend dashboard

---

## Notes

- The local environment has placeholder environment variables that get unset via `~/.zshrc`
- Production environment should NEVER have these placeholder variables
- Always use environment variables from the hosting platform, not hardcoded values
- Keep `.env.local`, `.env`, and `.env.production` in `.gitignore`
