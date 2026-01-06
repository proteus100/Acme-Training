import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../../../lib/auth'
import { sendCertificationReminder } from '../../../../../../lib/email-service'

const prisma = new PrismaClient()

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const admin = await getAdminFromRequest(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    // Find the achievement/certification
    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        customer: true,
        course: true
      }
    })

    if (!achievement) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Send reminder email
    await sendCertificationReminder(achievement)

    // Update reminder count and next reminder date
    const now = new Date()
    let nextReminderDate: Date | null = null
    
    // Calculate next reminder date (30 days from now if not expired)
    if (achievement.expiryDate && !achievement.isExpired) {
      nextReminderDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
    }

    await prisma.achievement.update({
      where: { id },
      data: {
        remindersSent: achievement.remindersSent + 1,
        nextReminderDate
      }
    })

    // Create reminder record
    await prisma.certificationReminder.create({
      data: {
        tenantId: achievement.tenantId,
        achievementId: id,
        reminderType: 'CUSTOM',
        scheduledFor: now,
        sentAt: now,
        emailSent: true,
        emailSubject: `Certification Renewal Reminder - ${achievement.course.title}`,
        emailContent: 'Manual reminder sent by admin'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully' 
    })

  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' }, 
      { status: 500 }
    )
  }
}