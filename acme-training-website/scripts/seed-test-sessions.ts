import { PrismaClient, CourseCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTestSessions() {
  console.log('🌱 Starting test session seeding...')

  // Get or create a tenant
  let tenant = await prisma.tenant.findFirst()

  if (!tenant) {
    console.log('Creating test tenant...')
    tenant = await prisma.tenant.create({
      data: {
        name: 'ACME Gas Training',
        slug: 'acme',
        email: 'info@acmetraining.co.uk',
        phone: '01234 567890',
        address: '123 Training Street',
        city: 'London',
        postcode: 'SW1A 1AA'
      }
    })
  }

  console.log(`Using tenant: ${tenant.name} (${tenant.id})`)

  // Create/update admin user for this tenant
  const bcrypt = require('bcryptjs')
  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.adminUser.upsert({
    where: { email: 'admin@focustraining.com' },
    update: {
      tenantId: tenant.id,
      passwordHash: hashedPassword
    },
    create: {
      email: 'admin@focustraining.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'MANAGER',
      tenantId: tenant.id,
      isActive: true
    }
  })

  console.log('✅ Admin user created: admin@focustraining.com / password123')

  // Create tenant settings with minSessionAttendees = 4
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      minSessionAttendees: 4,
      bookingWindowDays: 30,
      cancellationHours: 24,
      depositPercentage: 0.3
    },
    create: {
      tenantId: tenant.id,
      minSessionAttendees: 4,
      bookingWindowDays: 30,
      cancellationHours: 24,
      depositPercentage: 0.3
    }
  })

  // Get or create some courses
  const gasSafeCourse = await prisma.course.upsert({
    where: {
      tenantId_title: {
        tenantId: tenant.id,
        title: 'Gas Safe Registration Training'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      title: 'Gas Safe Registration Training',
      description: 'Complete gas safety training for new gas engineers',
      category: CourseCategory.GAS_SAFE,
      duration: 40,
      price: 850.00,
      maxStudents: 12
    }
  })

  const heatPumpCourse = await prisma.course.upsert({
    where: {
      tenantId_title: {
        tenantId: tenant.id,
        title: 'Heat Pump Installation Foundation'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      title: 'Heat Pump Installation Foundation',
      description: 'Essential training for heat pump installation',
      category: CourseCategory.HEAT_PUMP,
      duration: 32,
      price: 750.00,
      maxStudents: 10
    }
  })

  const lpgCourse = await prisma.course.upsert({
    where: {
      tenantId_title: {
        tenantId: tenant.id,
        title: 'LPG Permanent Installation'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      title: 'LPG Permanent Installation',
      description: 'LPG training covering permanent installations',
      category: CourseCategory.LPG,
      duration: 32,
      price: 720.00,
      maxStudents: 8
    }
  })

  console.log('Courses ready ✅')

  // Create some test customers
  console.log('Creating test customers...')
  const customers = []
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Sophie', 'Robert', 'Anna']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor']

  for (let i = 0; i < 10; i++) {
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: `customer${i + 1}@test.com`
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `customer${i + 1}@test.com`,
        phone: `07${Math.floor(Math.random() * 900000000 + 100000000)}`
      }
    })
    customers.push(customer)
  }

  console.log(`Created ${customers.length} test customers ✅`)

  // Helper function to create a session
  const createSession = async (
    course: any,
    daysFromNow: number,
    bookingCount: number,
    scenario: string
  ) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + daysFromNow)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate)
    // Multi-day course
    if (course.duration > 24) {
      endDate.setDate(startDate.getDate() + 4) // 5 day course
    } else if (course.duration > 16) {
      endDate.setDate(startDate.getDate() + 2) // 3 day course
    } else if (course.duration > 8) {
      endDate.setDate(startDate.getDate() + 1) // 2 day course
    }

    const session = await prisma.courseSession.create({
      data: {
        tenantId: tenant.id,
        courseId: course.id,
        startDate,
        endDate,
        startTime: '09:00',
        endTime: '17:00',
        availableSpots: course.maxStudents,
        bookedSpots: bookingCount,
        isActive: true
      }
    })

    // Create bookings
    for (let i = 0; i < bookingCount && i < customers.length; i++) {
      await prisma.booking.create({
        data: {
          tenantId: tenant.id,
          customerId: customers[i].id,
          sessionId: session.id,
          status: 'CONFIRMED',
          totalAmount: course.price,
          depositAmount: course.price * 0.3
        }
      })
    }

    console.log(`✅ ${scenario}: ${course.title} - ${daysFromNow} days away - ${bookingCount} bookings`)
  }

  // Clean up existing sessions for fresh test data
  console.log('Cleaning up old test sessions...')
  // Delete in correct order to respect foreign key constraints
  await prisma.payment.deleteMany({ where: { booking: { tenantId: tenant.id } } })
  await prisma.sessionAttendance.deleteMany({ where: { session: { tenantId: tenant.id } } })
  await prisma.booking.deleteMany({ where: { tenantId: tenant.id } })
  await prisma.courseSession.deleteMany({ where: { tenantId: tenant.id } })

  console.log('Creating test sessions with various scenarios...')

  // Traffic Light System Tests:
  // 1. GREEN (0-7 days) - Imminent
  await createSession(gasSafeCourse, 0, 8, '🟢 GREEN (Today)')
  await createSession(heatPumpCourse, 1, 6, '🟢 GREEN (Tomorrow)')
  await createSession(lpgCourse, 5, 7, '🟢 GREEN (5 days)')

  // 2. AMBER (8-14 days) - Soon
  await createSession(gasSafeCourse, 10, 9, '🟠 AMBER (10 days)')
  await createSession(heatPumpCourse, 12, 8, '🟠 AMBER (12 days)')

  // 3. BLUE (15-21 days) - Approaching
  await createSession(lpgCourse, 17, 6, '🔵 BLUE (17 days)')
  await createSession(gasSafeCourse, 20, 10, '🔵 BLUE (20 days)')

  // 4. GRAY (22+ days) - Future
  await createSession(heatPumpCourse, 25, 7, '⚪ GRAY (25 days)')
  await createSession(lpgCourse, 35, 5, '⚪ GRAY (35 days)')

  // Low Attendance Alerts (< 4 students):
  console.log('\nCreating LOW ATTENDANCE test scenarios...')
  await createSession(gasSafeCourse, 7, 2, '⚠️  LOW ATTENDANCE (2 students)')
  await createSession(heatPumpCourse, 14, 3, '⚠️  LOW ATTENDANCE (3 students)')
  await createSession(lpgCourse, 21, 1, '⚠️  LOW ATTENDANCE (1 student)')

  // Good Attendance (>= 4 students):
  console.log('\nCreating GOOD ATTENDANCE test scenarios...')
  await createSession(gasSafeCourse, 3, 6, '✅ GOOD ATTENDANCE (6 students)')
  await createSession(heatPumpCourse, 8, 5, '✅ GOOD ATTENDANCE (5 students)')

  // Nearly Full Sessions:
  console.log('\nCreating NEARLY FULL test scenarios...')
  await createSession(gasSafeCourse, 4, 11, '🔶 NEARLY FULL (11/12 spots)')
  await createSession(heatPumpCourse, 15, 9, '🔶 NEARLY FULL (9/10 spots)')

  // Full Sessions:
  console.log('\nCreating FULL SESSION test scenarios...')
  await createSession(lpgCourse, 6, 8, '🚫 FULL (8/8 spots)')

  // Empty Session:
  console.log('\nCreating EMPTY SESSION test scenario...')
  await createSession(gasSafeCourse, 30, 0, '⭕ EMPTY (0 students)')

  console.log('\n✨ Test session seeding completed!')
  console.log('\n📊 Summary:')
  console.log('  - Traffic light colors: Green (Today, 1d, 5d), Amber (10d, 12d), Blue (17d, 20d), Gray (25d, 35d)')
  console.log('  - Low attendance alerts: 3 sessions with < 4 students')
  console.log('  - Good attendance: Multiple sessions with >= 4 students')
  console.log('  - Nearly full: 2 sessions')
  console.log('  - Full: 1 session')
  console.log('  - Empty: 1 session')
  console.log('\n💡 Visit http://localhost:3000/admin/sessions to see the results!')
}

async function main() {
  try {
    await seedTestSessions()
  } catch (error) {
    console.error('❌ Error seeding test sessions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
