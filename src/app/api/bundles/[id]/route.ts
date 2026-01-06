import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/bundles/[id] - Get bundle details with available sessions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id
    const tenantSubdomain = request.headers.get('x-tenant-subdomain') || 'platform'

    console.log('[Bundle Details API] Fetching bundle:', bundleId)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSubdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Fetch bundle with courses and available sessions
    const bundle = await prisma.bundle.findFirst({
      where: {
        id: bundleId,
        tenantId: tenant.id
      },
      include: {
        courses: {
          include: {
            course: {
              include: {
                sessions: {
                  where: {
                    isActive: true,
                    isCompleted: false,
                    startDate: {
                      gte: new Date() // Only future sessions
                    }
                  },
                  orderBy: {
                    startDate: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      }
    })

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    // Transform the data
    const transformedBundle = {
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
        price: bc.course.price,
        sessions: bc.course.sessions.map(session => ({
          id: session.id,
          startDate: session.startDate,
          endDate: session.endDate,
          startTime: session.startTime,
          endTime: session.endTime,
          availableSpots: session.availableSpots,
          bookedSpots: session.bookedSpots,
          spotsRemaining: session.availableSpots - session.bookedSpots,
          isFull: session.bookedSpots >= session.availableSpots
        }))
      }))
    }

    return NextResponse.json(transformedBundle)
  } catch (error) {
    console.error('[Bundle Details API] Error fetching bundle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bundle details' },
      { status: 500 }
    )
  }
}

// PUT /api/bundles/[id] - Update bundle (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id
    const tenantSubdomain = request.headers.get('x-tenant-subdomain') || 'platform'
    const data = await request.json()

    console.log('[Bundle Details API] Updating bundle:', bundleId)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSubdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check bundle exists
    const existingBundle = await prisma.bundle.findFirst({
      where: {
        id: bundleId,
        tenantId: tenant.id
      }
    })

    if (!existingBundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    // Update bundle
    const bundle = await prisma.bundle.update({
      where: { id: bundleId },
      data: {
        title: data.title || existingBundle.title,
        description: data.description || existingBundle.description,
        tagline: data.tagline !== undefined ? data.tagline : existingBundle.tagline,
        tier: data.tier || existingBundle.tier,
        bundlePrice: data.bundlePrice || existingBundle.bundlePrice,
        discountPercentage: data.discountPercentage || existingBundle.discountPercentage,
        features: data.features ? JSON.stringify(data.features) : existingBundle.features,
        benefits: data.benefits ? JSON.stringify(data.benefits) : existingBundle.benefits,
        isActive: data.isActive !== undefined ? data.isActive : existingBundle.isActive,
        isPopular: data.isPopular !== undefined ? data.isPopular : existingBundle.isPopular,
        displayOrder: data.displayOrder !== undefined ? data.displayOrder : existingBundle.displayOrder
      },
      include: {
        courses: {
          include: {
            course: true
          }
        }
      }
    })

    console.log('[Bundle Details API] Bundle updated:', bundle.id)

    return NextResponse.json(bundle)
  } catch (error) {
    console.error('[Bundle Details API] Error updating bundle:', error)
    return NextResponse.json(
      { error: 'Failed to update bundle' },
      { status: 500 }
    )
  }
}

// DELETE /api/bundles/[id] - Delete bundle (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id
    const tenantSubdomain = request.headers.get('x-tenant-subdomain') || 'platform'

    console.log('[Bundle Details API] Deleting bundle:', bundleId)

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSubdomain }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Check bundle exists
    const existingBundle = await prisma.bundle.findFirst({
      where: {
        id: bundleId,
        tenantId: tenant.id
      }
    })

    if (!existingBundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }

    // Delete bundle (will cascade delete BundleCourses)
    await prisma.bundle.delete({
      where: { id: bundleId }
    })

    console.log('[Bundle Details API] Bundle deleted:', bundleId)

    return NextResponse.json({ message: 'Bundle deleted successfully' })
  } catch (error) {
    console.error('[Bundle Details API] Error deleting bundle:', error)
    return NextResponse.json(
      { error: 'Failed to delete bundle' },
      { status: 500 }
    )
  }
}
