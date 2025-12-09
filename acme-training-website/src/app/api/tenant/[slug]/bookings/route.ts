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
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get all bookings for this tenant with related data
    const bookings = await prisma.booking.findMany({
      where: { tenantId: tenant.id },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      bookings
    })

  } catch (error) {
    console.error('Error fetching tenant bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
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
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      customerId,
      sessionId,
      specialRequests,
      depositPercentage = 0.3
    } = body

    // Verify the customer and session belong to this tenant
    const [customer, session] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: customerId, tenantId: tenant.id }
      }),
      prisma.courseSession.findFirst({
        where: { id: sessionId, tenantId: tenant.id },
        include: { course: true }
      })
    ])

    if (!customer || !session) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer or session' },
        { status: 400 }
      )
    }

    // Check if session has available spots
    if (session.bookedSpots >= session.availableSpots) {
      return NextResponse.json(
        { success: false, error: 'Session is fully booked' },
        { status: 400 }
      )
    }

    // Check if customer already has a booking for this session
    const existingBooking = await prisma.booking.findFirst({
      where: {
        customerId,
        sessionId,
        status: { not: 'CANCELLED' }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Customer already has a booking for this session' },
        { status: 400 }
      )
    }

    const totalAmount = session.course.price
    const depositAmount = totalAmount * depositPercentage

    // Create the booking
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          customerId,
          sessionId,
          specialRequests,
          totalAmount,
          depositAmount,
          status: 'PENDING'
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
          payments: true
        }
      })

      // Update session booked spots
      await tx.courseSession.update({
        where: { id: sessionId },
        data: {
          bookedSpots: { increment: 1 }
        }
      })

      return newBooking
    })

    return NextResponse.json({
      success: true,
      booking
    })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}