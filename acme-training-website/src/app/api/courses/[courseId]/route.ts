import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        sessions: {
          where: {
            isActive: true
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' }, 
      { status: 500 }
    )
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.title || !data.description || !data.category || !data.duration || !data.price) {
      return NextResponse.json(
        { error: 'Title, description, category, duration, and price are required' },
        { status: 400 }
      )
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: params.courseId }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' }, 
        { status: 404 }
      )
    }

    // Check if title is taken by another course
    if (data.title !== existingCourse.title) {
      const titleTaken = await prisma.course.findFirst({
        where: { 
          title: data.title,
          NOT: { id: params.courseId }
        }
      })

      if (titleTaken) {
        return NextResponse.json(
          { error: 'Course title already in use' },
          { status: 409 }
        )
      }
    }

    // Validate category
    const validCategories = [
      'GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG', 'VAPORIZING', 'WATER',
      'FGAS_AIR_CONDITIONING', 'COMMERCIAL_CATERING', 'COMMERCIAL_LAUNDRY',
      'COMMERCIAL_GAS', 'COMMERCIAL_CORE', 'ELECTRICAL', 'REFRIGERATION', 'CUSTOM'
    ]
    if (!validCategories.includes(data.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (data.duration <= 0 || data.price < 0 || (data.maxStudents && data.maxStudents <= 0)) {
      return NextResponse.json(
        { error: 'Duration must be positive, price cannot be negative, maxStudents must be positive' },
        { status: 400 }
      )
    }

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        duration: parseInt(data.duration),
        price: parseFloat(data.price),
        maxStudents: data.maxStudents ? parseInt(data.maxStudents) : 12
      },
      include: {
        sessions: {
          where: {
            isActive: true
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: params.courseId },
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
        { error: 'Course not found' }, 
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
          error: 'Cannot delete course with active bookings',
          activeBookings: activeBookings
        },
        { status: 409 }
      )
    }

    // Delete course (this will cascade delete sessions)
    await prisma.course.delete({
      where: { id: params.courseId }
    })

    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' }, 
      { status: 500 }
    )
  }
}