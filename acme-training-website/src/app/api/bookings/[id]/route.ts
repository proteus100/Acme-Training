import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/bookings/[id] - Get single booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        session: {
          include: {
            course: true
          }
        },
        payments: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' }, 
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        session: {
          include: {
            course: true
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' }, 
        { status: 404 }
      )
    }

    // Validate status if being updated
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (data.status && !validStatuses.includes(data.status)) {
      return NextResponse.json(
        { error: 'Invalid booking status' },
        { status: 400 }
      )
    }

    // Handle status changes that affect session booking counts
    let sessionUpdate = null
    if (data.status && data.status !== existingBooking.status) {
      const session = await prisma.courseSession.findUnique({
        where: { id: existingBooking.sessionId }
      })

      if (session) {
        // If changing to CANCELLED from an active status, decrease booked spots
        if (data.status === 'CANCELLED' && 
            ['PENDING', 'CONFIRMED'].includes(existingBooking.status)) {
          sessionUpdate = {
            bookedSpots: Math.max(0, session.bookedSpots - 1)
          }
        }
        // If changing from CANCELLED to an active status, increase booked spots
        else if (['PENDING', 'CONFIRMED'].includes(data.status) && 
                 existingBooking.status === 'CANCELLED') {
          if (session.bookedSpots >= session.availableSpots) {
            return NextResponse.json(
              { error: 'Session is fully booked' },
              { status: 409 }
            )
          }
          sessionUpdate = {
            bookedSpots: session.bookedSpots + 1
          }
        }
      }
    }

    const updateData: any = {}
    
    if (data.status) updateData.status = data.status
    if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests
    if (data.depositAmount !== undefined) updateData.depositAmount = parseFloat(data.depositAmount)

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
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
        session: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                duration: true,
                price: true,
                category: true
              }
            }
          }
        },
        payments: true
      }
    })

    // Update session if needed
    if (sessionUpdate) {
      await prisma.courseSession.update({
        where: { id: existingBooking.sessionId },
        data: sessionUpdate
      })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - Delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          where: {
            status: 'PAID'
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' }, 
        { status: 404 }
      )
    }

    // Check if booking has payments - might want to prevent deletion
    if (existingBooking.payments.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete booking with completed payments. Cancel instead.',
          paidPayments: existingBooking.payments.length
        },
        { status: 409 }
      )
    }

    // Get session to update booked spots
    const session = await prisma.courseSession.findUnique({
      where: { id: existingBooking.sessionId }
    })

    // Delete booking (this will cascade delete associated payments)
    await prisma.booking.delete({
      where: { id: params.id }
    })

    // Update session booked spots if booking was active
    if (session && ['PENDING', 'CONFIRMED'].includes(existingBooking.status)) {
      await prisma.courseSession.update({
        where: { id: existingBooking.sessionId },
        data: {
          bookedSpots: Math.max(0, session.bookedSpots - 1)
        }
      })
    }

    return NextResponse.json(
      { message: 'Booking deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Failed to delete booking' }, 
      { status: 500 }
    )
  }
}