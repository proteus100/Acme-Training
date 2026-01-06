import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Plan limits configuration
const PLAN_LIMITS = {
  STARTER: { maxStudents: 50, maxCourses: 5 },
  PROFESSIONAL: { maxStudents: 150, maxCourses: 15 },
  ENTERPRISE: { maxStudents: 999999, maxCourses: 999999 }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { newPlan } = body

    // Validate the new plan
    if (!newPlan || !['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(newPlan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      include: {
        _count: {
          select: {
            courses: true,
            customers: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if it's actually an upgrade
    const currentPlanOrder = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE']
    const currentPlanIndex = currentPlanOrder.indexOf(tenant.planType)
    const newPlanIndex = currentPlanOrder.indexOf(newPlan)

    if (newPlanIndex <= currentPlanIndex) {
      return NextResponse.json(
        { success: false, error: 'Plan downgrades must be handled through support' },
        { status: 400 }
      )
    }

    // Get the new plan limits
    const newLimits = PLAN_LIMITS[newPlan as keyof typeof PLAN_LIMITS]

    // In a real application, this is where you would:
    // 1. Integrate with payment processor (Stripe, PayPal, etc.)
    // 2. Create/update subscription
    // 3. Handle payment processing
    // 4. Only update the database after successful payment

    // For now, we'll simulate a successful upgrade
    // In production, this would be done after payment confirmation via webhook

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        planType: newPlan,
        maxStudents: newLimits.maxStudents,
        maxCourses: newLimits.maxCourses,
        updatedAt: new Date()
      }
    })

    // Log the upgrade for audit purposes
    console.log(`Plan upgrade: Tenant ${tenant.name} (${tenant.slug}) upgraded from ${tenant.planType} to ${newPlan}`)

    // In a real application, you might also:
    // - Send confirmation email to tenant
    // - Update billing records
    // - Notify the main admin
    // - Create audit log entry

    return NextResponse.json({
      success: true,
      message: 'Plan upgraded successfully',
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        planType: updatedTenant.planType,
        maxStudents: updatedTenant.maxStudents,
        maxCourses: updatedTenant.maxCourses
      }
    })

  } catch (error) {
    console.error('Error upgrading tenant plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upgrade plan' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve upgrade options for a tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        name: true,
        planType: true,
        maxStudents: true,
        maxCourses: true,
        _count: {
          select: {
            courses: true,
            customers: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Determine available upgrade options
    const currentPlanOrder = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE']
    const currentPlanIndex = currentPlanOrder.indexOf(tenant.planType)
    const availableUpgrades = currentPlanOrder.slice(currentPlanIndex + 1)

    const upgradeOptions = availableUpgrades.map(plan => ({
      plan,
      ...PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
      monthlyPrice: plan === 'PROFESSIONAL' ? 49 : plan === 'ENTERPRISE' ? 149 : 29
    }))

    return NextResponse.json({
      success: true,
      currentPlan: {
        type: tenant.planType,
        maxStudents: tenant.maxStudents,
        maxCourses: tenant.maxCourses,
        currentStudents: tenant._count.customers,
        currentCourses: tenant._count.courses
      },
      availableUpgrades: upgradeOptions
    })

  } catch (error) {
    console.error('Error fetching upgrade options:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upgrade options' },
      { status: 500 }
    )
  }
}