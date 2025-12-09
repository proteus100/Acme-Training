# TrainKit Self-Service Onboarding System - Complete

## 🎉 What's Been Implemented

Your TrainKit platform now has a **complete self-service onboarding system** where training centers can sign up and pay for subscriptions automatically!

### Features Implemented

✅ **Public Onboarding Page** (`/onboarding`)
- Beautiful 3-step wizard interface
- Plan selection (Starter £247, Professional £447, Enterprise £897)
- Company details collection
- Admin user setup
- Stripe payment collection with 14-day free trial

✅ **Automated Tenant Creation**
- Auto-generates unique slug from company name
- Creates tenant record with trial status
- Sets up tenant settings
- Creates sample course
- Configures plan limits

✅ **Stripe Subscription Integration**
- Creates Stripe customer
- Attaches payment method
- Creates subscription with 14-day trial
- Stores subscription details in database
- No charge during trial period

✅ **Admin Account Auto-Creation**
- Creates tenant admin account
- Generates secure temporary password
- Sends comprehensive welcome email with:
  - Login URL (https://{slug}.trainkit.co.uk/admin/login)
  - Username and password
  - Plan details and limits
  - Quick start guide
  - Feature overview

✅ **Webhook Handling**
- Subscription lifecycle events
- Trial ending notifications
- Payment success/failure handling
- Auto-activation/deactivation
- Invoice management

## 📋 What You Need to Do

### Step 1: Get Stripe API Keys

1. Visit [Stripe Dashboard](https://dashboard.stripe.com)
2. For testing, switch to **Test mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### Step 2: Create Subscription Products

**IMPORTANT**: Run this script to create the 3 subscription products in Stripe:

```bash
npx tsx scripts/setup-stripe-products.ts
```

This will create:
- Starter Plan: £247/month
- Professional Plan: £447/month
- Enterprise Plan: £897/month

The script will output Price IDs that you'll need in the next step.

### Step 3: Configure Environment Variables

Create/update `.env.local` for local development:

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"

# Price IDs (from Step 2 output)
STRIPE_STARTER_PRICE_ID="price_xxxxx"
STRIPE_PROFESSIONAL_PRICE_ID="price_xxxxx"
STRIPE_ENTERPRISE_PRICE_ID="price_xxxxx"

# Frontend Price IDs
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="price_xxxxx"
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID="price_xxxxx"
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="price_xxxxx"
```

Update `.env.production` on your server with the same values.

### Step 4: Set Up Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. URL: `https://trainkit.co.uk/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.*` (all)
   - `invoice.*` (all)
   - `payment_intent.*` (all)
5. Copy **Signing secret** (`whsec_...`)
6. Add to `.env.production`:
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_YOUR_SECRET"
   ```

### Step 5: Test the System

**Test with Stripe test card:**
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`
- ZIP: Any 5 digits

**Test flow:**
1. Visit `http://localhost:3000/onboarding`
2. Select a plan
3. Fill in company details
4. Use test card
5. Complete signup
6. Check:
   - Welcome email received
   - Can login at `https://{slug}.trainkit.co.uk/admin/login`
   - Subscription appears in Stripe dashboard
   - Tenant appears in super admin panel

### Step 6: Deploy to Production

Once testing is complete:

```bash
# Deploy updated files
sshpass -p "vmdY8SHK" scp src/app/api/onboarding/route.ts root@217.154.35.147:/var/www/trainkit/src/app/api/onboarding/route.ts
sshpass -p "vmdY8SHK" scp scripts/setup-stripe-products.ts root@217.154.35.147:/var/www/trainkit/scripts/setup-stripe-products.ts

# Rebuild and restart
sshpass -p "vmdY8SHK" ssh root@217.154.35.147 "cd /var/www/trainkit && npm run build && pm2 restart trainkit"
```

### Step 7: Switch to Live Mode

When ready for production:

1. Switch Stripe to **Live mode**
2. Get live API keys
3. Run setup script with live keys to create live products
4. Update production environment variables
5. Create live webhook endpoint
6. Test with a real card

## 🎯 How It Works

### Customer Journey

1. **Discovery**: Customer visits `trainkit.co.uk/onboarding`
2. **Plan Selection**: Chooses Starter, Professional, or Enterprise
3. **Details**: Enters company and admin details
4. **Payment**: Adds card (no charge for 14-day trial)
5. **Confirmation**: Receives welcome email with credentials
6. **Login**: Accesses their training center admin panel
7. **Setup**: Starts adding courses and students
8. **Billing**: Auto-charged after 14 days if not cancelled

### Subscription Lifecycle

```
Trial Start (Day 0)
    ↓
14-Day Free Trial
    ↓
Trial Will End Notification (Day 11)
    ↓
First Payment (Day 14)
    ↓
Active Subscription (Monthly billing)
    ↓
Payment Success → Continue access
Payment Failed → Mark as Past Due
Cancelled → Deactivate at period end
```

### Email Flow

1. **Onboarding Complete**: Welcome email with credentials
2. **Trial Ending** (Day 11): Reminder about upcoming charge
3. **Payment Success**: Receipt and confirmation
4. **Payment Failed**: Retry notification
5. **Subscription Cancelled**: Confirmation email

## 📊 Admin Features

As super admin, you can:

- **View all tenants** at `/admin/tenants`
- **Manual tenant creation** (no payment required)
- **Send welcome emails** to existing tenants
- **Monitor subscriptions** and billing status
- **Deactivate/activate** tenants manually

## 🔐 Security Features

- Secure password generation (16-character random)
- Password hashing with bcrypt
- Stripe webhook signature verification
- SQL injection protection via Prisma
- Rate limiting on API endpoints
- Tenant data isolation

## 📝 Files Created/Modified

### New Files
- `scripts/setup-stripe-products.ts` - Stripe product setup script
- `STRIPE-SETUP.md` - Detailed Stripe setup guide
- `ONBOARDING-SYSTEM-SUMMARY.md` - This file

### Modified Files
- `src/app/api/onboarding/route.ts` - Updated to use welcome email template
- `src/lib/email.ts` - Now uses Fasthosts SMTP (updated earlier)

### Existing Files (Already Complete)
- `src/app/onboarding/page.tsx` - Frontend onboarding form
- `src/app/onboarding/success/page.tsx` - Success page
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `src/lib/email-templates.ts` - Welcome email template
- `prisma/schema.prisma` - Subscription models

## 🚀 Next Steps

1. **Get Stripe keys** and configure environment variables
2. **Run setup script** to create products
3. **Set up webhook** in Stripe dashboard
4. **Test locally** with test card 4242 4242 4242 4242
5. **Deploy to production**
6. **Switch to live mode** when ready
7. **Start onboarding customers!**

## 💡 Tips

- **Testing**: Always test in Stripe test mode first
- **Webhooks**: Monitor webhook logs in Stripe dashboard
- **Emails**: Check spam folder if not receiving emails
- **Support**: Stripe has excellent documentation and support

## 🎯 Business Model

Your platform now has a complete SaaS business model:

- **Revenue**: £247-£897 per training center per month
- **Scalability**: Unlimited training centers
- **Automation**: Zero manual intervention
- **Trial**: 14 days free reduces friction
- **Churn protection**: Email notifications keep customers engaged

## Need Help?

- Stripe docs: https://stripe.com/docs
- Stripe support: https://support.stripe.com
- TrainKit docs: See STRIPE-SETUP.md for detailed instructions

---

**Your self-service SaaS platform is ready to launch!** 🚀
