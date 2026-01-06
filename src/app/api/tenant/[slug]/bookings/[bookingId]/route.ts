import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; bookingId: string }> }
) {
  try {
    const { slug, bookingId } = await params
    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, specialRequests } = body

    // Verify the booking belongs to this tenant
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenant.id
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(status && { status }),
        ...(specialRequests !== undefined && { specialRequests })
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
        session: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                category: true,
                duration: true,
                price: true
              }
            }
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
    })

    return NextResponse.json({
      success: true,
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; bookingId: string }> }
) {
  try {
    const { slug, bookingId } = await params
    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get the specific booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenant.id
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            jobTitle: true,
            address: true,
            city: true,
            postcode: true
          }
        },
        session: {
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
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            paidAt: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      booking
    })

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}