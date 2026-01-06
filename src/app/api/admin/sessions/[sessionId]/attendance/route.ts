import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // Get session with bookings and attendance data
    const session = await prisma.courseSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            duration: true
          }
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true
              }
            }
          }
        },
        attendance: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Calculate session duration in days
    const startDate = new Date(session.startDate)
    const endDate = new Date(session.endDate)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Prepare attendance data for each booked student
    const attendanceData = session.bookings.map(booking => {
      // Find existing attendance record
      const existingAttendance = session.attendance.find(att => att.customerId === booking.customerId)
      
      return {
        customerId: booking.customerId,
        customer: booking.customer,
        bookingId: booking.id,
        attendance: existingAttendance || {
          status: 'REGISTERED',
          attendedDays: 0,
          totalDays,
          passed: false,
          grade: null,
          notes: null,
          certificateIssued: false
        }
      }
    })

    return NextResponse.json({
      session: {
        id: session.id,
        course: session.course,
        startDate: session.startDate,
        endDate: session.endDate,
        startTime: session.startTime,
        endTime: session.endTime,
        isCompleted: session.isCompleted,
        completedAt: session.completedAt,
        instructorNotes: session.instructorNotes
      },
      totalDays,
      attendanceData
    })

  } catch (error) {
    console.error('Error fetching session attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session attendance' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { attendance } = await request.json()

    // Update or create attendance records
    const results = await Promise.all(
      attendance.map(async (att: any) => {
        return await prisma.sessionAttendance.upsert({
          where: {
            sessionId_customerId: {
              sessionId,
              customerId: att.customerId
            }
          },
          update: {
            status: att.status,
            attendedDays: att.attendedDays,
            totalDays: att.totalDays,
            passed: att.passed,
            grade: att.grade,
            notes: att.notes
          },
          create: {
            sessionId,
            customerId: att.customerId,
            status: att.status,
            attendedDays: att.attendedDays,
            totalDays: att.totalDays,
            passed: att.passed,
            grade: att.grade,
            notes: att.notes
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully',
      records: results.length
    })

  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}