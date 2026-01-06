import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../../../lib/auth'
import { sendCertificateEmail } from '../../../../../../lib/email-service'

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

    // Get request body
    const body = await request.json()
    const { subject, message } = body

    // Find the achievement/certification
    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        customer: true,
        course: true,
        tenant: true
      }
    })

    if (!achievement) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Extract certificate information from certificateNumber field (where we stored it)
    let certificateInfo = null
    try {
      if (achievement.certificateNumber && achievement.certificateNumber.startsWith('{')) {
        certificateInfo = JSON.parse(achievement.certificateNumber)
      }
    } catch (e) {
      // If it's not JSON, it's probably just a certificate number
      certificateInfo = { certificateNumber: achievement.certificateNumber }
    }

    // Send certificate email
    await sendCertificateEmail({
      achievement,
      subject: subject || `Your ${achievement.course.title} Certificate`,
      message: message || `Dear ${achievement.customer.firstName},\n\nPlease find attached your certificate for the ${achievement.course.title} course.\n\nCongratulations on completing the training!\n\nBest regards,\n${achievement.tenant.name}`,
      certificateInfo
    })

    return NextResponse.json({
      success: true,
      message: 'Certificate emailed successfully'
    })

  } catch (error) {
    console.error('Error emailing certificate:', error)
    return NextResponse.json(
      { error: 'Failed to email certificate' },
      { status: 500 }
    )
  }
}