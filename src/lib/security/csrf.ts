/**
 * CSRF Protection Implementation
 * Prevents Cross-Site Request Forgery attacks
 */

import { randomBytes, createHash } from 'crypto'
import { cookies } from 'next/headers'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_SECRET = process.env.CSRF_SECRET || 'change-this-in-production'

interface CsrfTokenPair {
  token: string // Sent to client
  hash: string  // Stored in cookie
}

/**
 * Generate a CSRF token pair
 */
export function generateCsrfToken(): CsrfTokenPair {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  const hash = createHash('sha256')
    .update(token + CSRF_SECRET)
    .digest('hex')

  return { token, hash }
}

/**
 * Verify a CSRF token against its hash
 */
export function verifyCsrfToken(token: string, hash: string): boolean {
  if (!token || !hash) {
    return false
  }

  const expectedHash = createHash('sha256')
    .update(token + CSRF_SECRET)
    .digest('hex')

  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(expectedHash, hash)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Get or create CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  const existingHash = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (existingHash) {
    // Token already exists in cookie, generate matching token
    // In practice, you'd store the original token somewhere secure
    // For now, we'll generate a new one
    const { token, hash } = generateCsrfToken()

    // Set new cookie
    cookieStore.set(CSRF_COOKIE_NAME, hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return token
  }

  // Generate new token
  const { token, hash } = generateCsrfToken()

  cookieStore.set(CSRF_COOKIE_NAME, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  return token
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Get token from header or body
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME)

  let tokenFromBody: string | null = null
  if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.clone().json()
      tokenFromBody = body.csrfToken || body._csrf
    } catch (e) {
      // Not JSON or no body
    }
  }

  const token = tokenFromHeader || tokenFromBody

  if (!token) {
    return false
  }

  // Get hash from cookie
  const cookieStore = await cookies()
  const hash = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!hash) {
    return false
  }

  return verifyCsrfToken(token, hash)
}

/**
 * Middleware helper to check CSRF for state-changing methods
 */
export async function requireCsrfToken(request: Request): Promise<Response | null> {
  // Only check for state-changing methods
  const method = request.method.toUpperCase()
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null // No CSRF check needed
  }

  // Skip CSRF for API routes that use other auth methods (e.g., JWT)
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/webhooks/')) {
    return null // Webhooks use signature verification
  }

  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'CSRF validation failed. Please refresh and try again.'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return null // Validation passed
}

/**
 * Generate CSRF token for forms (Client-side helper)
 */
export async function getCsrfTokenForForm(): Promise<string> {
  return await getCsrfToken()
}

/**
 * Create CSRF meta tags for page head
 */
export async function getCsrfMetaTags(): Promise<string> {
  const token = await getCsrfToken()
  return `<meta name="csrf-token" content="${token}">`
}

/**
 * Extract CSRF token from meta tag (for client-side usage)
 * Add this to your client-side code:
 *
 * const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
 */
