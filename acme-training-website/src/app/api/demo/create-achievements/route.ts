import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateStudentAchievements } from '@/lib/achievements'

export async function POST() {
  try {
    // Create demo customers if they don't exist
    const demoCustomers = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@demo.com',
        phone: '01234567890',
        completedCourses: 6 // Elite level
      },
      {
        firstName: 'Sarah',
        lastName: 'Jones', 
        email: 'sarah.jones@demo.com',
        phone: '01234567891',
        completedCourses: 5 // Gold level
      },
      {
        firstName: 'Mike',
        lastName: 'Thompson',
        email: 'mike.thompson@demo.com',
        phone: '01234567892',
        completedCourses: 4 // Gold level
      },
      {
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@demo.com',
        phone: '01234567893',
        completedCourses: 3 // Silver level
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@demo.com', 
        phone: '01234567894',
        completedCourses: 2 // Silver level
      }
    ]

    // Get some courses to assign achievements to
    const allCourses = await prisma.course.findMany({
      take: 20
    })

    if (allCourses.length === 0) {
      return NextResponse.json(
        { error: 'No courses found. Please create courses first.' },
        { status: 400 }
      )
    }

    // Create customers and their achievements
    for (const customerData of demoCustomers) {
      // Create or update customer
      const customer = await prisma.customer.upsert({
        where: { email: customerData.email },
        update: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phone: customerData.phone
        },
        create: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone
        }
      })

      // Create some course sessions for this customer
      const coursesToComplete = allCourses.slice(0, customerData.completedCourses)
      
      for (let i = 0; i < coursesToComplete.length; i++) {
        const course = coursesToComplete[i]
        
        // Find or create a session for this course
        let session = await prisma.courseSession.findFirst({
          where: { courseId: course.id }
        })
        
        if (!session) {
          // Create a session if none exists
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - (30 - i * 5)) // Spread sessions over past month
          
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + 1)
          
          session = await prisma.courseSession.create({
            data: {
              courseId: course.id,
              startDate,
              endDate,
              startTime: '09:00',
              endTime: '17:00',
              availableSpots: 12,
              bookedSpots: 1
            }
          })
        }

        // Check if booking already exists
        const existingBooking = await prisma.booking.findFirst({
          where: {
            customerId: customer.id,
            sessionId: session.id
          }
        })

        if (!existingBooking) {
          // Create a completed booking
          await prisma.booking.create({
            data: {
              customerId: customer.id,
              sessionId: session.id,
              status: 'COMPLETED',
              totalAmount: course.price
            }
          })
        } else {
          // Update existing booking to completed
          await prisma.booking.update({
            where: { id: existingBooking.id },
            data: { status: 'COMPLETED' }
          })
        }
      }

      // Update achievements for this customer
      await updateStudentAchievements(customer.id)
    }

    return NextResponse.json({ 
      success: true,
      message: `Created demo achievements for ${demoCustomers.length} students`
    })

  } catch (error) {
    console.error('Error creating demo achievements:', error)
    return NextResponse.json(
      { error: 'Failed to create demo achievements' },
      { status: 500 }
    )
  }
}