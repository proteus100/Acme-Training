# Production Setup Guide

## 📋 Overview
This guide will help you configure your TrainKit platform for production deployment.

## 🔑 Required Environment Variables for Production

Add these to your hosting platform (Vercel/Netlify/etc.):

### Core Configuration
```bash
# App URLs - Update with your production domain
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# NextAuth Secret - Generate a new one for production
NEXTAUTH_SECRET=<generate-new-secret>
# Generate with: openssl rand -base64 32

# Security
JWT_SECRET=<your-jwt-secret>
DEFAULT_ADMIN_PASSWORD=<your-admin-password>
```

### Database (Already configured for Neon PostgreSQL)
```bash
DATABASE_URL=postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### Email Configuration (Resend)
```bash
# Get your production API key from https://resend.com/api-keys
RESEND_API_KEY=re_your_production_api_key_here

# Use your verified domain or onboarding@resend.dev for testing
FROM_EMAIL=noreply@trainkit.co.uk
TO_EMAIL=patheyjohns@gmail.com
```

### Stripe Configuration
```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SSwsVKCfEvYlFBlA8CMWeyevMdYGgHDsPkQWW2Ue3wAIQNzgHgwB6JYEsoPUPMRivscVK90cJ6j16ZlmOpRnJYd00FUpn9qrP
STRIPE_SECRET_KEY=sk_test_51SSwsVKCfEvYlFBlWVpsGv5PFbXXTat6u7U7UmbQH5kqNDra5U80h8ORGiTQ6y30ZKhGoNluJjmYYCDlkwqc25qi00ULZCDDFF

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_1SifELKCfEvYlFBlicHE6xW8
STRIPE_PROFESSIONAL_PRICE_ID=price_1SSxDMKCfEvYlFBlhTBtZ60g
STRIPE_ENTERPRISE_PRICE_ID=price_1SSxDyKCfEvYlFBlvWbFTiKN

NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_1SifELKCfEvYlFBlicHE6xW8
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_1SSxDMKCfEvYlFBlhTBtZ60g
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_1SSxDyKCfEvYlFBlvWbFTiKN
```

### Feature Flags
```bash
# Set to 'false' to disable course bookings during testing
# Set to 'true' when ready to accept real bookings
NEXT_PUBLIC_ENABLE_COURSE_BOOKINGS=false
```

## 🚀 Deployment Steps

### 1. Resend Email Setup

#### Option A: Using Test Domain (Quick Start)
1. Use `FROM_EMAIL=onboarding@resend.dev`
2. No DNS configuration needed
3. Perfect for testing

#### Option B: Using Your Own Domain (Production Ready)
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Add `trainkit.co.uk`
4. Add the following DNS records to your domain:

**Domain Verification:**
- Type: `TXT`
- Name: `resend._domainkey`
- Content: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4UyABIxiDpCEC8MAYU0EaPXXUA6pvoNQJE1xUEjjUr8p1yOiUd3fS0ObFI9KYX6mUQe60ETtU/uLhtn/Qv8Muv923X4Q6j4aX5xxnKda9wIx+HacDR0RZ3/gwC2pi+HguZKkz6Uay5lKUVyR31Z0b1eI7Iiaydur50RpUPcqX3QIDAQAB`

**SPF:**
- Type: `MX`
- Name: `send`
- Content: `feedback-smtp.eu-west-1.amazonses.com`
- Priority: `10`

- Type: `TXT`
- Name: `send`
- Content: `v=spf1 include:amazonses.com ~all`

**DMARC (Optional):**
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=none;`

5. Wait for verification (5-30 minutes)
6. Update `FROM_EMAIL=noreply@trainkit.co.uk`

### 2. Disable Course Bookings for Testing

Set this environment variable in production:
```bash
NEXT_PUBLIC_ENABLE_COURSE_BOOKINGS=false
```

This will:
- Hide course listings from public pages
- Disable booking forms
- Prevent Stripe payments
- Keep contact forms working

### 3. Test Contact Forms

Once deployed, test these forms to ensure Resend is working:
- Contact form on homepage
- Tenant contact forms
- Tenant welcome emails (when creating new tenants)

### 4. When Ready to Enable Course Bookings

Change the environment variable to:
```bash
NEXT_PUBLIC_ENABLE_COURSE_BOOKINGS=true
```

Then redeploy your application.

## 🔒 Security Checklist

- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Generate new `JWT_SECRET` for production
- [ ] Change `DEFAULT_ADMIN_PASSWORD`
- [ ] Use production Stripe keys (not test keys)
- [ ] Never commit `.env.local` to git
- [ ] Verify Resend domain before going live
- [ ] Test all forms with `NEXT_PUBLIC_ENABLE_COURSE_BOOKINGS=false` first

## 📝 Notes

- Database is already configured with Neon PostgreSQL
- Resend free plan includes 3,000 emails/month
- Test mode Stripe keys are safe for testing (they won't charge real cards)
- Contact forms will work even with course bookings disabled

## 🆘 Troubleshooting

### Emails Not Sending
1. Check Resend API key is correct
2. Verify FROM_EMAIL domain is verified (or use onboarding@resend.dev)
3. Check server logs for Resend errors

### Course Bookings Still Showing
1. Verify `NEXT_PUBLIC_ENABLE_COURSE_BOOKINGS=false` is set
2. Redeploy the application
3. Clear browser cache

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check Neon database is active
3. Ensure connection pooling URL is used

##Current API Key
Your Resend API key: `re_M4EM29yH_ABmzX9nTQe76mqY9gbcsXSrQ`
