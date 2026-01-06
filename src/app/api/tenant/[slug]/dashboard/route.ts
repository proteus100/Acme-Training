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

    // Get comprehensive dashboard statistics
    const [
      totalStudents,
      activeStudents,
      totalCourses,
      activeSessions,
      upcomingSessions,
      completedSessions,
      bookingStats,
      payments,
      recentBookings,
      recentPayments
    ] = await Promise.all([
      // Total students
      prisma.customer.count({
        where: { tenantId: tenant.id, isActive: true }
      }),

      // Active students (with recent activity)
      prisma.customer.count({
        where: { 
          tenantId: tenant.id,
          isActive: true,
          bookings: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
              }
            }
          }
        }
      }),

      // Total courses
      prisma.course.count({
        where: { tenantId: tenant.id }
      }),

      // Active sessions (not completed)
      prisma.courseSession.count({
        where: { 
          tenantId: tenant.id,
          isActive: true,
          isCompleted: false
        }
      }),

      // Upcoming sessions
      prisma.courseSession.count({
        where: { 
          tenantId: tenant.id,
          isActive: true,
          startDate: {
            gte: new Date()
          }
        }
      }),

      // Completed sessions
      prisma.courseSession.count({
        where: { 
          tenantId: tenant.id,
          isCompleted: true
        }
      }),

      // Booking statistics
      prisma.booking.groupBy({
        by: ['status'],
        where: { tenantId: tenant.id },
        _count: true
      }),

      // Payment statistics
      prisma.payment.aggregate({
        where: {
          booking: {
            tenantId: tenant.id
          }
        },
        _sum: {
          amount: true
        }
      }),

      // Recent bookings for activity feed
      prisma.booking.findMany({
        where: { tenantId: tenant.id },
        include: {
          customer: true,
          session: {
            include: {
              course: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Recent payments
      prisma.payment.findMany({
        where: {
          booking: {
            tenantId: tenant.id
          }
        },
        include: {
          booking: {
            include: {
              customer: true,
              session: {
                include: {
                  course: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // Process booking statistics
    const pendingBookings = bookingStats.find(b => b.status === 'PENDING')?._count || 0
    const confirmedBookings = bookingStats.find(b => b.status === 'CONFIRMED')?._count || 0

    // Calculate revenue (last 30 days and total)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        booking: {
          tenantId: tenant.id
        },
        status: 'PAID',
        paidAt: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        amount: true
      }
    })

    const outstandingPayments = await prisma.payment.aggregate({
      where: {
        booking: {
          tenantId: tenant.id
        },
        status: 'PENDING'
      },
      _sum: {
        amount: true
      }
    })

    // Build recent activity feed
    const recentActivity = []

    // Add recent bookings
    recentBookings.slice(0, 5).forEach(booking => {
      recentActivity.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        message: `${booking.customer.firstName} ${booking.customer.lastName} booked ${booking.session.course.title}`,
        timestamp: booking.createdAt.toISOString(),
        studentName: `${booking.customer.firstName} ${booking.customer.lastName}`
      })
    })

    // Add recent payments
    recentPayments.forEach(payment => {
      if (payment.status === 'PAID') {
        recentActivity.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          message: `Payment received from ${payment.booking.customer.firstName} ${payment.booking.customer.lastName}`,
          timestamp: payment.paidAt?.toISOString() || payment.createdAt.toISOString(),
          studentName: `${payment.booking.customer.firstName} ${payment.booking.customer.lastName}`,
          amount: payment.amount
        })
      }
    })

    // Sort activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const stats = {
      totalStudents,
      activeStudents,
      totalCourses,
      activeSessions,
      upcomingSessions,
      completedSessions,
      pendingBookings,
      confirmedBookings,
      totalRevenue: payments._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      outstandingPayments: outstandingPayments._sum.amount || 0
    }

    return NextResponse.json({
      success: true,
      stats,
      recentActivity: recentActivity.slice(0, 10)
    })

  } catch (error) {
    console.error('Error fetching tenant dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}