import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting quick database seeding...')
    
    // Create a few sample courses
    const courses = [
      {
        title: 'ACS CORE & 4 REA',
        description: 'Gas safety reassessment for core competencies and 4 appliances. Run by engineers for engineers.',
        category: 'GAS_SAFE',
        duration: 16,
        price: 650.00,
        maxStudents: 12
      },
      {
        title: 'ACS CORE & 4 INITIAL',
        description: 'Initial gas safety assessment for core competencies and 4 appliances. Complete certification course.',
        category: 'GAS_SAFE', 
        duration: 40,
        price: 995.00,
        maxStudents: 12
      },
      {
        title: 'LPG PD/RPH REA',
        description: 'LPG Permanent Dwellings and Residential Park Homes reassessment.',
        category: 'LPG',
        duration: 16,
        price: 300.00,
        maxStudents: 12
      },
      {
        title: 'Air Source Heat Pump',
        description: 'Air source heat pump installation, commissioning and maintenance training.',
        category: 'HEAT_PUMP',
        duration: 32,
        price: 650.00,
        maxStudents: 10
      },
      {
        title: 'OFTEC REA',
        description: 'OFTEC oil heating reassessment for qualified technicians.',
        category: 'OFTEC',
        duration: 16,
        price: 600.00,
        maxStudents: 12
      }
    ]
    
    // Insert courses
    for (const course of courses) {
      await prisma.course.create({
        data: course
      })
      console.log(`✅ Created course: ${course.title}`)
    }
    
    // Create some sample sessions
    const allCourses = await prisma.course.findMany()
    
    for (const course of allCourses) {
      // Create 2 upcoming sessions for each course
      const session1Date = new Date()
      session1Date.setDate(session1Date.getDate() + 7) // Next week
      
      const session2Date = new Date()
      session2Date.setDate(session2Date.getDate() + 21) // In 3 weeks
      
      await prisma.courseSession.create({
        data: {
          courseId: course.id,
          startDate: session1Date,
          endDate: session1Date,
          startTime: '09:00',
          endTime: '17:00',
          availableSpots: course.maxStudents,
          bookedSpots: Math.floor(Math.random() * 4), // 0-3 random bookings
          isActive: true
        }
      })
      
      await prisma.courseSession.create({
        data: {
          courseId: course.id,
          startDate: session2Date,
          endDate: session2Date,
          startTime: '09:00',
          endTime: '17:00',
          availableSpots: course.maxStudents,
          bookedSpots: Math.floor(Math.random() * 6), // 0-5 random bookings
          isActive: true
        }
      })
      
      console.log(`✅ Created 2 sessions for: ${course.title}`)
    }
    
    console.log('🎉 Database seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()