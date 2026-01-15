import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { Tenant } from '@prisma/client'

export interface TenantConfig {
  id: string
  name: string
  slug: string
  domain?: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  email: string
  phone?: string
  address?: string
  city?: string
  postcode?: string
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  maxStudents: number
  maxCourses: number
  courses?: any[]
  settings?: {
    whiteLabel: boolean
    customDomain: boolean
    emailFromName?: string
    emailFromAddress?: string
  }
}

let tenantCache: Map<string, TenantConfig> = new Map()
// Clear cache on restart
tenantCache.clear()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Get tenant by domain
export async function getTenantByDomain(domain: string): Promise<TenantConfig | null> {
  try {
    // Check cache first
    const cacheKey = `domain:${domain}`
    if (tenantCache.has(cacheKey)) {
      return tenantCache.get(cacheKey) || null
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain },
          { slug: domain.split('.')[0] } // Handle subdomains
        ],
        active: true
      },
      include: {
        TenantSettings: true
      }
    })

    if (!tenant) return null

    const config: TenantConfig = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      city: tenant.city,
      postcode: tenant.postcode,
      planType: tenant.planType,
      maxStudents: tenant.maxStudents,
      maxCourses: tenant.maxCourses,
      settings: tenant.TenantSettings ? {
        whiteLabel: tenant.TenantSettings.whiteLabel,
        customDomain: tenant.TenantSettings.customDomain,
        emailFromName: tenant.TenantSettings.emailFromName,
        emailFromAddress: tenant.TenantSettings.emailFromAddress
      } : undefined
    }

    // Cache the result
    tenantCache.set(cacheKey, config)
    
    // Auto-expire cache
    setTimeout(() => {
      tenantCache.delete(cacheKey)
    }, CACHE_EXPIRY)

    return config

  } catch (error) {
    console.error('Error fetching tenant by domain:', error)
    return null
  }
}

// Get tenant by slug
export async function getTenantBySlug(slug: string): Promise<TenantConfig | null> {
  try {
    // Check cache first
    const cacheKey = `slug:${slug}`
    if (tenantCache.has(cacheKey)) {
      return tenantCache.get(cacheKey) || null
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, active: true },
      include: {
        TenantSettings: true,
        courses: {
          include: {
            sessions: {
              where: {
                startDate: {
                  gte: new Date()
                }
              },
              orderBy: {
                startDate: 'asc'
              }
            }
          }
        }
      }
    })

    if (!tenant) return null

    const config: TenantConfig = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      city: tenant.city,
      postcode: tenant.postcode,
      planType: tenant.planType,
      maxStudents: tenant.maxStudents,
      maxCourses: tenant.maxCourses,
      courses: tenant.courses || [],
      settings: tenant.TenantSettings ? {
        whiteLabel: tenant.TenantSettings.whiteLabel,
        customDomain: tenant.TenantSettings.customDomain,
        emailFromName: tenant.TenantSettings.emailFromName,
        emailFromAddress: tenant.TenantSettings.emailFromAddress
      } : undefined
    }

    // Cache the result
    tenantCache.set(cacheKey, config)
    
    // Auto-expire cache
    setTimeout(() => {
      tenantCache.delete(cacheKey)
    }, CACHE_EXPIRY)

    return config

  } catch (error) {
    console.error('Error fetching tenant by slug:', error)
    return null
  }
}

// Check if a tenant exists but is inactive
export async function checkTenantStatus(slug: string): Promise<'active' | 'inactive' | 'not_found'> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { active: true, name: true, email: true }
    })

    if (!tenant) {
      return 'not_found'
    }

    return tenant.active ? 'active' : 'inactive'
  } catch (error) {
    console.error('Error checking tenant status:', error)
    return 'not_found'
  }
}

