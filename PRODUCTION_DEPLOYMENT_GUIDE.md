# 🚀 Production Deployment Guide - Student Authentication System

## Overview
Complete guide for deploying the ACME Training Centre student authentication system to production with Google OAuth.

## Pre-Deployment Checklist

### 1. Google OAuth Setup for Production
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable Google+ API (if not already enabled)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen with your domain
6. Create OAuth 2.0 Client ID:
   - **Application Type**: Web application
   - **Name**: ACME Training Centre - Production
   - **Authorized JavaScript origins**: 
     - `https://yourdomain.com`
     - `https://www.yourdomain.com` (if using www)
   - **Authorized redirect URIs**:
     - `https://yourdomain.com/api/auth/callback/google`
     - `https://www.yourdomain.com/api/auth/callback/google` (if using www)

### 2. Environment Variables for Production
Update your production `.env` file with:

```env
# Google OAuth - PRODUCTION VALUES
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# NextAuth Configuration - PRODUCTION VALUES
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_secure_random_string_min_32_chars

# Database - PRODUCTION VALUES
DATABASE_URL=your_production_database_url
```

### 3. Generate Secure NextAuth Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

### 4. Database Setup for Production

#### Option A: SQLite (Simple)
- Copy `prisma/dev.db` to production server
- Update `DATABASE_URL="file:./production.db"`

#### Option B: PostgreSQL/MySQL (Recommended)
- Set up production database
- Update `DATABASE_URL` with connection string
- Run migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Build and Deploy Commands
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Start production server
npm run start
```

## Security Checklist

### SSL/HTTPS
- ✅ Ensure HTTPS is enabled (required for OAuth)
- ✅ SSL certificate is valid and trusted
- ✅ Redirect HTTP to HTTPS

### Environment Security
- ✅ Never commit production secrets to git
- ✅ Use environment variables for all secrets
- ✅ Restrict database access to production server only
- ✅ Use strong, unique passwords

### NextAuth Security
- ✅ Use database sessions (already configured)
- ✅ Set secure NEXTAUTH_SECRET (32+ characters)
- ✅ Configure proper cookie settings for production

## Testing Production Setup

### 1. Pre-Launch Testing
1. Test Google Sign-In flow: `https://yourdomain.com/student/login`
2. Verify profile setup: `https://yourdomain.com/student/profile-setup`
3. Check dashboard functionality: `https://yourdomain.com/student/dashboard`
4. Test API endpoints work with authentication
5. Verify all existing admin functionality still works

### 2. User Acceptance Testing
- Test with real Google accounts
- Verify company registration flow
- Check certification display
- Test course booking functionality
- Ensure mobile responsiveness

## Rollback Plan

### If Issues Arise
1. **Immediate**: Disable student routes by commenting out in routing
2. **Database**: Restore from backup if database issues occur
3. **OAuth**: Temporarily disable Google Sign-In, show maintenance message
4. **Full Rollback**: Deploy previous version without student auth

### Backup Strategy
- ✅ Database backup before deployment
- ✅ Code backup (git tag/branch)
- ✅ Environment variables backup

## Post-Deployment Monitoring

### Check These After Launch
- [ ] Google OAuth flow working end-to-end
- [ ] New user registrations working
- [ ] Existing users can log in
- [ ] Dashboard data loading correctly
- [ ] API endpoints responding
- [ ] No console errors in browser
- [ ] Server logs show no errors

### Performance Monitoring
- Monitor sign-in success rates
- Check API response times
- Database query performance
- Server resource usage

## Support Information

### Student Support
- **Login Issues**: Check Google account access
- **Profile Setup**: Guide through company registration
- **Dashboard**: Explain certification status meanings

### Technical Support Contacts
- **Developer**: Available for deployment assistance
- **Database**: Backup and recovery procedures documented
- **OAuth**: Google Cloud Console access required

## Feature Overview (For Reference)

### What Students Can Do
1. **Sign In**: Use Google account to authenticate
2. **Register Company**: Complete profile with company details
3. **View Dashboard**: See certifications and course availability
4. **Book Courses**: Browse and book training sessions
5. **Track Certifications**: Monitor expiry dates and renewal needs

### Integration Points
- **Existing Courses**: All 19 courses preserved and available
- **Admin System**: Continues to work independently  
- **Database**: Enhanced with OAuth but backwards compatible
- **Booking System**: Integrated with student profiles

## Emergency Contacts
- **Primary Developer**: [Your Contact]
- **Google Cloud Support**: [If enterprise account]
- **Hosting Provider**: [Your hosting details]

---

**Last Updated**: 2025-09-13  
**Version**: Student Authentication v1.0  
**Status**: Ready for Production Deployment 🚀