# TrainKit Production Deployment Guide

**Status:** Ready for deployment
**Database:** Already configured and synced with production (Neon PostgreSQL)
**Code:** Dynamic URLs updated and ready for production

---

## Completed Tasks ✅

- [x] Dynamic URLs updated to use `NEXT_PUBLIC_APP_URL` environment variable
- [x] Database schema pushed to production (Neon)
- [x] All hardcoded localhost URLs replaced with environment variables
- [x] Admin role fixed (MANAGER instead of TENANT_ADMIN)
- [x] UK postcode configuration for Stripe Elements
- [x] Local development environment tested and working

---

## Remaining Tasks for Production Launch

### Step 1: Create Stripe Live Mode Products 🔴 PRIORITY

**Why First:** The onboarding flow requires live Stripe products to function in production.

#### Actions:

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com
2. **Switch to LIVE MODE** (toggle in top-right)
3. **Navigate to:** Products → Create Product

#### Create These 3 Products:

**Product 1: TrainKit Starter**
- Name: `TrainKit Starter`
- Description: `Entry-level training management platform`
- Price: `£247.00`
- Billing: `Recurring` → `Monthly`
- After creating, copy the **Price ID** (starts with `price_`)

**Product 2: TrainKit Professional**
- Name: `TrainKit Professional`
- Description: `Advanced training management for growing businesses`
- Price: `£497.00`
- Billing: `Recurring` → `Monthly`
- After creating, copy the **Price ID**

**Product 3: TrainKit Enterprise**
- Name: `TrainKit Enterprise`
- Description: `Full-featured enterprise training platform`
- Price: `£997.00`
- Billing: `Recurring` → `Monthly`
- After creating, copy the **Price ID**

#### Get Live API Keys:

1. Go to: **Developers** → **API Keys**
2. Copy the **Publishable key** (starts with `pk_live_`)
3. Reveal and copy the **Secret key** (starts with `sk_live_`)

⚠️ **IMPORTANT:** Keep these keys secure. Never commit them to git.

#### What You'll Have:

```
LIVE_PUBLISHABLE_KEY = pk_live_...
LIVE_SECRET_KEY = sk_live_...
STARTER_PRICE_ID = price_...
PROFESSIONAL_PRICE_ID = price_...
ENTERPRISE_PRICE_ID = price_...
```

---

### Step 2: Setup Resend Email Service 📧

**Why Needed:** Send welcome emails and password reset emails to new tenants.

#### Actions:

1. **Sign up:** https://resend.com
2. **Add Domain:**
   - Go to: **Domains** → **Add Domain**
   - Enter: `trainkit.co.uk`
   - Resend will provide DNS records

3. **Update DNS Records** (in your domain registrar):

   You'll need to add records similar to:
   ```
   Type: MX
   Name: @
   Value: [Resend provides this]
   Priority: 10

   Type: TXT
   Name: @
   Value: [Resend provides this - for SPF]

   Type: TXT
   Name: resend._domainkey
   Value: [Resend provides this - for DKIM]

   Type: CNAME
   Name: [Resend provides this]
   Value: [Resend provides this]
   ```

4. **Wait for Verification** (can take 24-48 hours)

5. **Create API Key:**
   - Go to: **API Keys** → **Create API Key**
   - Name it: `Production TrainKit`
   - Copy the key (starts with `re_`)

#### What You'll Have:

```
RESEND_API_KEY = re_...
FROM_EMAIL = noreply@trainkit.co.uk
TO_EMAIL = support@trainkit.co.uk
```

---

### Step 3: Generate Security Secrets 🔐

Run these commands to generate secure random secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32

# Generate DEFAULT_ADMIN_PASSWORD
openssl rand -base64 16
```

Copy each output - you'll need them for environment variables.

---

### Step 4: Configure Vercel Environment Variables ⚙️

1. **Go to Vercel Dashboard:** https://vercel.com
2. **Select your project:** trainkit
3. **Go to:** Settings → Environment Variables

#### Add These Environment Variables:

**Database (Already working in production)**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

**Stripe LIVE Keys (from Step 1)**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_KEY_FROM_STEP_1]
STRIPE_SECRET_KEY=sk_live_[YOUR_KEY_FROM_STEP_1]
```

**Stripe Price IDs (from Step 1)**
```bash
STRIPE_STARTER_PRICE_ID=price_[FROM_STEP_1]
STRIPE_PROFESSIONAL_PRICE_ID=price_[FROM_STEP_1]
STRIPE_ENTERPRISE_PRICE_ID=price_[FROM_STEP_1]

NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_[FROM_STEP_1]
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_[FROM_STEP_1]
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_[FROM_STEP_1]
```

**App URLs**
```bash
NEXT_PUBLIC_APP_URL=https://www.trainkit.co.uk
```

**NextAuth (from Step 3)**
```bash
NEXTAUTH_URL=https://www.trainkit.co.uk
NEXTAUTH_SECRET=[YOUR_GENERATED_SECRET_FROM_STEP_3]
```

**Security (from Step 3)**
```bash
JWT_SECRET=[YOUR_GENERATED_SECRET_FROM_STEP_3]
DEFAULT_ADMIN_PASSWORD=[YOUR_GENERATED_PASSWORD_FROM_STEP_3]
```

