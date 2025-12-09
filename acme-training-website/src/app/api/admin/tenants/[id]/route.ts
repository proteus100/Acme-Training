import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            customers: true,
            courses: true,
            bookings: true
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

    return NextResponse.json({
      success: true,
      tenant
    })

  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Delete related records first (cascade delete)
    await prisma.$transaction(async (tx) => {
      // Delete tenant settings
      await tx.tenantSettings.deleteMany({
        where: { tenantId }
      })

      // Delete payments related to this tenant's bookings
      await tx.payment.deleteMany({
        where: {
          booking: {
            tenantId
          }
        }
      })

      // Delete session attendance records
      await tx.sessionAttendance.deleteMany({
        where: {
          booking: {
            tenantId
          }
        }
      })

      // Delete achievements
      await tx.achievement.deleteMany({
        where: {
          booking: {
            tenantId
          }
        }
      })

      // Delete bookings
      await tx.booking.deleteMany({
        where: { tenantId }
      })

      // Delete course sessions
      await tx.courseSession.deleteMany({
        where: {
          course: {
            tenantId
          }
        }
      })

      // Delete courses
      await tx.course.deleteMany({
        where: { tenantId }
      })

      // Delete customers
      await tx.customer.deleteMany({
        where: { tenantId }
      })

      // Finally, delete the tenant
      await tx.tenant.delete({
        where: { id: tenantId }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}