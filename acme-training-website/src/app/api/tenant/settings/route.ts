import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

// GET /api/tenant/settings - Get tenant settings for current admin's tenant
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!admin.tenantId) {
      return NextResponse.json(
        { error: 'No tenant associated with this admin' },
        { status: 400 }
      )
    }

    // Get or create tenant settings
    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: admin.tenantId }
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: admin.tenantId,
          minSessionAttendees: 4,
          bookingWindowDays: 30,
          cancellationHours: 24,
          depositPercentage: 0.3
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching tenant settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant settings' },
      { status: 500 }
    )
  }
}

// PUT /api/tenant/settings - Update tenant settings
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!admin.tenantId) {
      return NextResponse.json(
        { error: 'No tenant associated with this admin' },
        { status: 400 }
      )
    }

    const data = await request.json()

    // Validate data
    if (data.minSessionAttendees !== undefined) {
      if (data.minSessionAttendees < 1 || data.minSessionAttendees > 50) {
        return NextResponse.json(
          { error: 'Minimum session attendees must be between 1 and 50' },
          { status: 400 }
        )
      }
    }

    if (data.depositPercentage !== undefined) {
      if (data.depositPercentage < 0 || data.depositPercentage > 1) {
        return NextResponse.json(
          { error: 'Deposit percentage must be between 0 and 1' },
          { status: 400 }
        )
      }
    }

    // Update settings
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: admin.tenantId },
      update: {
        minSessionAttendees: data.minSessionAttendees,
        bookingWindowDays: data.bookingWindowDays,
        cancellationHours: data.cancellationHours,
        depositPercentage: data.depositPercentage
      },
      create: {
        tenantId: admin.tenantId,
        minSessionAttendees: data.minSessionAttendees ?? 4,
        bookingWindowDays: data.bookingWindowDays ?? 30,
        cancellationHours: data.cancellationHours ?? 24,
        depositPercentage: data.depositPercentage ?? 0.3
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant settings' },
      { status: 500 }
    )
  }
}
