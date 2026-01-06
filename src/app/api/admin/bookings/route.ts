import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
        session: {
          include: {
            course: true
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const bookingsWithSpaceInfo = await Promise.all(
      bookings.map(async (booking) => {
        const session = booking.session
        const remainingSpaces = session.availableSpots - session.bookedSpots
        
        return {
          id: booking.id,
          customer: {
            id: booking.customer.id,
            firstName: booking.customer.firstName,
            lastName: booking.customer.lastName,
            email: booking.customer.email,
            phone: booking.customer.phone
          },
          session: {
            id: session.id,
            course: {
              title: session.course.title,
              duration: session.course.duration,
              category: session.course.category
            },
            startDate: session.startDate.toISOString().split('T')[0],
            endDate: session.endDate.toISOString().split('T')[0],
            startTime: session.startTime,
            endTime: session.endTime,
            availableSpots: session.availableSpots,
            bookedSpots: session.bookedSpots,
            remainingSpaces
          },
          status: booking.status,
          totalAmount: booking.totalAmount,
          depositAmount: booking.depositAmount,
          payments: booking.payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            paidAt: payment.paidAt?.toISOString()
          })),
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString()
        }
      })
    )

    return NextResponse.json(bookingsWithSpaceInfo)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}