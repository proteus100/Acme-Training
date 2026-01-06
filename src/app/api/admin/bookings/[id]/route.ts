import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

// PUT /api/admin/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status, notes } = await request.json()

    // Get existing booking to check tenant
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

    // Check tenant-scoped access
    if (admin.tenantId && existingBooking.tenantId !== admin.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Booking belongs to different tenant' },
        { status: 403 }
      )
    }

    // Validate status if provided
    if (status && !['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid booking status' },
        { status: 400 }
      )
    }

    // If changing from non-cancelled to cancelled, adjust session booked spots
    if (status === 'CANCELLED' && existingBooking.status !== 'CANCELLED') {
      await prisma.courseSession.update({
        where: { id: existingBooking.sessionId },
        data: {
          bookedSpots: {
            decrement: 1
          }
        }
      })
    }

    // If changing from cancelled to non-cancelled, adjust session booked spots
    if (status !== 'CANCELLED' && existingBooking.status === 'CANCELLED') {
      // Check if session has capacity
      const session = await prisma.courseSession.findUnique({
        where: { id: existingBooking.sessionId }
      })

      if (session && session.bookedSpots >= session.availableSpots) {
        return NextResponse.json(
          { error: 'Session is fully booked' },
          { status: 400 }
        )
      }

      await prisma.courseSession.update({
        where: { id: existingBooking.sessionId },
        data: {
          bookedSpots: {
            increment: 1
          }
        }
      })
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: status || existingBooking.status,
        specialRequests: notes ? `${existingBooking.specialRequests ? existingBooking.specialRequests + '\n\n' : ''}[Admin Note - ${new Date().toISOString()}]: ${notes}` : existingBooking.specialRequests
      },
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

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/bookings/[id] - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing booking to check tenant
    const existingBooking = await prisma.booking.findUnique({
      where: { id: params.id }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check tenant-scoped access
    if (admin.tenantId && existingBooking.tenantId !== admin.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Booking belongs to different tenant' },
        { status: 403 }
      )
    }

    // Update booking status to CANCELLED instead of deleting
    // This preserves historical data and payment records
    const cancelledBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED'
      }
    })

    // Decrease session booked spots if booking was not already cancelled
    if (existingBooking.status !== 'CANCELLED') {
      await prisma.courseSession.update({
        where: { id: existingBooking.sessionId },
        data: {
          bookedSpots: {
            decrement: 1
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
