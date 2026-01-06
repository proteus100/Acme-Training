const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupDemo() {
  console.log('🧹 Cleaning up demo data...')
  
  try {
    // Find the demo student
    const demoStudent = await prisma.customer.findFirst({
      where: { email: 'sarah.johnson@email.com' }
    })
    
    if (!demoStudent) {
      console.log('No demo student found to clean up.')
      return
    }
    
    console.log(`Found demo student: ${demoStudent.firstName} ${demoStudent.lastName}`)
    
    // Delete in correct order due to foreign key constraints
    
    // 1. Delete achievements
    await prisma.achievement.deleteMany({
      where: { customerId: demoStudent.id }
    })
    console.log('✅ Deleted achievements')
    
    // 2. Delete session attendance
    await prisma.sessionAttendance.deleteMany({
      where: { customerId: demoStudent.id }
    })
    console.log('✅ Deleted session attendance')
    
    // 3. Delete payments
    const bookings = await prisma.booking.findMany({
      where: { customerId: demoStudent.id }
    })
    
    for (const booking of bookings) {
      await prisma.payment.deleteMany({
        where: { bookingId: booking.id }
      })
    }
    console.log('✅ Deleted payments')
    
    // 4. Delete bookings
    await prisma.booking.deleteMany({
      where: { customerId: demoStudent.id }
    })
    console.log('✅ Deleted bookings')
    
    // 5. Delete completed sessions (but only ones created by demo)
    await prisma.courseSession.deleteMany({
      where: { 
        tenantId: demoStudent.tenantId,
        isCompleted: true,
        instructorNotes: { contains: 'Session completed successfully' }
      }
    })
    console.log('✅ Deleted demo sessions')
    
    // 6. Delete the customer
    await prisma.customer.delete({
      where: { id: demoStudent.id }
    })
    console.log('✅ Deleted demo customer')
    
    console.log('🎉 Demo cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  cleanupDemo()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { cleanupDemo }