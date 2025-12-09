const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Seeding database with courses...');
    
    // Clear existing data
    await prisma.courseSession.deleteMany();
    await prisma.course.deleteMany();
    
    // Course data from user's price list
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
      },
      {
        title: 'Gas Safe Registration Training',
        description: 'Complete gas safety training for new gas engineers covering installation, maintenance, and safety procedures.',
        category: 'GAS_SAFE',
        duration: 40,
        price: 850.00,
        maxStudents: 12
      },
      {
        title: 'Heat Pump Installation Foundation',
        description: 'Essential training for heat pump installation covering system design and installation best practices.',
        category: 'HEAT_PUMP',
        duration: 32,
        price: 750.00,
        maxStudents: 8
      },
      {
        title: 'OFTEC Pressure Jet Boiler Training',
        description: 'OFTEC approved training for pressure jet boiler installation and maintenance.',
        category: 'OFTEC',
        duration: 40,
        price: 890.00,
        maxStudents: 12
      }
    ];

    // Create courses
    for (const courseData of courses) {
      const course = await prisma.course.create({
        data: courseData
      });
      console.log(`✅ Created course: ${course.title}`);
    }

    // Create sessions for each course
    const allCourses = await prisma.course.findMany();
    
    for (const course of allCourses) {
      // Create 2-3 sessions per course
      for (let i = 0; i < 2; i++) {
        const sessionStart = new Date();
        sessionStart.setDate(sessionStart.getDate() + (i * 14) + 7); // 1 week, 3 weeks from now
        
        const sessionEnd = new Date(sessionStart);
        if (course.duration <= 16) {
          // 1-2 day course
          sessionEnd.setDate(sessionStart.getDate() + Math.ceil(course.duration / 8) - 1);
        } else {
          // Multi-day course
          sessionEnd.setDate(sessionStart.getDate() + Math.ceil(course.duration / 8) - 1);
        }
        
        await prisma.courseSession.create({
          data: {
            courseId: course.id,
            startDate: sessionStart,
            endDate: sessionEnd,
            startTime: '09:00',
            endTime: '17:00',
            availableSpots: course.maxStudents,
            bookedSpots: Math.floor(Math.random() * 3), // 0-2 random bookings
            isActive: true
          }
        });
      }
      console.log(`✅ Created sessions for: ${course.title}`);
    }

    console.log('🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();