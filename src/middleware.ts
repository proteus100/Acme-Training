import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl

  // Extract subdomain
  // Examples:
  // - acme.localhost:3001 → subdomain = 'acme'
  // - acme.trainingplatform.com → subdomain = 'acme'
  // - localhost:3001 → subdomain = null (platform admin)
  // - trainingplatform.com → subdomain = null (platform admin)

  const subdomainMatch = hostname.match(/^([^.]+)\./)
  let subdomain: string | null = null

  // Check if it's a subdomain (not www, localhost, or main domain)
  if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'localhost') {
    subdomain = subdomainMatch[1]
  }

  // Handle localhost with subdomain for local development
  // Format: acme.localhost:3001
  if (hostname.includes('.localhost')) {
    const parts = hostname.split('.localhost')[0].split('.')
    subdomain = parts[parts.length - 1]
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Add tenant subdomain to headers so it's available in the app
  requestHeaders.set('x-tenant-subdomain', subdomain || 'platform')
  requestHeaders.set('x-hostname', hostname)

  // Rewrite the request with the new headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
