const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.courseSession.deleteMany();
    await prisma.course.deleteMany();
    // Create courses
    const course1 = await prisma.course.create({
      data: {
        title: 'ACS CORE & 4 REA',
        description: 'Gas safety reassessment for core competencies and 4 appliances. Run by engineers for engineers.',
        category: 'GAS_SAFE',
        duration: 16,
        price: 650.00,
        maxStudents: 12
      }
    });
    console.log('✅ Created course:', course1.title);

    const course2 = await prisma.course.create({
      data: {
        title: 'ACS CORE & 4 INITIAL',
        description: 'Initial gas safety assessment for core competencies and 4 appliances. Complete certification course.',
        category: 'GAS_SAFE', 
        duration: 40,
        price: 995.00,
        maxStudents: 12
      }
    });
    console.log('✅ Created course:', course2.title);

    const course3 = await prisma.course.create({
      data: {
        title: 'Air Source Heat Pump',
        description: 'Air source heat pump installation, commissioning and maintenance training.',
        category: 'HEAT_PUMP',
        duration: 32,
        price: 650.00,
        maxStudents: 10
      }
    });
    console.log('✅ Created course:', course3.title);

    // Add more courses from user's price list
    const course4 = await prisma.course.create({
      data: {
        title: 'LPG PD/RPH REA',
        description: 'LPG Permanent Dwellings and Residential Park Homes reassessment.',
        category: 'LPG',
        duration: 16,
        price: 300.00,
        maxStudents: 12
      }
    });
    console.log('✅ Created course:', course4.title);

    const course5 = await prisma.course.create({
      data: {
        title: 'OFTEC REA',
        description: 'OFTEC oil heating reassessment for qualified technicians.',
        category: 'OFTEC',
        duration: 16,
        price: 600.00,
        maxStudents: 12
      }
    });
    console.log('✅ Created course:', course5.title);

    const course6 = await prisma.course.create({
      data: {
        title: 'Gas Safe Registration Training',
        description: 'Complete gas safety training for new gas engineers covering installation, maintenance, and safety procedures.',
        category: 'GAS_SAFE',
        duration: 40,
        price: 850.00,
        maxStudents: 12
      }
    });
    console.log('✅ Created course:', course6.title);

    // Create sessions for all courses
    const allCourses = await prisma.course.findMany();
    
    for (const course of allCourses) {
      // Create 2 sessions per course
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
      console.log(`✅ Created 2 sessions for: ${course.title}`);
    }

    console.log('🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();