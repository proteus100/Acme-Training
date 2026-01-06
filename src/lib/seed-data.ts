import { PrismaClient, CourseCategory } from '../generated/prisma'

const prisma = new PrismaClient()

export async function seedCourses() {
  const courses = [
    // Gas Safe Training
    {
      title: "Gas Safe Registration Training",
      description: "Complete gas safety training for new gas engineers covering installation, maintenance, and safety procedures.",
      category: CourseCategory.GAS_SAFE,
      duration: 40,
      price: 850.00,
      maxStudents: 12
    },
    {
      title: "Gas Cooker Installation & Service",
      description: "Specialized training for gas cooker installation, servicing, and repair techniques.",
      category: CourseCategory.GAS_SAFE,
      duration: 16,
      price: 420.00,
      maxStudents: 10
    },
    {
      title: "Gas Fire Training & Testing",
      description: "Comprehensive course covering gas fire installation, testing, and maintenance procedures.",
      category: CourseCategory.GAS_SAFE,
      duration: 24,
      price: 580.00,
      maxStudents: 12
    },
    
    // Heat Pump Training
    {
      title: "Heat Pump Installation Foundation",
      description: "Essential training for heat pump installation covering system design and installation best practices.",
      category: CourseCategory.HEAT_PUMP,
      duration: 32,
      price: 750.00,
      maxStudents: 8
    },
    {
      title: "Heat Pump Servicing & Maintenance",
      description: "Advanced course on heat pump servicing, troubleshooting, and maintenance procedures.",
      category: CourseCategory.HEAT_PUMP,
      duration: 24,
      price: 650.00,
      maxStudents: 10
    },
    
    // OFTEC Oil Qualifications
    {
      title: "OFTEC Pressure Jet Boiler Training",
      description: "OFTEC approved training for pressure jet boiler installation and maintenance.",
      category: CourseCategory.OFTEC,
      duration: 40,
      price: 890.00,
      maxStudents: 12
    },
    {
      title: "Vaporizing Appliances (AGA, Rayburn, Esse)",
      description: "Specialized training for vaporizing appliances including AGA, Rayburn, and Esse systems.",
      category: CourseCategory.VAPORIZING,
      duration: 24,
      price: 620.00,
      maxStudents: 8
    },
    
    // LPG Training
    {
      title: "LPG Permanent Installation",
      description: "LPG training covering permanent installations in residential and commercial properties.",
      category: CourseCategory.LPG,
      duration: 32,
      price: 720.00,
      maxStudents: 12
    },
    {
      title: "Mobile & Park Home LPG Systems",
      description: "Specialized LPG training for mobile homes, park homes, and leisure vehicles.",
      category: CourseCategory.LPG,
      duration: 24,
      price: 580.00,
      maxStudents: 10
    },
    {
      title: "Widney Fire LPG Installation",
      description: "Training focused on Widney fire LPG installations and maintenance.",
      category: CourseCategory.LPG,
      duration: 16,
      price: 450.00,
      maxStudents: 8
    }
  ]

  for (const courseData of courses) {
    await prisma.course.upsert({
      where: { title: courseData.title },
      update: {},
      create: courseData
    })
  }
}

export async function seedSessions() {
  const courses = await prisma.course.findMany()
  
  // Create sessions for the next 3 months
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3)
  
  for (const course of courses) {
    // Create 2-3 sessions per course over the next 3 months
    const sessionCount = Math.floor(Math.random() * 2) + 2 // 2-3 sessions
    
    for (let i = 0; i < sessionCount; i++) {
      const sessionStart = new Date(startDate)
      sessionStart.setDate(startDate.getDate() + (Math.floor(Math.random() * 90) + 7)) // 7-97 days from now
      
      const sessionEnd = new Date(sessionStart)
      if (course.duration <= 8) {
        // Single day course
        sessionEnd.setDate(sessionStart.getDate())
      } else if (course.duration <= 16) {
        // 2 day course
        sessionEnd.setDate(sessionStart.getDate() + 1)
      } else if (course.duration <= 24) {
        // 3 day course
        sessionEnd.setDate(sessionStart.getDate() + 2)
      } else {
        // 5 day course (1 week)
        sessionEnd.setDate(sessionStart.getDate() + 4)
      }
      
      await prisma.courseSession.create({
        data: {
          courseId: course.id,
          startDate: sessionStart,
          endDate: sessionEnd,
          startTime: "09:00",
          endTime: "17:00",
          availableSpots: course.maxStudents,
          bookedSpots: 0,
          isActive: true
        }
      })
    }
  }
}

export async function seedDatabase() {
  try {
    console.log('Seeding courses...')
    await seedCourses()
    
    console.log('Seeding sessions...')
    await seedSessions()
    
    console.log('Database seeding completed!')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}