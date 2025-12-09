import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/sessions/[id] - Get single session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.courseSession.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            price: true,
            category: true,
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
                company: true
              }
            },
            payments: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' }, 
      { status: 500 }
    )
  }
}

// PUT /api/sessions/[id] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // Check if session exists
    const existingSession = await prisma.courseSession.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          }
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : existingSession.startDate
      const endDate = data.endDate ? new Date(data.endDate) : existingSession.endDate
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // Validate time format if provided
    if (data.startTime || data.endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if ((data.startTime && !timeRegex.test(data.startTime)) || 
          (data.endTime && !timeRegex.test(data.endTime))) {
        return NextResponse.json(
          { error: 'Time must be in HH:MM format' },
          { status: 400 }
        )
      }
    }

    // Validate available spots
    if (data.availableSpots !== undefined) {
      if (data.availableSpots < existingSession.bookedSpots) {
        return NextResponse.json(
          { error: `Cannot set available spots below current bookings (${existingSession.bookedSpots})` },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.startTime) updateData.startTime = data.startTime
    if (data.endTime) updateData.endTime = data.endTime
    if (data.availableSpots !== undefined) updateData.availableSpots = parseInt(data.availableSpots)
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const session = await prisma.courseSession.update({
      where: { id: params.id },
      data: updateData,
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
        }
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if session exists
    const existingSession = await prisma.courseSession.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          }
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' }, 
        { status: 404 }
      )
    }

    // Check if session has active bookings
    if (existingSession.bookings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete session with active bookings',
          activeBookings: existingSession.bookings.length
        },
        { status: 409 }
      )
    }

    // Delete session (this will cascade delete associated bookings if any)
    await prisma.courseSession.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Session deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' }, 
      { status: 500 }
    )
  }
}