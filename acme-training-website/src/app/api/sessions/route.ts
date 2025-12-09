import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getTenantFilter, verifyTenantAccess } from '../../../lib/tenant'

// GET /api/sessions - List all sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const active = searchParams.get('active')
    const upcoming = searchParams.get('upcoming')

    // Get tenant filter for multi-tenancy
    const tenantFilter = await getTenantFilter()

    const where: any = {
      ...tenantFilter
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (active === 'true') {
      where.isActive = true
    }

    if (upcoming === 'true') {
      where.startDate = {
        gte: new Date()
      }
    }

    const sessions = await prisma.courseSession.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            duration: true,
            price: true,
            category: true
          }
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ['CONFIRMED', 'COMPLETED'] }
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' }, 
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.courseId || !data.startDate || !data.endDate || !data.startTime || !data.endTime) {
      return NextResponse.json(
        { error: 'Course ID, start date, end date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Check if course exists and get its tenantId
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: {
        id: true,
        tenantId: true,
        maxStudents: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify the course belongs to the current tenant (for tenant-scoped requests)
    try {
      await verifyTenantAccess(course.tenantId)
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Course does not belong to your organization' },
        { status: 403 }
      )
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'End date must be after or equal to start date' },
        { status: 400 }
      )
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Session cannot be scheduled in the past' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
      return NextResponse.json(
        { error: 'Time must be in HH:MM format' },
        { status: 400 }
      )
    }

    // For main admin portal, we need to get tenantId from the course
    const session = await prisma.courseSession.create({
      data: {
        tenantId: course.tenantId,
        courseId: data.courseId,
        startDate: startDate,
        endDate: endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        availableSpots: data.availableSpots || course.maxStudents,
        bookedSpots: 0,
        isActive: data.isActive !== false
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            duration: true,
            price: true,
            category: true
          }
        },
        bookings: true
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' }, 
      { status: 500 }
    )
  }
}