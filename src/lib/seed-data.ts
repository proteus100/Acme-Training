import { PrismaClient, CourseCategory } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedCourses() {
  const courses = [
    // GAS COURSES
    {
      title: "ACS CORE & 4 REA",
      description: "Gas safety reassessment for core competencies and 4 appliances. Run by engineers for engineers.",
      category: CourseCategory.GAS_SAFE,
      duration: 16,
      price: 650.00,
      maxStudents: 12
    },
    {
      title: "ACS CORE & 4 INITIAL",
      description: "Initial gas safety assessment for core competencies and 4 appliances. Complete certification course.",
      category: CourseCategory.GAS_SAFE,
      duration: 40,
      price: 995.00,
      maxStudents: 12
    },
    {
      title: "Gas Appliances Training",
      description: "Additional appliance training modules for gas engineers.",
      category: CourseCategory.GAS_SAFE,
      duration: 8,
      price: 150.00,
      maxStudents: 12
    },
    {
      title: "ERS Managed Learning Program",
      description: "Comprehensive managed learning program for gas engineering qualification.",
      category: CourseCategory.GAS_SAFE,
      duration: 120,
      price: 2350.00,
      maxStudents: 8
    },
    
    // LPG COURSES
    {
      title: "LPG PD/RPH REA",
      description: "LPG Permanent Dwellings and Residential Park Homes reassessment.",
      category: CourseCategory.LPG,
      duration: 16,
      price: 300.00,
      maxStudents: 12
    },
    {
      title: "LPG PD",
      description: "LPG Permanent Dwellings training course.",
      category: CourseCategory.LPG,
      duration: 8,
      price: 200.00,
      maxStudents: 12
    },
    {
      title: "LPG PD INITIAL",
      description: "LPG Permanent Dwellings initial assessment and certification.",
      category: CourseCategory.LPG,
      duration: 16,
      price: 250.00,
      maxStudents: 12
    },
    {
      title: "LPG PD/RPH INITIAL",
      description: "LPG Permanent Dwellings and Residential Park Homes initial assessment.",
      category: CourseCategory.LPG,
      duration: 24,
      price: 400.00,
      maxStudents: 12
    },
    {
      title: "LPG LAV REA",
      description: "LPG Leisure Accommodation Vehicles reassessment.",
      category: CourseCategory.LPG,
      duration: 8,
      price: 105.00,
      maxStudents: 12
    },
    {
      title: "LPG LAV INITIAL",
      description: "LPG Leisure Accommodation Vehicles initial assessment and certification.",
      category: CourseCategory.LPG,
      duration: 16,
      price: 155.00,
      maxStudents: 12
    },
    {
      title: "LPG HTRLP2",
      description: "LPG Caravan and Motor Caravan training course.",
      category: CourseCategory.LPG,
      duration: 8,
      price: 120.00,
      maxStudents: 12
    },
    
    // OIL COURSES
    {
      title: "OFTEC REA",
      description: "OFTEC oil heating reassessment for qualified technicians.",
      category: CourseCategory.OFTEC,
      duration: 16,
      price: 600.00,
      maxStudents: 12
    },
    {
      title: "OFTEC INITIAL",
      description: "OFTEC oil heating initial assessment and certification course.",
      category: CourseCategory.OFTEC,
      duration: 32,
      price: 800.00,
      maxStudents: 12
    },
    {
      title: "OFTEC 500E/600",
      description: "OFTEC 500E and 600 solid fuel training course.",
      category: CourseCategory.OFTEC,
      duration: 16,
      price: 310.00,
      maxStudents: 10
    },
    
    // WATER COURSES  
    {
      title: "Vented/Unvented REA",
      description: "Vented and unvented hot water systems reassessment.",
      category: CourseCategory.WATER,
      duration: 8,
      price: 185.00,
      maxStudents: 12
    },
    {
      title: "Vented/Unvented INITIAL",
      description: "Vented and unvented hot water systems initial certification.",
      category: CourseCategory.WATER,
      duration: 16,
      price: 210.00,
      maxStudents: 12
    },
    {
      title: "Legionella INITIAL",
      description: "Legionella risk assessment and control initial training.",
      category: CourseCategory.WATER,
      duration: 16,
      price: 200.00,
      maxStudents: 12
    },
    {
      title: "Legionella REA",
      description: "Legionella risk assessment and control reassessment.",
      category: CourseCategory.WATER,
      duration: 8,
      price: 185.00,
      maxStudents: 12
    },
    {
      title: "WRAS Training",
      description: "Water Regulations Advisory Scheme training course.",
      category: CourseCategory.WATER,
      duration: 16,
      price: 200.00,
      maxStudents: 12
    },
    {
      title: "NVQ Level 2 Plumbing/Heating",
      description: "NVQ Level 2 qualification in Plumbing and Heating.",
      category: CourseCategory.WATER,
      duration: 240,
      price: 3800.00,
      maxStudents: 8
    },
    
    // RENEWABLE COURSES
    {
      title: "Air Source Heat Pump",
      description: "Air source heat pump installation, commissioning and maintenance training.",
      category: CourseCategory.HEAT_PUMP,
      duration: 32,
      price: 650.00,
      maxStudents: 10
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
  
  // Define specific upcoming sessions with realistic dates
  const upcomingSessions = [
    // Week 1 (Sept 16-20)
    { courseTitle: "ACS CORE & 4 REA", date: "2024-09-16", duration: 2 },
    { courseTitle: "LPG PD", date: "2024-09-17", duration: 1 },
    { courseTitle: "Gas Appliances Training", date: "2024-09-18", duration: 1 },
    { courseTitle: "Vented/Unvented REA", date: "2024-09-19", duration: 1 },
    { courseTitle: "WRAS Training", date: "2024-09-20", duration: 2 },
    
    // Week 2 (Sept 23-27)
    { courseTitle: "OFTEC REA", date: "2024-09-23", duration: 2 },
    { courseTitle: "LPG LAV INITIAL", date: "2024-09-25", duration: 2 },
    { courseTitle: "Legionella REA", date: "2024-09-26", duration: 1 },
    { courseTitle: "Air Source Heat Pump", date: "2024-09-27", duration: 4 },
    
    // Week 3 (Sept 30 - Oct 4)
    { courseTitle: "ACS CORE & 4 INITIAL", date: "2024-09-30", duration: 5 },
    { courseTitle: "LPG PD/RPH REA", date: "2024-10-02", duration: 2 },
    { courseTitle: "OFTEC 500E/600", date: "2024-10-04", duration: 2 },
    
    // Week 4 (Oct 7-11)
    { courseTitle: "LPG PD INITIAL", date: "2024-10-07", duration: 2 },
    { courseTitle: "Vented/Unvented INITIAL", date: "2024-10-09", duration: 2 },
    { courseTitle: "LPG HTRLP2", date: "2024-10-10", duration: 1 },
    { courseTitle: "Legionella INITIAL", date: "2024-10-11", duration: 2 },
    
    // Week 5 (Oct 14-18)
    { courseTitle: "OFTEC INITIAL", date: "2024-10-14", duration: 4 },
    { courseTitle: "LPG LAV REA", date: "2024-10-16", duration: 1 },
    { courseTitle: "ACS CORE & 4 REA", date: "2024-10-17", duration: 2 },
    { courseTitle: "Air Source Heat Pump", date: "2024-10-18", duration: 4 },
    
    // Week 6 (Oct 21-25)
    { courseTitle: "LPG PD/RPH INITIAL", date: "2024-10-21", duration: 3 },
    { courseTitle: "Gas Appliances Training", date: "2024-10-23", duration: 1 },
    { courseTitle: "WRAS Training", date: "2024-10-24", duration: 2 },
    
    // Week 7 (Oct 28 - Nov 1)
    { courseTitle: "OFTEC REA", date: "2024-10-28", duration: 2 },
    { courseTitle: "Vented/Unvented REA", date: "2024-10-30", duration: 1 },
    { courseTitle: "LPG PD", date: "2024-10-31", duration: 1 },
    { courseTitle: "ACS CORE & 4 INITIAL", date: "2024-11-01", duration: 5 },
    
    // Week 8 (Nov 4-8)
    { courseTitle: "Air Source Heat Pump", date: "2024-11-04", duration: 4 },
    { courseTitle: "LPG LAV INITIAL", date: "2024-11-06", duration: 2 },
    { courseTitle: "Legionella REA", date: "2024-11-07", duration: 1 },
    { courseTitle: "OFTEC 500E/600", date: "2024-11-08", duration: 2 },
    
    // Week 9 (Nov 11-15)
    { courseTitle: "LPG PD INITIAL", date: "2024-11-11", duration: 2 },
    { courseTitle: "ACS CORE & 4 REA", date: "2024-11-13", duration: 2 },
    { courseTitle: "Vented/Unvented INITIAL", date: "2024-11-14", duration: 2 }
  ]
  
  for (const sessionData of upcomingSessions) {
    const course = courses.find(c => c.title === sessionData.courseTitle)
    if (!course) continue
    
    const sessionStart = new Date(sessionData.date)
    const sessionEnd = new Date(sessionStart)
    
    // Set end date based on duration
    if (sessionData.duration > 1) {
      sessionEnd.setDate(sessionStart.getDate() + sessionData.duration - 1)
    }
    
    // Add some random booking numbers for realism
    const bookedSpots = Math.floor(Math.random() * (course.maxStudents * 0.7))
    
    await prisma.courseSession.create({
      data: {
        courseId: course.id,
        startDate: sessionStart,
        endDate: sessionEnd,
        startTime: "09:00",
        endTime: "17:00",
        availableSpots: course.maxStudents,
        bookedSpots: bookedSpots,
        isActive: true
      }
    })
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