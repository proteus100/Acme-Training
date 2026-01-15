import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, createDefaultAdmin } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { getTenantSubdomain, getCurrentTenant } from '@/lib/tenant'
import { rateLimit, getClientIp, createRateLimitHeaders, RATE_LIMITS, clearRateLimit } from '@/lib/security/rate-limiter'
import { loginSchema, validateInput, formatZodErrors } from '@/lib/security/validators'
import { withErrorHandler, ApiErrors } from '@/lib/security/error-handler'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting by IP and email
  const clientIp = getClientIp(request)
  const ipRateLimit = rateLimit(clientIp, RATE_LIMITS.ADMIN_LOGIN)

  if (!ipRateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: ipRateLimit.blocked
          ? 'Too many failed login attempts. Your access has been temporarily blocked.'
          : 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((ipRateLimit.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: createRateLimitHeaders(ipRateLimit)
      }
    )
  }

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch (e) {
    throw ApiErrors.BadRequest('Invalid JSON in request body')
  }

  const validation = validateInput(loginSchema, body)
  if (!validation.success) {
    throw ApiErrors.UnprocessableEntity('Validation failed', formatZodErrors(validation.errors))
  }

  const { email, password } = validation.data

  // Rate limit by email as well
  const emailRateLimit = rateLimit(email, RATE_LIMITS.ADMIN_LOGIN)
  if (!emailRateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Too many failed login attempts for this account.',
        retryAfter: Math.ceil((emailRateLimit.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: createRateLimitHeaders(emailRateLimit)
      }
    )
  }

    // Get current tenant from subdomain
    const headersList = await headers()
    const allHeaders = Object.fromEntries(Array.from(headersList.entries()))
    console.log('[LOGIN] All request headers:', JSON.stringify(allHeaders, null, 2))
    console.log('[LOGIN] Critical headers:', {
      host: headersList.get('host'),
      'x-forwarded-host': headersList.get('x-forwarded-host'),
      'x-tenant-subdomain': headersList.get('x-tenant-subdomain'),
      'x-tenant-slug': headersList.get('x-tenant-slug')
    })

    const tenantSubdomain = await getTenantSubdomain()
    const currentTenant = await getCurrentTenant()

    console.log('[LOGIN] Detected - tenantSubdomain:', tenantSubdomain, 'currentTenant:', currentTenant?.name || 'null')
    console.log('[LOGIN] User attempting login - email:', email)

    // Ensure default admin exists
    await createDefaultAdmin()

  // Find admin user
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      Tenant: true // Include tenant info (capital T)
    }
  })

  if (!admin) {
    throw ApiErrors.Unauthorized('Invalid email or password')
  }

  if (!admin.isActive) {
    throw ApiErrors.Unauthorized('Account is disabled')
  }

  console.log('[LOGIN] Admin loaded - email:', admin.email, 'role:', admin.role, 'tenantId:', admin.tenantId)
  console.log('[LOGIN] Authentication check - currentTenant exists?', !!currentTenant, 'currentTenant?.id:', currentTenant?.id)

  // Tenant-scoped authentication check
  // If accessing from a tenant subdomain, verify the admin belongs to that tenant
  if (currentTenant) {
    // Tenant admins must belong to this tenant
    if (admin.tenantId && admin.tenantId !== currentTenant.id) {
      throw ApiErrors.Forbidden('You do not have access to this organization')
    }
    // If admin.tenantId is null, they're a platform admin and can access any tenant
  } else {
    // Accessing platform admin (no subdomain)
    // Only platform admins (tenantId = null) can access platform admin
    if (admin.tenantId !== null && admin.role !== 'SUPER_ADMIN') {
      throw ApiErrors.Forbidden('Please access your organization through your subdomain')
    }
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, admin.passwordHash)
  if (!isValidPassword) {
    throw ApiErrors.Unauthorized('Invalid email or password')
  }

  // Clear rate limits on successful login
  clearRateLimit(clientIp)
  clearRateLimit(email)

  // Update last login
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  })

  // Generate JWT token with tenant information
  const token = generateToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    tenantId: admin.tenantId // Include tenant ID in token
  })

  // Set secure HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return NextResponse.json({
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      tenantId: admin.tenantId,
      tenant: admin.Tenant ? {
        id: admin.Tenant.id,
        name: admin.Tenant.name,
        slug: admin.Tenant.slug,
        logo: admin.Tenant.logo,
        primaryColor: admin.Tenant.primaryColor,
        secondaryColor: admin.Tenant.secondaryColor
      } : null
    }
  })
})