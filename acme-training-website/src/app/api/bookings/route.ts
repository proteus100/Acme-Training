import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET /api/bookings - List all bookings with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const sessionId = searchParams.get('sessionId')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    console.log('[Bookings API] Query params:', { customerId, sessionId, status, limit, offset })

    const where: any = {}

    if (customerId) where.customerId = customerId
    if (sessionId) where.sessionId = sessionId
    if (status) where.status = status

    console.log('[Bookings API] Where filter:', where)

    const bookings = await prisma.booking.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    })

    console.log('[Bookings API] Found bookings:', bookings.length)
    if (customerId) {
      console.log('[Bookings API] Customer ID requested:', customerId)
      console.log('[Bookings API] Bookings for this customer:', bookings.map(b => ({
        id: b.id,
        status: b.status,
        course: b.session.course.title,
        customerEmail: b.customer.email
      })))
    }

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' }, 
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.customerId || !data.sessionId || !data.totalAmount) {
      return NextResponse.json(
        { error: 'Customer ID, session ID, and total amount are required' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if session exists and has availability
    const session = await prisma.courseSession.findUnique({
      where: { id: data.sessionId },
      include: {
        course: true,
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
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

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Session is not active for bookings' },
        { status: 400 }
      )
    }

    // Check availability
    const currentBookings = session.bookings.length
    if (currentBookings >= session.availableSpots) {
      return NextResponse.json(
        { error: 'Session is fully booked' },
        { status: 409 }
      )
    }

    // Check if customer already has a booking for this session
    const existingBooking = session.bookings.find(
      booking => booking.customerId === data.customerId
    )

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Customer already has a booking for this session' },
        { status: 409 }
      )
    }

    // Validate total amount matches course price
    if (parseFloat(data.totalAmount) !== session.course.price) {
      return NextResponse.json(
        { error: 'Total amount does not match course price' },
        { status: 400 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: data.customerId,
        sessionId: data.sessionId,
        status: data.status || 'PENDING',
        specialRequests: data.specialRequests || null,
        totalAmount: parseFloat(data.totalAmount),
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : null
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

    // Update session booked spots
    await prisma.courseSession.update({
      where: { id: data.sessionId },
      data: {
        bookedSpots: currentBookings + 1
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' }, 
      { status: 500 }
    )
  }
}