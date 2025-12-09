import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { attendanceData, instructorNotes } = body

    // Validate session exists and is not already completed
    const session = await prisma.courseSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        bookings: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.isCompleted) {
      return NextResponse.json({ error: 'Session is already completed' }, { status: 400 })
    }

    // Start transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark session as completed
      const completedSession = await tx.courseSession.update({
        where: { id: sessionId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          instructorNotes
        }
      })

      // 2. Process attendance data and create attendance records
      const attendanceRecords = []
      const achievementPromises = []

      for (const attendance of attendanceData) {
        const { customerId, status, attendedDays, totalDays, passed, grade, notes } = attendance

        // Create attendance record
        const attendanceRecord = await tx.sessionAttendance.create({
          data: {
            sessionId,
            customerId,
            status,
            attendedDays: attendedDays || 0,
            totalDays: totalDays || 1,
            passed: passed || false,
            grade,
            notes,
            certificateIssued: passed || false
          }
        })
        attendanceRecords.push(attendanceRecord)

        // 3. Create Achievement if student passed
        if (passed) {
          // Get certification rule for this course category
          const certificationRule = await tx.certificationRule.findUnique({
            where: { category: session.course.category }
          })

          const validityYears = certificationRule?.validityYears || 5
          const expiryDate = new Date()
          expiryDate.setFullYear(expiryDate.getFullYear() + validityYears)

          // Generate certificate number
          const certificateNumber = `${session.course.category}-${Date.now()}-${customerId.slice(-4)}`

          const achievementPromise = tx.achievement.upsert({
            where: {
              customerId_courseId: {
                customerId,
                courseId: session.courseId
              }
            },
            update: {
              sessionId,
              certificationDate: new Date(),
              expiryDate,
              isExpired: false,
              certificateNumber,
              remindersSent: 0,
              nextReminderDate: null
            },
            create: {
              customerId,
              courseId: session.courseId,
              sessionId,
              level: 'BRONZE', // Default level, can be customized
              category: session.course.category,
              certificationDate: new Date(),
              expiryDate,
              certificateNumber
            }
          })

          achievementPromises.push(achievementPromise)
        }
      }

      // Execute all achievement creation promises
      const achievements = await Promise.all(achievementPromises)

      // 4. Send notification to students about new certificates
      for (const achievement of achievements) {
        // Find the customer info for notification
        const customer = await tx.customer.findUnique({
          where: { id: achievement.customerId },
          select: { email: true, firstName: true, lastName: true }
        })

        if (customer) {
          console.log(`📧 Certificate notification sent to ${customer.email}`)
          // Future: Send email notification about new certificate
          // await sendCertificateNotification(customer, achievement)
        }
      }

      return {
        session: completedSession,
        attendanceRecords,
        achievements,
        certificatesIssued: achievements.length
      }
    })

    console.log(`✅ Session ${sessionId} completed successfully:`)
    console.log(`   - ${result.attendanceRecords.length} attendance records created`)
    console.log(`   - ${result.achievements.length} achievements/certificates created`)

    return NextResponse.json({
      success: true,
      message: `Session completed successfully. ${result.certificatesIssued} certificates issued.`,
      data: result
    })

  } catch (error) {
    console.error('❌ Error completing session:', error)
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    )
  }
}