/**
 * Comprehensive Security Middleware
 * Integrates rate limiting, CSRF, error handling, and more
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp, createRateLimitHeaders, RATE_LIMITS } from './rate-limiter'
import { requireCsrfToken } from './csrf'
import { createErrorResponse, generateRequestId } from './error-handler'

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (restrict access to browser features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // Content Security Policy (basic - customize as needed)
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.stripe.com; " +
    "frame-src https://js.stripe.com;",

  // Strict Transport Security (HSTS) - only in production
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  })
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Rate limit configuration per route pattern
 */
function getRateLimitConfig(pathname: string) {
  if (pathname.includes('/api/admin/login')) {
    return { config: RATE_LIMITS.ADMIN_LOGIN, identifier: 'email' }
  }

  if (pathname.includes('/api/auth/')) {
    return { config: RATE_LIMITS.NEXT_AUTH, identifier: 'ip' }
  }

  if (pathname.includes('/api/bookings')) {
    return { config: RATE_LIMITS.API_BOOKING, identifier: 'ip' }
  }

  if (pathname.includes('/api/contact')) {
    return { config: RATE_LIMITS.CONTACT_FORM, identifier: 'ip' }
  }

  if (pathname.startsWith('/api/')) {
    return { config: RATE_LIMITS.API_GENERAL, identifier: 'ip' }
  }

  return null
}

/**
 * Main security middleware
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const requestId = generateRequestId()

  try {
    // 1. Apply rate limiting
    const rateLimitConfig = getRateLimitConfig(pathname)
    if (rateLimitConfig) {
      const identifier =
        rateLimitConfig.identifier === 'email'
          ? await getEmailFromRequest(request)
          : getClientIp(request)

      const result = rateLimit(identifier, rateLimitConfig.config)

      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: 'Too Many Requests',
            message: result.blocked
              ? 'Too many failed attempts. Your access has been temporarily blocked.'
              : 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )

        // Add rate limit headers
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          response.headers.set(key, value)
        })

        return applySecurityHeaders(response)
      }
    }

    // 2. CSRF Protection for state-changing methods
    const csrfResponse = await requireCsrfToken(request)
    if (csrfResponse) {
      return applySecurityHeaders(NextResponse.json(
        await csrfResponse.json(),
        { status: csrfResponse.status }
      ))
    }

    // 3. Validate request size (prevent large payloads)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      // 10MB limit
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Payload Too Large',
            message: 'Request body exceeds maximum size of 10MB'
          },
          { status: 413 }
        )
      )
    }

    // 4. Block suspicious user agents (optional)
    const userAgent = request.headers.get('user-agent')
    if (isBlockedUserAgent(userAgent)) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Access denied'
          },
          { status: 403 }
        )
      )
    }

    // 5. Add request ID to headers for tracking
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)

    return applySecurityHeaders(response)
  } catch (error) {
    console.error('[Security Middleware Error]', error)
    return createErrorResponse(error, 500, requestId)
  }
}

/**
 * Extract email from request for rate limiting
 */
async function getEmailFromRequest(request: NextRequest): Promise<string> {
  try {
    if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.clone().json()
      return body.email || getClientIp(request)
    }
  } catch (e) {
    // Fall back to IP if we can't extract email
  }

  return getClientIp(request)
}

/**
 * Check if user agent should be blocked
 */
function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false

  const blockedPatterns = [
    /^$/,  // Empty user agent
    /curl/i,  // Block curl (optional - remove if you need API access via curl)
    /wget/i,
    /sqlmap/i,
    /nikto/i,
    /scanner/i,
    /bot/i  // Be careful - this might block legitimate bots
  ]

  // Only block obvious malicious patterns
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(userAgent))
}

/**
 * Validate API key from header (for API authentication)
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return false
  }

  // In production, store API keys in database with hashing
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []

  return validApiKeys.includes(apiKey)
}

/**
 * Check if request is from localhost
 */
export function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get('host') || ''
  return host.startsWith('localhost') || host.startsWith('127.0.0.1')
}

/**
 * Get real IP address considering proxies
 */
export function getRealIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Check if IP is in allowed list (for IP whitelisting)
 */
export function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  return allowedIps.includes(ip)
}

/**
 * Sanitize URL to prevent open redirects
 */
export function sanitizeRedirectUrl(url: string, allowedDomains: string[]): string | null {
  try {
    const parsed = new URL(url)

    // Only allow relative URLs or URLs from allowed domains
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const hostname = parsed.hostname

      // Check if domain is in allowed list
      const isAllowed = allowedDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      )

      if (!isAllowed) {
        return null
      }
    }

    return url
  } catch (e) {
    // If URL parsing fails, treat as relative path
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url
    }
    return null
  }
}

/**
 * Generate nonce for CSP
 */
export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

/**
 * Create CSP header with nonce
 */
export function createCspWithNonce(nonce: string): string {
  return SECURITY_HEADERS['Content-Security-Policy'].replace(
    "'unsafe-inline'",
    `'nonce-${nonce}'`
  )
}
