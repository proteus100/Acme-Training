# TrainKit Vercel Deployment Guide

## Environment Variables Required

Add these to Vercel → Settings → Environment Variables:

### Database
```
DATABASE_URL
postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1-pooler.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require

POSTGRES_URL_NON_POOLING
postgresql://neondb_owner:npg_tF0BGsm1ZKef@ep-holy-hall-abg4t8i1.eu-west-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

### Email (Resend)
```
RESEND_API_KEY
re_M4EM29yH_ABmzX9nTQe76mqY9gbcsXSrQ

FROM_EMAIL
delivered@resend.dev
(Change to noreply@trainkit.co.uk once DNS is verified)

TO_EMAIL
patheyjohns@gmail.com
```

### Stripe
```
STRIPE_SECRET_KEY
sk_test_51SSwsVKCfEvYlFBlWVpsGv5PFbXXTat6u7U7UmbQH5kqNDra5U80h8ORGiTQ6y30ZKhGoNluJjmYYCDlkwqc25qi00ULZCDDFF

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
pk_test_51SSwsVKCfEvYlFBlA8CMWeyevMdYGgHDsPkQWW2Ue3wAIQNzgHgwB6JYEsoPUPMRivscVK90cJ6j16ZlmOpRnJYd00FUpn9qrP
```

### NextAuth
```
NEXTAUTH_SECRET
tmTqt0zfU9xlDvESx2mulyzc0su9w1WjMM4vB10cZnc=

NEXTAUTH_URL
https://www.trainkit.co.uk

NEXT_PUBLIC_APP_URL
https://www.trainkit.co.uk
```

### Feature Flags
```
NEXT_PUBLIC_ENABLE_COURSE_BOOKINGS
false
```

### Google OAuth (Optional)
```
GOOGLE_CLIENT_ID
97956968836-jjf65mf039ib86gtpfo1a3jlel9uu8ko.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
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
```

## Vercel Build Settings

**Root Directory:** Leave EMPTY (blank)

**Build Command:** `npm run build`

**Output Directory:** `.next`

**Install Command:** `npm install`

## Domain Setup

**Custom Domain:** www.trainkit.co.uk and trainkit.co.uk

**DNS Records (at Fasthosts):**
- A record: trainkit.co.uk → 76.76.21.21 (Vercel IP)
- CNAME: www → cname.vercel-dns.com

## Resend Email DNS Setup

**Domain:** trainkit.co.uk

**DNS Records to add at Fasthosts:**

1. **TXT Record - DKIM**
   - Name: `resend._domainkey`
   - Value: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4UyABIxiDpCEC8MAYU0EaPXXUA6pvoNQJE1xUEjjUr8p1yOiUd3fS0ObFI9KYX6mUQe60ETtU/uLhtn/Qv8Muv923X4Q6j4aX5xxnKda9wIx+HacDR0RZ3/gwC2pi+HguZKkz6Uay5lKUVyR31Z0b1eI7Iiaydur50RpUPcqX3QIDAQAB`

2. **MX Record - For Sending**
   - Name: `send`
   - Points to: `feedback-smtp.eu-west-1.amazonses.com`
   - Priority: 10

3. **TXT Record - SPF**
   - Name: `send`
   - Value: `v=spf1 include:amazonses.com ~all`

4. **TXT Record - DMARC** (Optional)
   - Name: `_dmarc`
   - Value: `v=DMARC1; p=none;`

Once verified, change `FROM_EMAIL` to `noreply@trainkit.co.uk`

## Database Setup

**Main Tenant for trainkit.co.uk:**

A tenant with domain `trainkit.co.uk` has been created. The main domain shows courses from ALL tenants (multi-tenant platform).

**Tenant Details:**
- Name: TrainKit
- Slug: trainkit
- Domain: trainkit.co.uk
- Plan: ENTERPRISE

## Troubleshooting

### Build fails with "Cannot find module"
- Check all imports use `@prisma/client` not `@/generated/prisma`
- Ensure `prisma generate` runs in build script

### 500 errors on API routes
- Check Vercel Function logs for specific error
- Verify DATABASE_URL is correct
- Ensure Prisma client is configured for serverless

### "Loading..." never completes
- Check API endpoints return data (test `/api/courses`)
- Verify tenant configuration for the domain
- Check browser console for errors

## Important Files

- `/src/lib/prisma.ts` - Prisma client configuration (must be serverless-optimized)
- `/src/lib/tenant.ts` - Multi-tenant logic
- `/.npmrc` - Contains `legacy-peer-deps=true` for dependency resolution
- `/package.json` - Includes `postinstall: prisma generate`

## Notes

- The repository root contains only TrainKit code
- No nested directories or other projects
- Clean git history without large files
- Main branch is `main`