// Extract tenant from request (for middleware)
export function extractTenantFromRequest(hostname: string, pathname: string): {
  tenantSlug?: string
  isDemoMode: boolean
  isAdminRoute: boolean
} {
  // Extract tenant slug from pathname regardless of route type
  let tenantSlug: string | undefined
  let isDemoMode = false

  // Check for path-based tenant routing (e.g., /tenant-slug/admin or /tenant-slug)
  const pathMatch = pathname.match(/^\/([a-z0-9-]+)(\/|$)/)
  const firstPathSegment = pathMatch ? pathMatch[1] : null

  // Determine if this is an admin/API route (but exclude tenant admin routes)
  const isAdminRoute = pathname.startsWith('/admin') ||
    pathname.startsWith('/onboarding') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/tenant/'))

  // Local development - support both demo mode and path-based routing
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    // If path starts with a tenant slug (not admin/api/onboarding), use that
    if (firstPathSegment &&
        !['admin', 'api', 'onboarding', '_next', 'favicon.ico', 'tenant-not-found'].includes(firstPathSegment)) {
      tenantSlug = firstPathSegment
      isDemoMode = false
      return { tenantSlug, isDemoMode, isAdminRoute: pathname.includes('/admin') }
    }
    // Otherwise use demo mode
    tenantSlug = 'demo'
    isDemoMode = true
    return { tenantSlug, isDemoMode, isAdminRoute }
  }

  // Custom domain mapping
  const domainToSlugMap: Record<string, string> = {
    'acmetraining.co.uk': 'acme',
    'westontraining.co.uk': 'weston',
    'bristoltraining.co.uk': 'bristol',
    // Add more mappings as needed
  }

  // Check if it's a known custom domain
  if (domainToSlugMap[hostname]) {
    tenantSlug = domainToSlugMap[hostname]
    return { tenantSlug, isDemoMode, isAdminRoute }
  }

  // Check if it's trainkit.co.uk main domain (www or naked domain)
  if (hostname === 'trainkit.co.uk' || hostname === 'www.trainkit.co.uk') {
    // Return null tenant for main domain - shows all courses from all tenants
    return { tenantSlug: undefined, isDemoMode, isAdminRoute }
  }

  // Check if it's a subdomain (e.g., acme.exeterdigitalagency.co.uk or absolute.trainkit.co.uk)
  if (hostname.includes('exeterdigitalagency.co.uk') || hostname.includes('trainkit.co.uk')) {
    const parts = hostname.split('.')
    if (parts.length >= 2 && parts[0] !== 'www') {
      tenantSlug = parts[0]
      return { tenantSlug, isDemoMode, isAdminRoute }
    }
  }

  // Default - no tenant detected
  return { tenantSlug, isDemoMode, isAdminRoute }
}

// Clear tenant cache (useful for admin updates)
export function clearTenantCache() {
  tenantCache.clear()
}

// ========================================
// Middleware-based tenant helper functions
// ========================================

/**
 * Get the tenant subdomain from the request headers
 * Returns null if accessing the platform admin (no subdomain)
 */
export async function getTenantSubdomain(): Promise<string | null> {
  const headersList = await headers()

  // Try middleware header first
  let subdomain = headersList.get('x-tenant-subdomain')
  console.log('[getTenantSubdomain] x-tenant-subdomain header:', subdomain)

  // If not set by middleware, extract from host header (check x-forwarded-host first, then host)
  if (!subdomain) {
    const hostname = headersList.get('x-forwarded-host') || headersList.get('host') || ''
    console.log('[getTenantSubdomain] Fallback - hostname from header (x-forwarded-host or host):', hostname)
    const extractResult = extractTenantFromRequest(hostname, '')
    subdomain = extractResult.tenantSlug || null
    console.log('[getTenantSubdomain] Extracted tenantSlug:', subdomain)
  }

  if (!subdomain || subdomain === 'platform') {
    console.log('[getTenantSubdomain] Returning null (subdomain:', subdomain, ')')
    return null
  }

  console.log('[getTenantSubdomain] Returning subdomain:', subdomain)
  return subdomain
}

/**
 * Get the current tenant based on the subdomain from middleware headers
 * Returns null if platform admin or tenant not found
 * Uses caching for performance
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const subdomain = await getTenantSubdomain()

  if (!subdomain) {
    return null
  }

  // Use the cached getTenantBySlug function
  const tenantConfig = await getTenantBySlug(subdomain)

  if (!tenantConfig) {
    return null
  }

  // Return the full tenant object from the database
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: subdomain,
      active: true
    }
  })

  return tenant
}

/**
 * Get the current tenant or throw an error if not found
 * Use this for routes that require a tenant context
 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    throw new Error('Tenant not found or inactive')
  }

  return tenant
}

/**
 * Check if the current request is for the platform admin
 * (no subdomain, or subdomain is 'platform')
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const subdomain = await getTenantSubdomain()
  return subdomain === null
}

/**
 * Get the tenant ID for database queries
 * Returns null for platform admin requests
 */
export async function getTenantId(): Promise<string | null> {
  const tenant = await getCurrentTenant()
  return tenant?.id || null
}

/**
 * Get tenant-scoped query filter
 * Returns an empty object for platform admin (no filtering)
 * Returns { tenantId: string } for tenant-specific requests
 */
export async function getTenantFilter(): Promise<{ tenantId?: string }> {
  const tenantId = await getTenantId()

  if (!tenantId) {
    return {} // Platform admin sees all data
  }

  return { tenantId }
}

/**
 * Verify that a resource belongs to the current tenant
 * Throws an error if the resource doesn't match the tenant context
 * Platform admins can access all resources
 */
export async function verifyTenantAccess(resourceTenantId: string): Promise<void> {
  const currentTenantId = await getTenantId()

  // Platform admin can access everything
  if (!currentTenantId) {
    return
  }

  if (resourceTenantId !== currentTenantId) {
    throw new Error('Access denied: Resource does not belong to your tenant')
  }
}