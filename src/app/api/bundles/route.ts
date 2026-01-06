import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET /api/bundles - List all active bundles for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantSubdomain = request.headers.get('x-tenant-subdomain')

    // If no tenant subdomain (client-side request), return empty array
    // This allows the component to use fallback bundles
    if (!tenantSubdomain) {
      console.log('[Bundles API] No tenant subdomain - returning empty array for fallback')
      return NextResponse.json([])
    }

    console.log('[Bundles API] Fetching bundles for tenant:', tenantSubdomain)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSubdomain }
    })

    if (!tenant) {
      console.log('[Bundles API] Tenant not found:', tenantSubdomain)
      return NextResponse.json([])
    }

    // Fetch all active bundles for this tenant
    const bundles = await prisma.bundle.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                duration: true,
                price: true
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    })

    console.log('[Bundles API] Found bundles:', bundles.length)

    // Transform the data for the frontend
    const transformedBundles = bundles.map(bundle => ({
      id: bundle.id,
      title: bundle.title,
      description: bundle.description,
      tagline: bundle.tagline,
      tier: bundle.tier,
      originalPrice: bundle.originalPrice,
      bundlePrice: bundle.bundlePrice,
      savings: bundle.savings,
      discountPercentage: bundle.discountPercentage,
      isPopular: bundle.isPopular,
      features: bundle.features ? JSON.parse(bundle.features) : [],
      benefits: bundle.benefits ? JSON.parse(bundle.benefits) : [],
      courses: bundle.courses.map(bc => ({
        id: bc.course.id,
        title: bc.course.title,
        description: bc.course.description,
        category: bc.course.category,
        duration: bc.course.duration,
        price: bc.course.price
      }))
    }))

    return NextResponse.json(transformedBundles)
  } catch (error) {
    console.error('[Bundles API] Error fetching bundles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    )
  }
}

// POST /api/bundles - Create new bundle (admin only)
export async function POST(request: NextRequest) {
  try {
    const tenantSubdomain = request.headers.get('x-tenant-subdomain') || 'platform'
    const data = await request.json()

    console.log('[Bundles API] Creating bundle for tenant:', tenantSubdomain)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSubdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Validate required fields
    if (!data.title || !data.description || !data.courseIds || data.courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Title, description, and at least one course are required' },
        { status: 400 }
      )
    }

    // Calculate bundle pricing
    const courses = await prisma.course.findMany({
      where: {
        id: { in: data.courseIds },
        tenantId: tenant.id
      }
    })

    if (courses.length !== data.courseIds.length) {
      return NextResponse.json(
        { error: 'One or more courses not found' },
        { status: 404 }
      )
    }

    const originalPrice = courses.reduce((sum, course) => sum + course.price, 0)
    const discountPercentage = data.discountPercentage || 20
    const bundlePrice = originalPrice * (1 - discountPercentage / 100)
    const savings = originalPrice - bundlePrice

    // Create bundle
    const bundle = await prisma.bundle.create({
      data: {
        tenantId: tenant.id,
        title: data.title,
        description: data.description,
        tagline: data.tagline || null,
        tier: data.tier || 'FOUNDATION',
        originalPrice,
        bundlePrice,
        savings,
        discountPercentage,
        features: data.features ? JSON.stringify(data.features) : null,
        benefits: data.benefits ? JSON.stringify(data.benefits) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isPopular: data.isPopular || false,
        displayOrder: data.displayOrder || 0,
        courses: {
          create: data.courseIds.map((courseId: string, index: number) => ({
            courseId,
            displayOrder: index
          }))
        }
      },
      include: {
        courses: {
          include: {
            course: true
          }
        }
      }
    })

    console.log('[Bundles API] Bundle created:', bundle.id)

    return NextResponse.json(bundle, { status: 201 })
  } catch (error) {
    console.error('[Bundles API] Error creating bundle:', error)
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    )
  }
}
