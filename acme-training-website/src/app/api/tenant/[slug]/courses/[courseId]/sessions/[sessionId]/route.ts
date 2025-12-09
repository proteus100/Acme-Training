import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string; sessionId: string }> }
) {
  try {
    const { slug, sessionId } = await params
    
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

    // Get the specific session
    const session = await prisma.courseSession.findFirst({
      where: {
        id: sessionId,
        tenantId: tenant.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            duration: true,
            price: true,
            maxStudents: true
          }
        },
        bookings: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                company: true,
                jobTitle: true
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                paidAt: true,
                createdAt: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        },
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

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string; sessionId: string }> }
) {
  try {
    const { slug, sessionId } = await params
    
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

    const body = await request.json()
    const {
      startDate,
      endDate,
      startTime,
      endTime,
      availableSpots,
      isActive,
      isCompleted,
      instructorNotes
    } = body

    // Verify the session belongs to this tenant
    const existingSession = await prisma.courseSession.findFirst({
      where: {
        id: sessionId,
        tenantId: tenant.id
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update the session
    const updatedSession = await prisma.courseSession.update({
      where: { id: sessionId },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(availableSpots !== undefined && { availableSpots: parseInt(availableSpots) }),
        ...(isActive !== undefined && { isActive }),
        ...(isCompleted !== undefined && { 
          isCompleted,
          ...(isCompleted && { completedAt: new Date() })
        }),
        ...(instructorNotes !== undefined && { instructorNotes })
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
      session: updatedSession
    })

  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string; sessionId: string }> }
) {
  try {
    const { slug, sessionId } = await params
    
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

    // Verify the session belongs to this tenant
    const existingSession = await prisma.courseSession.findFirst({
      where: {
        id: sessionId,
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
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session has active bookings
    if (existingSession._count.bookings > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete session with active bookings' },
        { status: 400 }
      )
    }

    // Delete the session
    await prisma.courseSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}