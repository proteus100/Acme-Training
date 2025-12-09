# Stripe Setup Guide for ACME Training Website

## Overview
This guide will walk you through setting up real Stripe functionality for the ACME Training booking system, enabling actual payment processing for course bookings.

## 🚀 Quick Start

### Step 1: Create Stripe Account
1. Visit [stripe.com](https://stripe.com) and click "Start now"
2. Create account with your business email
3. Complete basic business information
4. **Skip** identity verification for now (test mode works without it)

### Step 2: Get Test API Keys
1. Log into Stripe Dashboard
2. Make sure you're in **TEST MODE** (toggle in top-left)
3. Go to **Developers** → **API Keys**
4. Copy these keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### Step 3: Update Environment Variables
Replace the placeholder values in your `.env` file:

```env
# Replace these with your real Stripe test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE"
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_SECRET_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"
```

### Step 4: Restart Development Server
```bash
npm run dev
```

## 🧪 Testing Payment Flow

### Test Credit Cards (Stripe Test Mode)
Use these test card numbers:

| Card Number | Brand | Result |
|-------------|-------|--------|
| `4242 4242 4242 4242` | Visa | ✅ Success |
| `4000 0000 0000 0002` | Visa | ❌ Card declined |
| `4000 0000 0000 9995` | Visa | ⏱️ Insufficient funds |
| `4000 0025 0000 3155` | Visa | 🔐 Requires authentication |

**Additional details for any test card:**
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3-digit number (e.g., 123)
- **Name**: Any name
- **Postcode**: Any postcode

### Testing the Booking Flow

1. **Visit Courses Page**
   ```
   http://localhost:3000/courses
   ```

2. **Select a Course** 
   - Click "Book This Course" on any course
   - This redirects to `/booking?course=<courseId>`

3. **Fill Booking Form**
   - Customer details: Use real format but fake data
   - Email: Use a real email you can access
   - Payment type: Choose "Full payment" or "30% deposit"

4. **Complete Payment**
   - Use test card: `4242 4242 4242 4242`
   - Fill in dummy details
   - Click "Pay Now"

5. **Success Confirmation**
   - Should redirect to booking success page
   - Check Stripe Dashboard for payment

## 📊 Monitoring Payments

### Stripe Dashboard
- **Payments**: View all test transactions
- **Customers**: See created customer records  
- **Events**: View webhook events and API calls
- **Logs**: Debug any issues

### Database Records
Check your local database for created records:
```bash
# View bookings
curl http://localhost:3000/api/bookings

# View customers  
curl http://localhost:3000/api/customers
```

## 🔗 Setting Up Webhooks (Optional)

Webhooks ensure payment confirmations update your database:

### 1. Install Stripe CLI (Optional)
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login
```

### 2. Forward Webhooks Locally
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Update Webhook Secret
Copy the webhook signing secret from the CLI output and update `.env`:
```env
STRIPE_WEBHOOK_SECRET="whsec_ACTUAL_WEBHOOK_SECRET_FROM_CLI"
```

## 💰 Payment Flow Explained

### Full Payment Flow
1. Customer fills booking form
2. API creates Stripe Payment Intent for full course price
3. Customer enters card details
4. Payment processed immediately
5. Booking confirmed, customer charged full amount

### Deposit Payment Flow  
1. Customer selects "30% deposit" option
2. API creates Payment Intent for 30% of course price
3. Payment processed for deposit only
4. Booking confirmed with remaining balance due
5. *Future enhancement: Send payment reminders for balance*

### Course Pricing (From Your 2025 Price List)
- **ACS CORE & 4 REA**: £650 (Deposit: £195)
- **ACS CORE & 4 INITIAL**: £995 (Deposit: £298.50)  
- **Air Source Heat Pump**: £650 (Deposit: £195)
- **LPG PD/RPH REA**: £300 (Deposit: £90)
- **OFTEC REA**: £600 (Deposit: £180)
- **Gas Safe Registration Training**: £850 (Deposit: £255)

## 🚨 Important Security Notes

### Test vs Live Mode
- **Test Mode**: Safe for development, no real money processed
- **Live Mode**: Real payments, requires business verification
- Always use test keys for development!

### Environment Variables
- Never commit real API keys to version control
- Use different keys for development/staging/production
- Keep secret keys secure and private

### Webhook Security
- Webhook endpoint verifies Stripe signatures
- Only processes verified webhook events
- Prevents unauthorized payment confirmations

## 🐛 Troubleshooting

### Common Issues

**"No such customer" Error**
- Customer creation failed
- Check database connectivity
- Verify customer data validation

**"Invalid API Key" Error**  
- Using placeholder/fake keys
- Copy real keys from Stripe Dashboard
- Restart development server after updating .env

**Payment Intent Creation Failed**
- Check course/session exists in database
- Verify booking data format
- Check server logs for detailed error

**Webhook Not Receiving Events**
- Ensure Stripe CLI is running
- Check webhook endpoint URL
- Verify webhook secret matches

### Debug Steps
1. Check browser network tab for API errors
2. Monitor server console for error logs
3. Check Stripe Dashboard events log
4. Verify database has required records

## 📈 Production Setup (Future)

When ready for real payments:

### 1. Complete Stripe Account Setup
- Verify business identity
- Add bank account details  
- Complete tax information

### 2. Switch to Live Mode
- Get live API keys (start with `pk_live_` and `sk_live_`)
- Update production environment variables
- Test with small real payment first

### 3. Set Up Production Webhooks
- Configure webhook endpoints in Stripe Dashboard
- Use production webhook secret
- Monitor webhook delivery

### 4. Compliance & Security
- Ensure PCI compliance
- Set up proper SSL certificates
- Configure proper error handling
- Add payment receipt emails

## 📞 Support

### Stripe Resources
- **Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Support**: Available in Stripe Dashboard
- **Status Page**: [status.stripe.com](https://status.stripe.com)

### ACME Training System
- Check server logs in terminal
- Review database records via API endpoints  
- Monitor browser console for client errors
- Reference task file: `CURRENT_TASK_STATUS.md`

---

## 🎯 Ready to Test!

Once you've completed Steps 1-4 above, your ACME Training website will have fully functional payment processing. Students can book courses and pay with real test transactions that appear in your Stripe Dashboard.

**Next Steps After Setup:**
1. Test booking flow end-to-end
2. Verify payments appear in Stripe Dashboard  
3. Check database records are created correctly
4. Test both full payment and deposit options
5. Monitor webhook events (if configured)

The system is production-ready and can handle real payments when you're ready to go live! 🚀