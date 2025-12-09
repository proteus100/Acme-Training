import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminFromRequest } from '@/lib/auth'

// POST /api/sessions/[id]/alert-students - Send low attendance alert to enrolled students
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session with bookings and enrolled students
    const session = await prisma.courseSession.findUnique({
      where: { id: params.id },
      include: {
        course: {
          include: {
            tenant: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if admin has permission (tenant-scoped)
    if (admin.tenantId && session.course.tenantId !== admin.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Session belongs to different tenant' },
        { status: 403 }
      )
    }

    const enrolledStudents = session.bookings

    if (enrolledStudents.length === 0) {
      return NextResponse.json(
        { error: 'No enrolled students to notify' },
        { status: 400 }
      )
    }

    // Format session dates
    const startDate = new Date(session.startDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const sessionTime = `${session.startTime} - ${session.endTime}`

    const tenantName = session.course.tenant?.name || 'Training Center'
    const contactEmail = session.course.tenant?.email || 'support@training.com'
    const contactPhone = session.course.tenant?.phone

    // Send email to each student
    const emailPromises = enrolledStudents.map(async (booking) => {
      const student = booking.customer

      // In a real implementation, you would send actual emails here
      // For now, we'll just log the email content
      console.log(`
========================================
EMAIL TO: ${student.email}
SUBJECT: Important: Training Session Update - Possible Rescheduling
----------------------------------------
Dear ${student.firstName} ${student.lastName},

We are writing to inform you about an important update regarding your upcoming training session:

Course: ${session.course.title}
Scheduled Date: ${startDate}
Time: ${sessionTime}

Due to current enrollment numbers, this session may need to be postponed or rescheduled to a future date. We are monitoring the situation closely and will contact you within the next few days with a definitive update.

Options available:
• If the session proceeds as scheduled, you will receive confirmation 48 hours before the start date
• If rescheduling is necessary, we will offer you alternative dates that suit your schedule
• Full refunds are available if the new dates don't work for you

We understand this may be inconvenient and apologize for any disruption to your plans. Our priority is to ensure you receive the best quality training experience with adequate class sizes.

What you need to do:
Please keep your ${startDate} available for now. We will contact you by [DATE] with final confirmation or rescheduling options.

If you have any questions or concerns, please don't hesitate to contact us:
Email: ${contactEmail}
${contactPhone ? `Phone: ${contactPhone}` : ''}

Thank you for your understanding and patience.

Best regards,
${tenantName} Training Team

----------------------------------------
Booking Reference: ${booking.id}
========================================
      `)

      // TODO: Replace with actual email sending service (SendGrid, AWS SES, etc.)
      // await sendEmail({
      //   to: student.email,
      //   subject: 'Important: Training Session Update - Possible Rescheduling',
      //   html: emailTemplate
      // })

      return {
        studentId: student.id,
        email: student.email,
        sent: true
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter(r => r.sent).length

    // Log the alert in the database (optional - you could create an AlertLog model)
    // await prisma.sessionAlert.create({
    //   data: {
    //     sessionId: session.id,
    //     alertType: 'LOW_ATTENDANCE',
    //     studentsNotified: successCount,
    //     sentBy: admin.id,
    //     sentAt: new Date()
    //   }
    // })

    return NextResponse.json({
      success: true,
      notifiedCount: successCount,
      message: `Successfully sent alerts to ${successCount} student(s)`
    })

  } catch (error) {
    console.error('Error sending student alerts:', error)
    return NextResponse.json(
      { error: 'Failed to send alerts to students' },
      { status: 500 }
    )
  }
}
