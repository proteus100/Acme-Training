# 🚀 TrainKit Platform Stripe Setup Guide

## Overview
This guide walks you through setting up your Stripe account to collect subscription payments from training centers who use your TrainKit platform.

---

## 💰 Platform Revenue Model

**You collect monthly subscriptions from training centers:**
- **STARTER**: £297/month - 50 students, 5 courses
- **PROFESSIONAL**: £497/month - 150 students, 15 courses, achievement system
- **ENTERPRISE**: £797/month - Unlimited students/courses, white label

**Training centers collect from their students:**
- They use their own Stripe account
- Their students pay them directly for course bookings
- You don't touch their customer payments

---

## PHASE 1: Create Stripe Account (5 minutes)

1. **Go to**: https://dashboard.stripe.com/register
2. **Create account** with your business email (e.g., admin@trainkit.co.uk)
3. **Business name**: Enter "TrainKit" or "Exeter Digital Agency"
4. **Country**: United Kingdom
5. **Skip identity verification** for now (you can use TEST mode without it)
6. **Make sure you're in TEST MODE** - Toggle in top-left should show "Test mode"

---

## PHASE 2: Create Your 3 Subscription Products (10 minutes)

### Product 1: Starter Plan

1. Click **"Products"** in left menu → **"Add Product"**
2. Fill in:
   - **Name**: `TrainKit Starter`
   - **Description**: `50 students, 5 courses, basic booking system`
   - **Pricing**:
     - **Model**: Recurring
     - **Price**: `297.00`
     - **Currency**: GBP (£)
     - **Billing period**: Monthly
3. Click **"Save product"**
4. **⭐ IMPORTANT: COPY THE PRICE ID** (starts with `price_...`) - Save it somewhere!

### Product 2: Professional Plan

1. Click **"Add Product"** again
2. Fill in:
   - **Name**: `TrainKit Professional`
   - **Description**: `150 students, 15 courses, achievement badges, leaderboards`
   - **Pricing**:
     - **Model**: Recurring
     - **Price**: `497.00`
     - **Currency**: GBP (£)
     - **Billing period**: Monthly
3. Click **"Save product"**
4. **⭐ IMPORTANT: COPY THE PRICE ID**

### Product 3: Enterprise Plan

1. Click **"Add Product"** again
2. Fill in:
   - **Name**: `TrainKit Enterprise`
   - **Description**: `Unlimited students and courses, white label, custom branding`
   - **Pricing**:
     - **Model**: Recurring
     - **Price**: `797.00`
     - **Currency**: GBP (£)
     - **Billing period**: Monthly
3. Click **"Save product"**
4. **⭐ IMPORTANT: COPY THE PRICE ID**

---

## PHASE 3: Get Your API Keys (2 minutes)

1. Click **"Developers"** in top-right corner
2. Click **"API Keys"** in left menu
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Already visible
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" button
4. **⭐ IMPORTANT: COPY BOTH KEYS** - Save them securely!

---

## PHASE 4: Set Up Webhook Endpoint (5 minutes)

Webhooks notify your platform when subscriptions are created, updated, or canceled.

1. Still in **"Developers"**, click **"Webhooks"**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://trainkit.co.uk/api/webhooks/stripe`
4. **Description**: `TrainKit Platform Webhooks`
5. Click **"Select events"** and choose these:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.trial_will_end`
6. Click **"Add endpoint"**
7. **⭐ IMPORTANT: COPY THE SIGNING SECRET** (starts with `whsec_...`)

---

## PHASE 5: Provide Keys for Configuration

Once you have everything, provide these details:

```
✅ Publishable Key: pk_test_...
✅ Secret Key: sk_test_...
✅ Webhook Secret: whsec_...

✅ Starter Plan Price ID: price_...
✅ Professional Plan Price ID: price_...
✅ Enterprise Plan Price ID: price_...
```

**Share these with your developer to configure the platform!**

---

## 📋 Configuration Checklist

Before going live, ensure:

- [x] Stripe account created
- [x] Test mode enabled
- [x] 3 products created (Starter, Professional, Enterprise)
- [x] All 3 price IDs copied
- [x] API keys (publishable & secret) copied
- [x] Webhook endpoint added
- [x] Webhook signing secret copied
- [x] Keys provided to developer

---

## 🧪 Testing Your Setup

### Test with Stripe Test Cards

When testing the onboarding flow, use these test card numbers:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

**For any test card:**
- Expiry: Any future date (e.g., 12/28)
- CVC: Any 3 digits (e.g., 123)
- Postal Code: Any UK postcode

### Test Subscription Flow

1. Visit: `https://trainkit.co.uk/onboard` (when live)
2. Fill in training center details
3. Select a plan (Starter/Professional/Enterprise)
4. Use test card: `4242 4242 4242 4242`
5. Submit and check:
   - Subscription appears in Stripe Dashboard
   - Tenant created in TrainKit admin
   - Webhook events processed successfully

---

## 🔄 Switching to Live Mode (When Ready)

When you're ready to accept real payments:

### 1. Complete Stripe Verification
- Provide business details
- Verify identity
- Add bank account for payouts

### 2. Switch to Live Mode
- Toggle to "Live mode" in Stripe Dashboard
- Create the same 3 products in live mode
- Get live API keys (start with `pk_live_` and `sk_live_`)
- Update webhook endpoint to use live webhook secret

### 3. Update Platform Configuration
- Replace test keys with live keys
- Update environment variables on server
- Test with small real payment first

---

## 💡 Pro Tips

### Security
- **Never** commit API keys to version control
- Use environment variables for all keys
- Rotate keys if they're ever exposed
- Keep secret keys truly secret

### Monitoring
- Check Stripe Dashboard daily for new subscriptions
- Monitor webhook delivery (should be 100% success)
- Set up email alerts for failed payments
- Track Monthly Recurring Revenue (MRR)

### Customer Success
- 14-day trial period automatically included
- Training centers can cancel anytime
- Failed payments trigger automatic retry
- Email notifications keep customers informed

---

## 🚨 Troubleshooting

### "Invalid API Key" Error
- Ensure you copied the full key
- Check you're using TEST keys in development
- Verify keys are in `.env.production` file
- Restart server after updating environment variables

### Webhook Not Working
- Verify webhook URL is accessible (public URL)
- Check webhook signing secret is correct
- Review webhook logs in Stripe Dashboard
- Ensure all required events are selected

### Subscription Not Creating
- Check Stripe Dashboard Events log
- Verify price IDs are correct
- Review server logs for errors
- Test with Stripe test cards first

---

## 📞 Support Resources

### Stripe Support
- **Documentation**: https://stripe.com/docs
- **Dashboard**: https://dashboard.stripe.com
- **Support**: Available in dashboard (click "?" icon)
- **Status**: https://status.stripe.com

### TrainKit Platform
- Review: `SAAS_BILLING_REFERENCE.md`
- Review: `MULTI_CLIENT_SETUP_GUIDE.md`
- Check server logs for API errors
- Test webhook delivery manually

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Training centers can sign up via `/onboard`
2. ✅ Subscriptions appear in your Stripe Dashboard
3. ✅ Tenants are auto-created in TrainKit
4. ✅ Webhooks process successfully (check Events log)
5. ✅ You can see MRR in admin dashboard
6. ✅ Trial periods and billing work correctly

---

## 🎯 Next Steps After Stripe Setup

Once Stripe is configured:

1. **Set up Resend for emails** (see `EMAIL_SETUP.md`)
2. **Configure DNS for subdomains** (see `SUBDOMAIN_TESTING.md`)
3. **Test complete onboarding flow**
4. **Create your first test tenant**
5. **Monitor in admin dashboard**

---

**🚀 Ready to build your SaaS empire! Let's get those subscriptions rolling in!**
