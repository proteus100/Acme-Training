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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'

    // Calculate date range based on period
    let startDate: Date | undefined
    if (period !== 'all') {
      const days = parseInt(period)
      startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    }

    // Get all payments for this tenant within the period
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          tenantId: tenant.id
        },
        ...(startDate && {
          createdAt: {
            gte: startDate
          }
        })
      },
      include: {
        booking: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                company: true
              }
            },
            session: {
              include: {
                course: {
                  select: {
                    title: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate comprehensive stats
    const [
      totalRevenueResult,
      periodRevenueResult,
      pendingPaymentsResult,
      totalBookingsCount
    ] = await Promise.all([
      // Total revenue (all time)
      prisma.payment.aggregate({
        where: {
          booking: {
            tenantId: tenant.id
          },
          status: 'PAID'
        },
        _sum: {
          amount: true
        }
      }),

      // Period revenue
      prisma.payment.aggregate({
        where: {
          booking: {
            tenantId: tenant.id
          },
          status: 'PAID',
          ...(startDate && {
            paidAt: {
              gte: startDate
            }
          })
        },
        _sum: {
          amount: true
        }
      }),

      // Pending payments amount
      prisma.payment.aggregate({
        where: {
          booking: {
            tenantId: tenant.id
          },
          status: 'PENDING'
        },
        _sum: {
          amount: true
        }
      }),

      // Total bookings count
      prisma.booking.count({
        where: { tenantId: tenant.id }
      })
    ])

    // Group payments by status for additional stats
    const paymentsByStatus = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate refunded amount
    const refundedAmount = payments
      .filter(p => p.status === 'REFUNDED')
      .reduce((sum, p) => sum + p.amount, 0)

    // Calculate average booking value
    const totalRevenue = totalRevenueResult._sum.amount || 0
    const averageBookingValue = totalBookingsCount > 0 ? totalRevenue / totalBookingsCount : 0

    const stats = {
      totalRevenue,
      monthlyRevenue: periodRevenueResult._sum.amount || 0,
      pendingPayments: pendingPaymentsResult._sum.amount || 0,
      paidPayments: paymentsByStatus.PAID || 0,
      failedPayments: paymentsByStatus.FAILED || 0,
      refundedAmount,
      averageBookingValue,
      totalBookings: totalBookingsCount
    }

    return NextResponse.json({
      success: true,
      payments,
      stats
    })

  } catch (error) {
    console.error('Error fetching tenant billing data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing data' },
      { status: 500 }
    )
  }
}