# Security Implementation Guide

This document outlines all security measures implemented in the ACME Training Platform.

## Table of Contents

1. [Rate Limiting](#rate-limiting)
2. [CSRF Protection](#csrf-protection)
3. [Input Validation](#input-validation)
4. [Error Handling](#error-handling)
5. [Security Headers](#security-headers)
6. [Environment Variables](#environment-variables)
7. [Production Checklist](#production-checklist)

---

## Rate Limiting

### Overview
Rate limiting prevents brute force attacks by limiting the number of requests from a single IP address or email within a time window.

### Implementation
Location: `/src/lib/security/rate-limiter.ts`

### Configurations

| Endpoint | Max Attempts | Window | Block Duration |
|----------|--------------|--------|----------------|
| Admin Login | 5 | 15 min | 30 min |
| NextAuth | 10 | 15 min | 15 min |
| API General | 30 | 1 min | N/A |
| API Booking | 20 | 1 min | N/A |
| Contact Form | 5 | 1 hour | N/A |

### Usage Example

```typescript
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/security/rate-limiter'

// In your API route
const clientIp = getClientIp(request)
const result = rateLimit(clientIp, RATE_LIMITS.ADMIN_LOGIN)

if (!result.allowed) {
  return NextResponse.json(
    { error: 'Too Many Requests' },
    { status: 429 }
  )
}
```

### Features
- In-memory storage (Map)
- Automatic cleanup of expired entries
- Per-IP and per-email tracking
- Configurable block durations
- Rate limit headers in responses

---

## CSRF Protection

### Overview
Cross-Site Request Forgery (CSRF) protection prevents unauthorized commands from being transmitted from a user that the web application trusts.

### Implementation
Location: `/src/lib/security/csrf.ts`

### How It Works
1. Server generates a CSRF token and hash
2. Hash is stored in HTTP-only cookie
3. Token is sent to client (meta tag or API response)
4. Client includes token in state-changing requests
5. Server validates token against stored hash

### Usage Example

**Server-side (API Route):**
```typescript
import { requireCsrfToken } from '@/lib/security/csrf'

export async function POST(request: Request) {
  const csrfResponse = await requireCsrfToken(request)
  if (csrfResponse) {
    return csrfResponse // CSRF validation failed
  }

  // Continue with request processing
}
```

**Client-side:**
```typescript
// Get CSRF token from meta tag
const csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute('content')

// Include in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

### Protected Methods
- POST
- PUT
- DELETE
- PATCH

### Exceptions
- Webhook endpoints (use signature verification instead)
- Public read-only APIs

---

## Input Validation

### Overview
All user inputs are validated and sanitized using Zod schemas and validator.js to prevent injection attacks and ensure data integrity.

### Implementation
Location: `/src/lib/security/validators.ts`

### Available Schemas

#### Authentication
- `loginSchema` - Email and password validation
- `registerSchema` - User registration with password strength rules

#### Tenants
- `createTenantSchema` - New tenant creation
- `updateTenantSchema` - Tenant updates

#### Courses
- `createCourseSchema` - Course creation
- `updateCourseSchema` - Course updates

#### Bookings
- `createBookingSchema` - New booking
- `updateBookingSchema` - Booking updates

#### Contact Forms
- `contactFormSchema` - Contact form with XSS prevention

### Usage Example

```typescript
import { loginSchema, validateInput, formatZodErrors } from '@/lib/security/validators'

const validation = validateInput(loginSchema, requestBody)

if (!validation.success) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: formatZodErrors(validation.errors)
    },
    { status: 422 }
  )
}

const { email, password } = validation.data
```

### Features
- Runtime type validation
- Automatic data transformation (trim, normalize)
- Custom error messages
- XSS prevention with HTML escaping
- URL sanitization
- Email normalization

---

## Error Handling

### Overview
Production-safe error handling ensures sensitive information is never exposed to clients.

### Implementation
Location: `/src/lib/security/error-handler.ts`

### Features
- Stack traces only shown in development
- Consistent error response format
- Request ID tracking
- Automatic error logging
- Sensitive data detection

### Usage Example

**Wrap API Routes:**
```typescript
import { withErrorHandler, ApiErrors } from '@/lib/security/error-handler'

export const POST = withErrorHandler(async (request: Request) => {
  // Your logic here

  if (!user) {
    throw ApiErrors.NotFound('User not found')
  }

  if (!authorized) {
    throw ApiErrors.Forbidden('Access denied')
  }

  // ... rest of handler
})
```

**Available Error Types:**
- `BadRequest(message, details?)` - 400
- `Unauthorized(message, details?)` - 401
- `Forbidden(message, details?)` - 403
- `NotFound(message, details?)` - 404
- `Conflict(message, details?)` - 409
- `UnprocessableEntity(message, details?)` - 422
- `TooManyRequests(message, details?)` - 429
- `InternalServer(message, details?)` - 500
- `ServiceUnavailable(message, details?)` - 503

### Response Format

**Development:**
```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed: timeout",
  "code": "INTERNAL_ERROR",
  "requestId": "req_1234567890_abc12345"
}
```

**Production:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later.",
  "code": "INTERNAL_ERROR",
  "requestId": "req_1234567890_abc12345"
}
```

---

## Security Headers

### Overview
Security headers are configured in `next.config.ts` to protect against common web vulnerabilities.

### Implementation
Location: `/next.config.ts`

### Configured Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-XSS-Protection | 1; mode=block | Enable XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Restrict browser features |
| Content-Security-Policy | (complex) | Prevent XSS and injection |
| Strict-Transport-Security | max-age=31536000 (production only) | Force HTTPS |

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.stripe.com;
frame-src https://js.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

---

## Environment Variables

### Required for Production

Create a `.env.production` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication Secrets (CRITICAL - Generate strong random values)
JWT_SECRET="<generate-strong-random-string-min-32-chars>"
NEXTAUTH_SECRET="<generate-strong-random-string-min-32-chars>"
CSRF_SECRET="<generate-strong-random-string-min-32-chars>"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"

# Stripe (if using)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="<secure-password>"
SMTP_FROM="ACME Training <noreply@yourdomain.com>"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Optional: API Keys for external services
VALID_API_KEYS="key1,key2,key3"
```

### Generating Secrets

Use the following command to generate secure random secrets:

```bash
openssl rand -base64 32
```

Or in Node.js:

```javascript
require('crypto').randomBytes(32).toString('base64')
```

---

## Production Checklist

### Before Deployment

- [ ] Generate and set all secret environment variables
- [ ] Change default admin password in database
- [ ] Remove or secure any test accounts
- [ ] Enable HTTPS/TLS for all connections
- [ ] Configure proper CORS policies
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Run security audit: `npm audit`
- [ ] Test rate limiting is working
- [ ] Verify CSRF protection on forms
- [ ] Check all API endpoints use validation
- [ ] Ensure error messages don't leak sensitive info
- [ ] Verify security headers are set correctly
- [ ] Test with production database
- [ ] Set up intrusion detection system (optional)
- [ ] Configure Web Application Firewall (optional)

### Post-Deployment

- [ ] Monitor error logs for security issues
- [ ] Review rate limit logs for attack patterns
- [ ] Regularly update dependencies: `npm update`
- [ ] Perform penetration testing
- [ ] Review and rotate secrets quarterly
- [ ] Monitor for SQL injection attempts
- [ ] Check for unusual login patterns
- [ ] Review CSRF token validation logs

---

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Stored as bcrypt hash

### Session Management
- HTTP-only cookies
- Secure flag in production
- SameSite=Strict
- 7-day expiration
- Automatic renewal on activity

### Database Security
- Use parameterized queries (Prisma handles this)
- Least privilege principle for database users
- Regular backups
- Encrypted connections

### API Security
- Rate limiting on all endpoints
- CSRF tokens for state-changing operations
- Input validation on all user inputs
- Authentication for protected routes
- Authorization checks for resources

---

## Reporting Security Issues

If you discover a security vulnerability, please email security@acme-training.co.uk with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

**Do not** create a public GitHub issue for security vulnerabilities.

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

## License

This security implementation is part of the ACME Training Platform and is subject to the same license terms.

**Last Updated:** November 2025
