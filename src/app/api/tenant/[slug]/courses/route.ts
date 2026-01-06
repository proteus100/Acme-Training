import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get all courses for this tenant with upcoming sessions
    const courses = await prisma.course.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: {
            sessions: true
          }
        },
        sessions: {
          where: {
            isActive: true,
            startDate: {
              gte: new Date()
            }
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            availableSpots: true,
            bookedSpots: true,
            _count: {
              select: {
                bookings: {
                  where: {
                    status: {
                      in: ['CONFIRMED', 'PENDING']
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform courses to include upcoming sessions with available spots
    const transformedCourses = courses.map(course => ({
      ...course,
      upcomingSessions: course.sessions.map(session => ({
        id: session.id,
        startDate: session.startDate,
        endDate: session.endDate,
        availableSpots: session.availableSpots - session.bookedSpots
      }))
    }))

    return NextResponse.json({
      success: true,
      courses: transformedCourses,
      courseLimits: {
        current: courses.length,
        max: tenant.maxCourses,
        canAddMore: courses.length < tenant.maxCourses
      }
    })

  } catch (error) {
    console.error('Error fetching tenant courses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check course limit
    if (tenant._count.courses >= tenant.maxCourses) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Course limit reached. Your ${tenant.planType} plan allows ${tenant.maxCourses} courses. Upgrade your plan to add more courses.` 
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      duration,
      price,
      maxStudents
    } = body

    // Check if course title already exists for this tenant
    const existingCourse = await prisma.course.findFirst({
      where: {
        tenantId: tenant.id,
        title
      }
    })

    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course with this title already exists' },
        { status: 400 }
      )
    }

    // Create the course
    const course = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        title,
        description,
        category,
        duration: parseInt(duration),
        price: parseFloat(price),
        maxStudents: parseInt(maxStudents)
      },
      include: {
        _count: {
          select: {
            sessions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      course
    })

  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    )
  }
}