# 📧 Email Integration Setup Guide

## Overview

The ACME Training Centre contact form includes a complete email integration system using **Resend** for reliable transactional emails. When someone submits the contact form, two emails are automatically sent:

1. **Notification Email** → Sent to your team for immediate follow-up
2. **Confirmation Email** → Sent to the client acknowledging their inquiry

---

## 🚀 Quick Setup

### Step 1: Create Resend Account
1. Visit [resend.com](https://resend.com) and create an account
2. Choose the free plan (40,000 emails/month)
3. Verify your email address

### Step 2: Domain Verification
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain** 
3. Enter your domain: `acme-training.co.uk`
4. Add the DNS records provided by Resend to your domain hosting:
   ```
   Type: TXT
   Name: @
   Value: [Resend verification string]
   
   Type: MX
   Name: @
   Value: feedback-smtp.resend.com
   Priority: 10
   ```
5. Wait for verification (usually 5-15 minutes)

### Step 3: Get API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `ACME Training Contact Form`
4. Select **Full Access**
5. Copy the API key (starts with `re_`)

### Step 4: Update Environment Variables
Edit your `.env` file and replace the placeholder values:

```env
# Email Configuration (Resend)
RESEND_API_KEY="re_your_actual_api_key_here"
FROM_EMAIL="partnerships@acme-training.co.uk"
TO_EMAIL="info@acme-training.co.uk"
```

**Important:** 
- `FROM_EMAIL` must use your verified domain
- `TO_EMAIL` is where you want to receive notifications
- Never commit your real API key to version control

---

## 📋 Email Templates

### Notification Email (Sent to Your Team)
- **Subject:** `New Partnership Inquiry: [Organization Name]`
- **Content:** Complete inquiry details with professional formatting
- **Features:**
  - Quick summary section for immediate action
  - Organized contact and organization details
  - Business requirements and timeline
  - Next steps checklist

### Confirmation Email (Sent to Client)
- **Subject:** `Your Partnership Inquiry - ACME Training Centre`
- **Content:** Professional acknowledgment and next steps
- **Features:**
  - Personalized greeting
  - Clear expectations (24-hour response)
  - Contact information for urgent needs
  - Brand reinforcement

---

## 🔧 Technical Details

### Email Service: Resend
- **Why Resend?** Modern, developer-friendly, reliable delivery
- **Cost:** Free tier: 40,000 emails/month, 100 emails/day
- **Features:** High deliverability, detailed analytics, webhook support

### Spam Protection
- **Honeypot Field:** Hidden field that bots typically fill
- **Time-Based Protection:** Minimum 5 seconds to complete form
- **Email Validation:** Server-side email format checking
- **Required Fields:** All business-critical fields must be completed

### Email Format
- **HTML Version:** Professional styling with company branding
- **Text Version:** Plain text fallback for all email clients
- **Mobile Responsive:** Optimized for mobile email clients

---

## 🧪 Testing

### Test Form Submission
1. Go to `/contact` page
2. Fill out the form completely
3. Submit the form
4. Check console logs for email confirmation
5. Once API key is configured, check both email inboxes

### Console Output (Before API Key Setup)
```
📧 Email would be sent (Resend not configured):
Notification: New Partnership Inquiry: Test Organization
Confirmation to: test@example.com
```

### Console Output (After API Key Setup)
```
Training Center Partnership Inquiry: {
  timestamp: "2025-01-15T10:30:45.123Z",
  organization: { name: "Test Training Center", ... },
  contact: { name: "John Smith", ... },
  requirements: { specific: "Need booking system", ... }
}
```

---

## 📊 Monitoring & Analytics

### Resend Dashboard
- **Email Delivery Status:** Track sent, delivered, opened emails
- **Bounce Tracking:** Monitor email deliverability issues
- **Analytics:** Open rates, click tracking, engagement metrics

### Application Logs
All form submissions are logged to console with:
- Complete submission details
- Timestamp and form completion time
- Contact and organization information
- Business requirements and timeline

---

## 🛠 Customization Options

### Change Email Addresses
Update `.env` file:
```env
FROM_EMAIL="noreply@acme-training.co.uk"
TO_EMAIL="sales@acme-training.co.uk,support@acme-training.co.uk"
```

### Modify Email Templates
Edit `/src/lib/email-templates.ts`:
- Update branding and styling
- Add additional fields
- Customize messaging
- Add company logo/images

### Add Email Attachments
```typescript
await resend.emails.send({
  // ... existing config
  attachments: [
    {
      filename: 'company-brochure.pdf',
      path: '/path/to/brochure.pdf'
    }
  ]
})
```

---

## 🚨 Troubleshooting

### Common Issues

**1. Emails Not Sending**
- Check API key is correct and not expired
- Verify domain is properly verified in Resend
- Check console for error messages

**2. Emails Going to Spam**
- Ensure domain verification is complete
- Add SPF and DKIM records as provided by Resend
- Use a professional from email address

**3. Form Submission Errors**
- Check browser console for JavaScript errors
- Verify all required fields are filled
- Check network tab for API response codes

### Error Codes
- **400:** Invalid form data or spam protection triggered
- **500:** Server error (check console logs)
- **Rate Limited:** Too many requests (wait and retry)

---

## 📈 Best Practices

### Domain Reputation
- Use a dedicated subdomain for transactional emails
- Monitor bounce rates and keep them under 2%
- Implement proper unsubscribe mechanisms

### Email Content
- Keep subject lines clear and professional
- Use consistent branding across all emails
- Include clear next steps and contact information
- Test emails across different clients

### Security
- Never log or store API keys
- Use environment variables for all sensitive data
- Implement rate limiting for form submissions
- Regularly rotate API keys

---

## 📞 Support

### Resend Support
- **Documentation:** [docs.resend.com](https://docs.resend.com)
- **Discord:** Resend Community Discord
- **Email:** hello@resend.com

### Implementation Support
For help with this specific integration:
1. Check console logs for error details
2. Verify environment variables are set correctly
3. Test with a simple email first
4. Check Resend dashboard for delivery status

---

## 🔮 Future Enhancements

### Potential Improvements
- **CRM Integration:** Automatically create leads in your CRM
- **Slack/Teams Notifications:** Real-time team alerts
- **Email Sequences:** Automated follow-up email series
- **Calendar Integration:** Automatic meeting scheduling links
- **Lead Scoring:** Prioritize inquiries based on criteria

### Database Storage
Consider adding form submissions to database:
```typescript
// Add to Prisma schema
model ContactInquiry {
  id String @id @default(cuid())
  organizationName String
  contactEmail String
  // ... other fields
  createdAt DateTime @default(now())
}
```

This would enable:
- Lead management dashboard
- Follow-up tracking
- Analytics and reporting
- Integration with CRM systems