**Email Service (from Step 2)**
```bash
RESEND_API_KEY=re_[YOUR_KEY_FROM_STEP_2]
FROM_EMAIL=noreply@trainkit.co.uk
TO_EMAIL=support@trainkit.co.uk
```

**Google OAuth (Already configured)**
```bash
GOOGLE_CLIENT_ID=97956968836-jjf65mf039ib86gtpfo1a3jlel9uu8ko.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

⚠️ **For each variable:** Set environment to `Production` (or all environments if you want)

---

### Step 5: Deploy to Vercel 🚀

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to your Vercel project
2. Click **Deployments**
3. Click **Redeploy** on the latest deployment
4. Select **Production** deployment
5. Click **Redeploy**

#### Option C: Using GitHub (Automatic)

1. Commit and push your changes to the main branch
2. Vercel will automatically deploy to production

---

### Step 6: Configure Stripe Webhooks (Optional but Recommended) 🔔

Webhooks allow Stripe to notify your app about payment events.

#### Actions:

1. **Go to Stripe Dashboard** (Live Mode)
2. **Navigate to:** Developers → Webhooks
3. **Click:** Add endpoint
4. **Endpoint URL:** `https://www.trainkit.co.uk/api/webhooks/stripe`
5. **Select Events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
6. **Click:** Add endpoint
7. **Copy the Webhook Signing Secret** (starts with `whsec_`)

#### Add to Vercel Environment Variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]
```

---

### Step 7: Post-Deployment Testing ✅

Once deployed, test the complete onboarding flow:

#### Test Checklist:

1. **Visit:** https://www.trainkit.co.uk/onboarding
2. **Complete Step 1:** Select a plan (use Starter for testing)
3. **Complete Step 2:** Fill in company details
   - Company Name: `Test Company Ltd`
   - Email: Use a real email you can access
   - Phone: `07429 591 055`
   - Address: `123 Test Street`
   - City: `Exeter`
   - Postcode: `EX1 1AB`
4. **Complete Step 3:** Payment
   - Use a REAL payment method (you'll be charged)
   - Or use Stripe test cards if still in test mode
5. **Verify Success Page:** Should redirect to success page with tenant slug
6. **Check Email:** Should receive welcome email with login credentials
7. **Verify Database:** Check that tenant was created in database
8. **Test Admin Login:** Try logging in to admin portal
9. **Check Stripe Dashboard:** Verify subscription created

#### Test Payment Cards (if still testing):

**Success:**
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

**Declined:**
```
Card: 4000 0000 0000 0002
```

---

### Step 8: Monitor and Verify 📊

#### Things to Check:

**Stripe Dashboard (Live Mode):**
- Check for successful subscription creation
- Verify customer was created
- Check payment was processed

**Resend Dashboard:**
- Check email delivery rate
- Verify emails were sent
- Check for bounces or failures

**Vercel Dashboard:**
- Check deployment logs for errors
- Monitor function execution times
- Check for any runtime errors

**Database (Prisma Studio):**
```bash
npx prisma studio --port 5555
```
- Verify tenant was created
- Check admin user was created
- Verify subscription record exists

---

## Environment Variables Reference Card

### Development (.env.local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Production (Vercel)
```bash
NEXT_PUBLIC_APP_URL=https://www.trainkit.co.uk
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## Rollback Plan

If something goes wrong:

1. **Quick Fix:** Revert to previous deployment in Vercel Dashboard
2. **Environment Variables:** Double-check all variables are set correctly
3. **Database:** Database schema is already in sync, no migration needed
4. **Stripe:** Switch back to test mode keys temporarily
5. **Logs:** Check Vercel function logs for specific errors

---

## Support Contacts

**Stripe Support:** https://support.stripe.com
**Resend Support:** https://resend.com/support
**Vercel Support:** https://vercel.com/support
**Neon Support:** https://neon.tech/docs

---

## Quick Start Commands

```bash
# Check database connection
DATABASE_URL="postgresql://..." npx prisma studio

# Test production build locally
npm run build
npm start

# Deploy to Vercel
vercel --prod

# Generate security secrets
openssl rand -base64 32
```

---

## Notes

- All code changes for dynamic URLs have been completed
- Database is production-ready (Neon PostgreSQL)
- Local development environment variables are in `.env.local`
- Shell environment variables are unset via `~/.zshrc` to prevent conflicts
- Test mode is currently working with Stripe test cards
- Production deployment just needs Stripe live keys and environment variables

---

## Timeline Estimate

- **Step 1 (Stripe):** 20-30 minutes
- **Step 2 (Resend):** 15 minutes + 24-48 hours for DNS verification
- **Step 3 (Secrets):** 5 minutes
- **Step 4 (Vercel Config):** 15-20 minutes
- **Step 5 (Deploy):** 5-10 minutes
- **Step 6 (Webhooks):** 10 minutes
- **Step 7 (Testing):** 30 minutes
- **Step 8 (Monitor):** Ongoing

**Total Active Time:** ~2 hours
**Total with DNS Wait:** 24-48 hours

---

**Created:** 2025-12-29
**Status:** Ready for production deployment
**Last Updated:** 2025-12-29
