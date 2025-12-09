# Local Subdomain Testing Guide

This guide explains how to test subdomain-based multi-tenancy on your local development machine.

## Overview

The application uses subdomain-based multi-tenancy where each training center gets their own subdomain:
- **Platform Admin**: `localhost:3001` or `platform.localhost:3001`
- **Tenant Subdomains**: `acme.localhost:3001`, `bristol.localhost:3001`, etc.

## How Subdomain Detection Works

1. **Middleware** (`src/middleware.ts`) intercepts all requests
2. Extracts the subdomain from the hostname
3. Adds `x-tenant-subdomain` header to the request
4. Routes use this header to filter data by tenant

## Setup for Local Testing

### Method 1: Using .localhost (Recommended)

Modern browsers and operating systems support `.localhost` subdomains natively. No configuration needed!

**URLs to test:**
```
http://localhost:3001                    # Platform admin
http://acme.localhost:3001              # ACME training center
http://bristol.localhost:3001           # Bristol training center
http://weston.localhost:3001            # Weston training center
```

### Method 2: Using /etc/hosts (Alternative)

If `.localhost` doesn't work on your system, add custom host entries.

1. **Edit /etc/hosts file:**
```bash
sudo nano /etc/hosts
```

2. **Add these lines:**
```
127.0.0.1  localhost
127.0.0.1  acme.local
127.0.0.1  bristol.local
127.0.0.1  weston.local
127.0.0.1  platform.local
```

3. **Save and exit** (Ctrl+O, Enter, Ctrl+X)

4. **Flush DNS cache (macOS):**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**URLs to test:**
```
http://platform.local:3001              # Platform admin
http://acme.local:3001                  # ACME training center
http://bristol.local:3001               # Bristol training center
http://weston.local:3001                # Weston training center
```

## Testing Subdomain Multi-Tenancy

### 1. Check Tenant Data Exists

First, verify you have tenants in your database:

```bash
# Run this in the project directory
cd prisma
sqlite3 dev.db

# Query tenants
SELECT id, name, slug, active FROM Tenant;

# Exit
.quit
```

You should see tenants with slugs like: `acme`, `bristol`, `weston`

### 2. Test Platform Admin Access

1. Visit `http://localhost:3001/admin`
2. Login with platform admin credentials
3. You should see **ALL** data from **ALL** tenants
4. Check browser console for logs showing: `Tenant filter: {}`

### 3. Test Tenant-Specific Access

1. Visit `http://acme.localhost:3001/admin`
2. Login with tenant-specific admin (if created) or platform admin
3. You should **ONLY** see data for ACME training center
4. Check browser console for logs showing: `Tenant filter: { tenantId: 'xxx' }`

### 4. Test Data Isolation

1. Open two browser windows:
   - Window 1: `http://acme.localhost:3001/admin/courses`
   - Window 2: `http://bristol.localhost:3001/admin/courses`

2. Each window should show **different** courses
3. ACME should only see ACME courses
4. Bristol should only see Bristol courses

### 5. Verify Middleware Logs

Check your terminal running `npm run dev` for logs like:

```
GET /api/courses 200 in 43ms
Tenant filter: {}                      # Platform admin
```

or

```
GET /api/courses 200 in 43ms
Tenant filter: { tenantId: 'xxx' }    # Tenant-specific
```

## Current Tenant-Enabled Routes

The following API routes now support tenant filtering:

- ✅ `/api/courses` - Course listing and creation
- ✅ `/api/sessions` - Session listing and creation
- ✅ `/api/customers` - Customer management

Other routes will need to be updated following the same pattern.

## Troubleshooting

### Subdomain not detected
- **Check middleware logs** in terminal
- **Verify URL format**: Must be `subdomain.localhost:3001`
- **Clear browser cache** and restart browser

### Seeing all data instead of tenant data
- **Check tenant exists** with the subdomain slug
- **Verify tenant is active** (`active = true`)
- **Check middleware** is running (look for "✓ Compiled /middleware")

### 404 errors or blank pages
- **Restart dev server**: `npm run dev`
- **Clear Next.js cache**: `rm -rf .next`
- **Check port**: Should be 3001 (or your configured port)

### Browser not resolving .localhost
- **Try different browser**: Chrome/Firefox work best
- **Use Method 2** (/etc/hosts) instead
- **Check firewall** settings

## Debugging Tips

### Check Current Subdomain

Add this to any API route to debug:

```typescript
import { getTenantSubdomain } from '@/lib/tenant'

const subdomain = await getTenantSubdomain()
console.log('Current subdomain:', subdomain)
```

### Check Tenant Filter

Add this to any API route to see what filter is applied:

```typescript
import { getTenantFilter } from '@/lib/tenant'

const filter = await getTenantFilter()
console.log('Tenant filter:', filter)
```

### Inspect Request Headers

Check the middleware-injected headers:

```typescript
import { headers } from 'next/headers'

const headersList = await headers()
console.log('x-tenant-subdomain:', headersList.get('x-tenant-subdomain'))
console.log('x-hostname:', headersList.get('x-hostname'))
```

## Next Steps

1. **Create tenant-scoped admin users** (see ADMIN_SETUP.md)
2. **Update authentication** to be tenant-aware
3. **Add tenant branding** (logos, colors) to admin UI
4. **Update remaining API routes** with tenant filtering
5. **Deploy to staging** with real domain names

## Production Deployment

In production, subdomains will work automatically:

```
https://admin.yourplatform.com         # Platform admin
https://acme.yourplatform.com          # ACME tenant
https://bristol.yourplatform.com       # Bristol tenant
```

Or with custom domains:

```
https://acmetraining.co.uk            # ACME's custom domain
https://bristoltraining.co.uk         # Bristol's custom domain
```

The middleware will detect the subdomain/domain and route requests accordingly.
