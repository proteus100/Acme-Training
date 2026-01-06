import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../lib/auth'

const prisma = new PrismaClient()

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
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')

    // Build where clause based on filters
    let whereClause: any = {
      tenantId: admin.tenantId // Proper tenant isolation
    }

    if (status) {
      switch (status) {
        case 'active':
          whereClause.isExpired = false
          break
        case 'expired':
          whereClause.isExpired = true
          break
        case 'expiring':
          // Expiring within 90 days
          const ninetyDaysFromNow = new Date()
          ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
          whereClause = {
            tenantId: admin.tenantId, // Must include tenant filter when using complex where
            isExpired: false,
            expiryDate: {
              lte: ninetyDaysFromNow
            }
          }
          break
      }
    }

    if (category && category !== 'all') {
      whereClause.category = category
    }

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            title: true,
            category: true
          }
        }
      },
      orderBy: [
        { isExpired: 'asc' },
        { expiryDate: 'asc' }
      ]
    })

    // Transform data to match the interface expected by the frontend
    const certifications = achievements.map(achievement => ({
      id: achievement.id,
      customer: achievement.customer,
      course: achievement.course,
      certificationDate: achievement.certificationDate.toISOString(),
      expiryDate: achievement.expiryDate?.toISOString() || null,
      isExpired: achievement.isExpired,
      remindersSent: achievement.remindersSent,
      nextReminderDate: achievement.nextReminderDate?.toISOString() || null,
      certificateNumber: achievement.certificateNumber
    }))

    return NextResponse.json(certifications)

  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certifications' }, 
      { status: 500 }
    )
  }
}