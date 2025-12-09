import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET endpoint to retrieve recent upgrade activities
export async function GET(request: NextRequest) {
  try {
    // Get recent upgrades by checking tenant update history
    // In a real system, you'd have a dedicated upgrades/activities table
    // For now, we'll look for recent tenant plan changes
    
    const recentUpgrades = await prisma.tenant.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        planType: true,
        maxCourses: true,
        maxStudents: true,
        updatedAt: true,
        createdAt: true,
        _count: {
          select: {
            courses: true,
            customers: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    })

    // Filter for likely upgrades (where updatedAt is significantly after createdAt)
    const upgradeActivities = recentUpgrades.filter(tenant => {
      const daysBetween = (tenant.updatedAt.getTime() - tenant.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return daysBetween > 1 // Only show if updated more than 1 day after creation
    }).map(tenant => ({
      id: `upgrade-${tenant.id}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      currentPlan: tenant.planType,
      maxCourses: tenant.maxCourses,
      maxStudents: tenant.maxStudents,
      currentCourses: tenant._count.courses,
      currentStudents: tenant._count.customers,
      upgradedAt: tenant.updatedAt,
      type: 'upgrade'
    }))

    // Get plan statistics
    const planStats = await prisma.tenant.groupBy({
      by: ['planType'],
      _count: {
        planType: true
      }
    })

    const stats = {
      totalTenants: await prisma.tenant.count(),
      recentUpgrades: upgradeActivities.length,
      planDistribution: planStats.reduce((acc, stat) => {
        acc[stat.planType] = stat._count.planType
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      upgrades: upgradeActivities,
      stats
    })

  } catch (error) {
    console.error('Error fetching upgrade activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upgrade activities' },
      { status: 500 }
    )
  }
}