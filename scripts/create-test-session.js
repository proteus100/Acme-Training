const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestSession() {
  console.log('🧪 Creating test session with sample data...')
  
  try {
    // First, get or create a course
    let course = await prisma.course.findFirst({
      where: {
        category: 'GAS_SAFE'
      }
    })

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: "ACS CORE & 4 INITIAL (Domestic Gas)",
          description: "Initial Assessment for ACS Core Gas Safety and 4 appliances (CCN1, CPA1, CENWAT1, CKR1). Essential certification for domestic gas engineers starting their career.",
          category: "GAS_SAFE",
          duration: 40,
          price: 995.00,
          maxStudents: 8
        }
      })
    }

    console.log('✅ Using course:', course.title)

    // Create or get customers
    const customers = []
    const customerData = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', company: 'Smith Heating Ltd' },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@example.com', company: 'Johnson Gas Services' },
      { firstName: 'Michael', lastName: 'Brown', email: 'mike.brown@example.com', company: 'Brown Plumbing' },
      { firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@example.com', company: 'Wilson Gas Engineers' }
    ]

    for (const customerInfo of customerData) {
      let customer = await prisma.customer.findUnique({
        where: { email: customerInfo.email }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: customerInfo
        })
      }

      customers.push(customer)
    }

    console.log('✅ Created/found customers:', customers.length)

    // Create a session (starts yesterday, ends today)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 1)
    const endDate = new Date()

    const session = await prisma.courseSession.create({
      data: {
        courseId: course.id,
        startDate: startDate,
        endDate: endDate,
        startTime: '09:00',
        endTime: '17:00',
        availableSpots: 8,
        bookedSpots: customers.length,
        isActive: true,
        isCompleted: false
      }
    })

    console.log('✅ Created session:', session.id)

    // Create bookings for each customer
    const bookings = []
    for (const customer of customers) {
      const booking = await prisma.booking.create({
        data: {
          customerId: customer.id,
          sessionId: session.id,
          status: 'CONFIRMED',
          totalAmount: course.price,
          depositAmount: course.price * 0.3
        }
      })
      bookings.push(booking)
    }

    console.log('✅ Created bookings:', bookings.length)

    console.log('\n🎉 Test session created successfully!')
    console.log(`📅 Session ID: ${session.id}`)
    console.log(`🎓 Course: ${course.title}`)
    console.log(`👥 Students: ${customers.length}`)
    console.log(`🔗 Complete session URL: http://localhost:3000/admin/sessions/${session.id}/complete`)
    console.log('\n📋 To test the automatic achievement creation:')
    console.log('1. Go to Sessions page in admin')
    console.log('2. Click the Award icon next to this session')
    console.log('3. Mark students as passed')
    console.log('4. Complete session - achievements will be automatically created!')

  } catch (error) {
    console.error('❌ Error creating test session:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestSession()