# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for TrainKit tenant billing.

## Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test mode** (toggle in top right) for testing with card 4242 4242 4242 4242
3. Go to **Developers** → **API keys**
4. Copy your:
   - **Publishable key** (`pk_test_...` or `pk_live_...`)
   - **Secret key** (`sk_test_...` or `sk_live_...`)

## Step 2: Update Environment Variables

Update your `.env.local` file for local development:

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
```

Update your `.env.production` file on the server:

```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_LIVE_KEY_HERE"
STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY_HERE"
```

## Step 3: Create Stripe Products & Prices

Run the automated setup script:

```bash
npm run tsx scripts/setup-stripe-products.ts
```

This will create 3 subscription plans:
- **Starter**: £297/month - 50 students, 5 courses
- **Professional**: £497/month - 150 students, 15 courses
- **Enterprise**: £797/month - unlimited

The script will output Price IDs like:
```
STRIPE_STARTER_PRICE_ID="price_xxxxx"
STRIPE_PROFESSIONAL_PRICE_ID="price_xxxxx"
STRIPE_ENTERPRISE_PRICE_ID="price_xxxxx"
```

## Step 4: Add Price IDs to Environment Variables

Add the Price IDs to your `.env.local`:

```bash
# Subscription Price IDs (from step 3 output)
STRIPE_STARTER_PRICE_ID="price_xxxxx"
STRIPE_PROFESSIONAL_PRICE_ID="price_xxxxx"
STRIPE_ENTERPRISE_PRICE_ID="price_xxxxx"

# Also add public versions for frontend
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID="price_xxxxx"
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID="price_xxxxx"
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID="price_xxxxx"
```

And to `.env.production` on the server.

## Step 5: Set Up Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL: `https://trainkit.co.uk/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.created`
   - `invoice.finalized`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

5. Copy the **Signing secret** (`whsec_...`)

6. Add to your `.env.production`:

```bash
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

## Step 6: Test with Test Card

Use Stripe's test card for testing:
- **Card number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits

## Step 7: Test the Onboarding Flow

1. Visit: `https://trainkit.co.uk/onboarding`
2. Select a plan
3. Fill in company details
4. Enter test card details
5. Complete signup
6. Verify:
   - Tenant created in database
   - Subscription created in Stripe
   - Welcome email sent
   - Admin login works

## Switching to Live Mode

When ready for production:

1. **Switch Stripe to Live mode**
2. **Create live products** (run setup script with live keys)
3. **Update environment variables** with live keys
4. **Set up live webhook** pointing to production URL
5. **Test with real card** before going live

## Troubleshooting

### "No such price" error
- Make sure price IDs are correct in environment variables
- Restart your Next.js server after updating .env files

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret in environment variables
- Check webhook logs in Stripe Dashboard

### Email not sending
- Verify SMTP configuration in `.env.production`
- Check server logs for email errors

## Support

For Stripe support: [https://support.stripe.com](https://support.stripe.com)
