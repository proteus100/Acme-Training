import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/dashboard - Get subscription management dashboard data
export async function GET() {
  try {
    // Get subscription statistics
    const subscriptionStats = await getSubscriptionStats()
    
    // Get tenant statistics
    const tenantStats = await getTenantStats()
    
    // Get recent activity
    const recentActivity = await getRecentActivity()
    
    // Get revenue data
    const revenueData = await getRevenueData()
    
    // Get subscription events (recent webhook events)
    const recentEvents = await getRecentEvents()

    return NextResponse.json({
      success: true,
      dashboard: {
        subscriptions: subscriptionStats,
        tenants: tenantStats,
        revenue: revenueData,
        recentActivity,
        recentEvents
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

async function getSubscriptionStats() {
  const [
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    pastDueSubscriptions,
    canceledSubscriptions,
    subscriptionsByPlan
  ] = await Promise.all([
    prisma.tenantSubscription.count(),
    prisma.tenantSubscription.count({
      where: { status: 'ACTIVE' }
    }),
    prisma.tenantSubscription.count({
      where: { status: 'TRIAL' }
    }),
    prisma.tenantSubscription.count({
      where: { status: 'PAST_DUE' }
    }),
    prisma.tenantSubscription.count({
      where: { status: 'CANCELED' }
    }),
    prisma.tenant.groupBy({
      by: ['planType'],
      _count: {
        planType: true
      },
      where: {
        active: true
      }
    })
  ])

  return {
    total: totalSubscriptions,
    active: activeSubscriptions,
    trial: trialSubscriptions,
    pastDue: pastDueSubscriptions,
    canceled: canceledSubscriptions,
    byPlan: subscriptionsByPlan.reduce((acc, item) => {
      acc[item.planType] = item._count.planType
      return acc
    }, {} as Record<string, number>)
  }
}

async function getTenantStats() {
  const [
    totalTenants,
    activeTenants,
    newTenantsThisMonth,
    tenantsByStatus
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({
      where: { active: true }
    }),
    prisma.tenant.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.tenant.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        subscriptionStatus: true
      }
    })
  ])

  return {
    total: totalTenants,
    active: activeTenants,
    newThisMonth: newTenantsThisMonth,
    byStatus: tenantsByStatus.reduce((acc, item) => {
      acc[item.subscriptionStatus || 'NONE'] = item._count.subscriptionStatus
      return acc
    }, {} as Record<string, number>)
  }
}

async function getRevenueData() {
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const lastMonth = new Date(currentMonth)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const [
    currentMonthRevenue,
    lastMonthRevenue,
    totalRevenue,
    revenueByPlan
  ] = await Promise.all([
    prisma.subscriptionInvoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: currentMonth
        }
      },
      _sum: {
        amountPaid: true
      }
    }),
    prisma.subscriptionInvoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: lastMonth,
          lt: currentMonth
        }
      },
      _sum: {
        amountPaid: true
      }
    }),
    prisma.subscriptionInvoice.aggregate({
      where: {
        status: 'PAID'
      },
      _sum: {
        amountPaid: true
      }
    }),
    prisma.$queryRaw`
      SELECT t.planType, SUM(si.amountPaid) as revenue
      FROM SubscriptionInvoice si
      JOIN TenantSubscription ts ON si.subscriptionId = ts.id
      JOIN Tenant t ON ts.tenantId = t.id
      WHERE si.status = 'PAID'
      GROUP BY t.planType
    `
  ])

  return {
    currentMonth: currentMonthRevenue._sum.amountPaid || 0,
    lastMonth: lastMonthRevenue._sum.amountPaid || 0,
    total: totalRevenue._sum.amountPaid || 0,
    byPlan: revenueByPlan,
    growth: lastMonthRevenue._sum.amountPaid ? 
      ((currentMonthRevenue._sum.amountPaid || 0) - (lastMonthRevenue._sum.amountPaid || 0)) / (lastMonthRevenue._sum.amountPaid || 1) * 100 : 0
  }
}

async function getRecentActivity() {
  const [
    recentTenants,
    recentSubscriptions,
    recentInvoices
  ] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        planType: true,
        subscriptionStatus: true,
        createdAt: true,
        active: true
      }
    }),
    prisma.tenantSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            planType: true
          }
        }
      }
    }),
    prisma.subscriptionInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        subscription: {
          include: {
            tenant: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })
  ])

  return {
    tenants: recentTenants,
    subscriptions: recentSubscriptions,
    invoices: recentInvoices
  }
}

async function getRecentEvents() {
  const events = await prisma.subscriptionEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      eventType: true,
      processed: true,
      createdAt: true,
      processedAt: true,
      stripeEventId: true
    }
  })

  return events
}