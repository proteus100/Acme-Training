import { NextRequest, NextResponse } from 'next/server'
import { extractTenantFromRequest } from '@/lib/tenant'

export function middleware(request: NextRequest) {
  // Get hostname from x-forwarded-host (nginx/proxy) or host header
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  console.log('Middleware - hostname:', hostname, 'pathname:', pathname)

  // Extract tenant information
  const { tenantSlug, isDemoMode, isAdminRoute } = extractTenantFromRequest(hostname, pathname)

  console.log('Middleware - tenantSlug:', tenantSlug, 'isDemoMode:', isDemoMode, 'isAdminRoute:', isAdminRoute)

  // Clone the request headers and add tenant information
  const requestHeaders = new Headers(request.headers)

  if (tenantSlug) {
    requestHeaders.set('x-tenant-subdomain', tenantSlug)
    requestHeaders.set('x-tenant-slug', tenantSlug)
  }

  if (isDemoMode) {
    requestHeaders.set('x-demo-mode', 'true')
  }

  // Skip redirect logic for admin and API routes
  if (isAdminRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  // Allow main domain (trainkit.co.uk) without tenant - shows all courses
  const isMainDomain = hostname === 'trainkit.co.uk' || hostname === 'www.trainkit.co.uk'

  // If no tenant detected and not demo mode and not main domain, show tenant not found
  if (!tenantSlug && !isDemoMode && !isMainDomain) {
    return NextResponse.redirect(new URL('/tenant-not-found', request.url))
  }

  // Continue with the modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are now included to set tenant headers
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}