# TrainKit Admin Password Reset System - Deployment Instructions

## Overview

This deployment adds automated admin account creation and password reset functionality to your TrainKit SaaS platform.

## What's Being Deployed

### New Features:
1. **Automated Admin Account Creation** - When a new tenant signs up, an admin account is automatically created
2. **Password Reset Token System** - Secure token-based password reset
3. **Welcome Email** - New tenant admins receive an email with a "set password" link
4. **Password Reset Page** - Frontend page at `/admin/reset-password` for setting passwords

### Files Modified:
- `prisma/schema.prisma` - Added PasswordResetToken model
- `prisma/migrations/` - New migration for database
- `src/app/api/onboarding/route.ts` - Auto-creates admin accounts
- `src/app/api/admin/reset-password/request/route.ts` - New API endpoint
- `src/app/api/admin/reset-password/confirm/route.ts` - New API endpoint
- `src/app/admin/reset-password/page.tsx` - New frontend page

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Upload the deployment package to your server:**
   ```bash
   scp trainkit-update-*.tar.gz root@trainkit.co.uk:/tmp/
   ```

2. **SSH into your server:**
   ```bash
   ssh root@trainkit.co.uk
   ```

3. **Extract the package:**
   ```bash
   cd /var/www/trainkit
   tar -xzf /tmp/trainkit-update-*.tar.gz
   ```

4. **Run the deployment script:**
   ```bash
   chmod +x deploy-password-reset.sh
   ./deploy-password-reset.sh
   ```

The script will:
- Create a backup of existing files
- Apply database migrations
- Regenerate Prisma client
- Build the application
- Restart PM2

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. **SSH into your server:**
   ```bash
   ssh root@trainkit.co.uk
   cd /var/www/trainkit
   ```

2. **Create a backup:**
   ```bash
   mkdir -p /var/www/trainkit-backups
   tar -czf /var/www/trainkit-backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz prisma/ src/
   ```

3. **Extract the deployment package:**
   ```bash
   tar -xzf /tmp/trainkit-update-*.tar.gz
   ```

4. **Run database migration:**
   ```bash
   export DATABASE_URL="postgresql://trainkit_user:lWYG7Ti7vZW6UU4v6Ts04g==@localhost:5432/trainkit"
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Install dependencies (if needed):**
   ```bash
   npm install --production
   ```

6. **Build the application:**
   ```bash
   npm run build
   ```

7. **Restart PM2:**
   ```bash
   pm2 restart trainkit
   pm2 status trainkit
   ```

## Testing the Deployment

### 1. Test Password Reset Page
Visit: https://trainkit.co.uk/admin/reset-password

You should see a password reset form with:
- Password field (minimum 12 characters)
- Confirm password field
- Submit button

### 2. Test Admin Account Creation
When a new tenant signs up via `/api/onboarding` with these additional fields:
```json
{
  "adminFirstName": "John",
  "adminLastName": "Smith",
  "adminEmail": "admin@example.com",
  ...other fields...
}
```

The system should:
- Create the tenant
- Create an admin account
- Send a welcome email with password setup link

### 3. Test Complete Flow
1. Create a test tenant via onboarding
2. Check email for welcome message
3. Click "Set Password" link
4. Set password at `/admin/reset-password?token=...`
5. Login at `/admin/login` with new credentials

## Environment Variables

Make sure these are set in your `.env.production` file:

```env
# Resend API for emails
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=partnerships@trainkit.co.uk

# App URL
NEXT_PUBLIC_APP_URL=https://trainkit.co.uk
```

## Database Changes

The migration adds this table:

```sql
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
```

With indexes on:
- `token` (unique)
- `email`

## Rollback Plan

If something goes wrong, you can rollback:

1. **Stop the application:**
   ```bash
   pm2 stop trainkit
   ```

2. **Restore from backup:**
   ```bash
   cd /var/www/trainkit
   tar -xzf /var/www/trainkit-backups/backup-YYYYMMDD-HHMMSS.tar.gz
   ```

3. **Rollback database migration:**
   ```bash
   npx prisma migrate resolve --rolled-back 20251112193845_add_password_reset_tokens
   ```

4. **Rebuild and restart:**
   ```bash
   npx prisma generate
   npm run build
   pm2 restart trainkit
   ```

## Troubleshooting

### Check Application Logs
```bash
pm2 logs trainkit
```

### Check Database Connection
```bash
psql -U trainkit_user -d trainkit
\dt  # List all tables - should see PasswordResetToken
```

### Test API Endpoints
```bash
# Test password reset request
curl -X POST https://trainkit.co.uk/api/admin/reset-password/request \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Common Issues

**Issue:** Migration fails with "table already exists"
**Solution:** The table might already exist. Check with `\dt` in psql, or run:
```bash
npx prisma db pull
npx prisma migrate resolve --applied 20251112193845_add_password_reset_tokens
```

**Issue:** Emails not sending
**Solution:** Check your RESEND_API_KEY in `.env.production` and verify it's valid

**Issue:** Password reset page shows 404
**Solution:** Make sure the build completed successfully and PM2 restarted

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs trainkit`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify all environment variables are set correctly
4. Ensure the database migration completed successfully

## Success Criteria

Deployment is successful when:
- ✅ Application builds without errors
- ✅ PM2 shows "online" status
- ✅ Password reset page loads at https://trainkit.co.uk/admin/reset-password
- ✅ Database shows PasswordResetToken table exists
- ✅ New tenant onboarding creates admin account and sends email
- ✅ Password reset flow works end-to-end

---

**Date:** November 12, 2025
**Version:** 1.0.0
**Deployed by:** Automated Admin Account System
