import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Create a test customer
    const testCustomer = await prisma.customer.upsert({
      where: { email: 'test@student.com' },
      update: {},
      create: {
        firstName: 'Test',
        lastName: 'Student',
        email: 'test@student.com',
        phone: '01234567890',
        company: 'ACME Test Company',
        city: 'Newton Abbot',
        postcode: 'TQ12 1AA'
      }
    })

    // Get the first 4 courses to create achievements for
    const courses = await prisma.course.findMany({
      take: 4,
      orderBy: { createdAt: 'asc' }
    })

    if (courses.length === 0) {
      return NextResponse.json(
        { error: 'No courses found' },
        { status: 400 }
      )
    }

    // Create achievements directly in the Achievement table
    for (const course of courses) {
      await prisma.achievement.upsert({
        where: {
          customerId_courseId: {
            customerId: testCustomer.id,
            courseId: course.id
          }
        },
        update: {
          level: 'GOLD', // 4 courses = Gold level
          category: course.category
        },
        create: {
          customerId: testCustomer.id,
          courseId: course.id,
          level: 'GOLD',
          category: course.category
        }
      })
    }

    // Create another elite test student
    const eliteCustomer = await prisma.customer.upsert({
      where: { email: 'elite@student.com' },
      update: {},
      create: {
        firstName: 'Elite',
        lastName: 'Master',
        email: 'elite@student.com',
        phone: '01234567891',
        company: 'Master Training Ltd',
        city: 'Exeter',
        postcode: 'EX1 1AA'
      }
    })

    // Get 6 courses for elite student
    const moreCourses = await prisma.course.findMany({
      take: 6,
      orderBy: { createdAt: 'asc' }
    })

    for (const course of moreCourses) {
      await prisma.achievement.upsert({
        where: {
          customerId_courseId: {
            customerId: eliteCustomer.id,
            courseId: course.id
          }
        },
        update: {
          level: 'ELITE', // 6 courses = Elite level
          category: course.category
        },
        create: {
          customerId: eliteCustomer.id,
          courseId: course.id,
          level: 'ELITE',
          category: course.category
        }
      })
    }

    // Create a bronze level student
    const bronzeCustomer = await prisma.customer.upsert({
      where: { email: 'bronze@student.com' },
      update: {},
      create: {
        firstName: 'Bronze',
        lastName: 'Beginner',
        email: 'bronze@student.com',
        phone: '01234567892',
        company: 'Starting Out Ltd',
        city: 'Plymouth',
        postcode: 'PL1 1AA'
      }
    })

    // Just 1 course for bronze
    const firstCourse = courses[0]
    await prisma.achievement.upsert({
      where: {
        customerId_courseId: {
          customerId: bronzeCustomer.id,
          courseId: firstCourse.id
        }
      },
      update: {
        level: 'BRONZE',
        category: firstCourse.category
      },
      create: {
        customerId: bronzeCustomer.id,
        courseId: firstCourse.id,
        level: 'BRONZE',
        category: firstCourse.category
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Test data created successfully',
      testEmails: [
        'test@student.com (Gold - 4 courses)',
        'elite@student.com (Elite - 6 courses)', 
        'bronze@student.com (Bronze - 1 course)'
      ]
    })

  } catch (error) {
    console.error('Error creating test data:', error)
    return NextResponse.json(
      { error: `Failed to create test data: ${error.message}` },
      { status: 500 }
    )
  }
}