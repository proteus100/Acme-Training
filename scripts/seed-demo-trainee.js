const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedDemoTrainee() {
  console.log('🎯 Creating demo trainee with completed sessions and certificates...')

  try {
    // Get the first tenant (ACME)
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      throw new Error('No tenant found. Run basic seed first.')
    }

    // Get some courses
    const courses = await prisma.course.findMany({
      where: { tenantId: tenant.id },
      take: 3
    })

    if (courses.length === 0) {
      throw new Error('No courses found. Run course seed first.')
    }

    // Create demo student
    const demoStudent = await prisma.customer.upsert({
      where: { 
        tenantId_email: {
          tenantId: tenant.id,
          email: 'sarah.johnson@email.com'
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+44 7891 234567',
        company: 'Devon Gas Solutions Ltd',
        companySize: '11-50',
        jobTitle: 'Gas Engineer',
        address: '15 High Street',
        city: 'Exeter',
        postcode: 'EX1 2AB'
      }
    })

    console.log(`✅ Created demo student: ${demoStudent.firstName} ${demoStudent.lastName}`)

    // Create completed sessions with different dates - only for courses that exist
    const sessionsData = []
    
    if (courses[0]) {
      sessionsData.push({
        course: courses[0],
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-08-19'),
        completedDate: new Date('2024-08-19'),
        passed: true,
        grade: 'A',
        notes: 'Excellent practical skills and theoretical knowledge',
        certificateStatus: 'active'
      })
    }

    if (courses[1]) {
      sessionsData.push({
        course: courses[1],
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-05'),
        completedDate: new Date('2024-11-05'),
        passed: true,
        grade: 'B+',
        notes: 'Good understanding, minor improvement needed in safety protocols',
        certificateStatus: 'active'
      })
    }

    // Add an expiring certificate if we have a third course
    if (courses[2]) {
      sessionsData.push({
        course: courses[2],
        startDate: new Date('2020-03-10'),
        endDate: new Date('2020-03-14'),
        completedDate: new Date('2020-03-14'),
        passed: true,
        grade: 'A-',
        notes: 'Comprehensive understanding of all areas',
        certificateStatus: 'expiring' // This will be set to expire soon
      })
    }

    for (const sessionData of sessionsData) {
      // Create a completed session
      const session = await prisma.courseSession.create({
        data: {
          tenantId: tenant.id,
          courseId: sessionData.course.id,
          startDate: sessionData.startDate,
          endDate: sessionData.endDate,
          startTime: '09:00',
          endTime: '17:00',
          availableSpots: 12,
          bookedSpots: 1,
          isActive: false,
          isCompleted: true,
          completedAt: sessionData.completedDate,
          instructorNotes: `Session completed successfully for ${sessionData.course.title}`
        }
      })

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          tenantId: tenant.id,
          customerId: demoStudent.id,
          sessionId: session.id,
          status: 'COMPLETED',
          totalAmount: sessionData.course.price || 450.00,
          createdAt: new Date(sessionData.startDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days before
        }
      })

      // Create payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          status: 'PAID',
          paidAt: new Date(sessionData.startDate.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days before
        }
      })

      // Create session attendance record
      await prisma.sessionAttendance.create({
        data: {
          sessionId: session.id,
          customerId: demoStudent.id,
          status: 'ATTENDED',
          attendedDays: 5,
          totalDays: 5,
          passed: sessionData.passed,
          grade: sessionData.grade,
          notes: sessionData.notes,
          certificateIssued: true
        }
      })

      // Create achievement/certificate
      const expiryDate = new Date(sessionData.completedDate)
      
      // Set different expiry dates based on certificate status
      if (sessionData.certificateStatus === 'expiring') {
        // Set to expire in 30 days
        expiryDate.setDate(expiryDate.getDate() + 30)
      } else {
        // Standard 5-year validity
        expiryDate.setFullYear(expiryDate.getFullYear() + 5)
      }

      const certificateNumber = `${sessionData.course.category}-${sessionData.completedDate.getFullYear()}${String(sessionData.completedDate.getMonth() + 1).padStart(2, '0')}-${demoStudent.id.slice(-4)}`

      await prisma.achievement.create({
        data: {
          tenantId: tenant.id,
          customerId: demoStudent.id,
          courseId: sessionData.course.id,
          sessionId: session.id,
          level: 'BRONZE',
          category: sessionData.course.category,
          certificationDate: sessionData.completedDate,
          expiryDate: expiryDate,
          isExpired: sessionData.certificateStatus === 'expired',
          certificateNumber: certificateNumber,
          remindersSent: 0
        }
      })

      console.log(`✅ Created completed session and certificate for: ${sessionData.course.title}`)
      console.log(`   📜 Certificate: ${certificateNumber}`)
      console.log(`   📅 Expires: ${expiryDate.toLocaleDateString()}`)
      console.log(`   🎯 Status: ${sessionData.certificateStatus}`)
    }

    // Create demo credentials for easy login testing
    console.log(`\n🎓 Demo Student Created Successfully!`)
    console.log(`📧 Email: ${demoStudent.email}`)
    console.log(`👤 Name: ${demoStudent.firstName} ${demoStudent.lastName}`)
    console.log(`🏢 Company: ${demoStudent.company}`)
    console.log(`\n🎯 To test the portfolio:`)
    console.log(`1. Go to http://localhost:3001/student/login`)
    console.log(`2. Login with: ${demoStudent.email}`)
    console.log(`3. View the dashboard to see certificates and achievements`)
    console.log(`4. Check gamification panel, tier progress, and expiry warnings`)

  } catch (error) {
    console.error('❌ Error seeding demo trainee:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedDemoTrainee()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { seedDemoTrainee }