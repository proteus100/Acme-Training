import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string }> }
) {
  try {
    const { slug, courseId } = await params
    
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

    // Verify the course belongs to this tenant
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        tenantId: tenant.id 
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get all sessions for this course
    const sessions = await prisma.courseSession.findMany({
      where: { 
        courseId: courseId,
        tenantId: tenant.id 
      },
      include: {
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
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                company: true
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                paidAt: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      course,
      sessions
    })

  } catch (error) {
    console.error('Error fetching course sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string }> }
) {
  try {
    const { slug, courseId } = await params
    
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

    // Verify the course belongs to this tenant
    const course = await prisma.course.findFirst({
      where: { 
        id: courseId,
        tenantId: tenant.id 
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      startDate,
      endDate,
      startTime,
      endTime,
      availableSpots,
      instructorNotes
    } = body

    // Validate required fields
    if (!startDate || !endDate || !startTime || !endTime || !availableSpots) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the session
    const session = await prisma.courseSession.create({
      data: {
        tenantId: tenant.id,
        courseId: courseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        availableSpots: parseInt(availableSpots),
        bookedSpots: 0,
        isActive: true,
        isCompleted: false,
        instructorNotes: instructorNotes || null
      },
      include: {
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
      }
    })

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    )
  }
}