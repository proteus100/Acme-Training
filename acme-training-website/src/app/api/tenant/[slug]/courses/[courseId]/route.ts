import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; courseId: string }> }
) {
  try {
    const { slug, courseId } = await params
    
    // Find the tenant first
    const tenant = await prisma.tenant.findFirst({
      where: { slug, active: true }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if course exists and belongs to this tenant
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sessions: {
          include: {
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'PENDING']
                }
              }
            }
          }
        }
      }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' }, 
        { status: 404 }
      )
    }

    // Verify course belongs to this tenant
    if (existingCourse.tenantId !== tenant.id) {
      return NextResponse.json(
        { success: false, error: 'Course not found' }, 
        { status: 404 }
      )
    }

    // Check if course has active bookings
    const activeBookings = existingCourse.sessions.reduce((total, session) => {
      return total + session.bookings.length
    }, 0)

    if (activeBookings > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete course with active bookings',
          activeBookings: activeBookings
        },
        { status: 409 }
      )
    }

    // Delete course (this will cascade delete sessions)
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json(
      { success: true, message: 'Course deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' }, 
      { status: 500 }
    )
  }
}