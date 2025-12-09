const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateAdminEmail() {
  console.log('🔄 Updating admin email from ACME to Exeter Digital Agency...')
  
  try {
    // Find the current admin user
    const oldAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@acme-training.co.uk' }
    })
    
    if (!oldAdmin) {
      console.log('❌ No admin user found with email: admin@acme-training.co.uk')
      console.log('📋 Checking all admin users...')
      
      const allAdmins = await prisma.adminUser.findMany()
      console.log(`Found ${allAdmins.length} admin users:`)
      allAdmins.forEach(admin => {
        console.log(`  📧 ${admin.email} - ${admin.firstName} ${admin.lastName} (${admin.role})`)
      })
      return
    }
    
    console.log(`✅ Found admin user: ${oldAdmin.firstName} ${oldAdmin.lastName}`)
    
    // Update the email address
    const updatedAdmin = await prisma.adminUser.update({
      where: { id: oldAdmin.id },
      data: { 
        email: 'admin@exeterdigitalagency.co.uk'
      }
    })
    
    console.log('✅ Successfully updated admin email!')
    console.log(`📧 Old email: admin@acme-training.co.uk`)
    console.log(`📧 New email: ${updatedAdmin.email}`)
    console.log(`👤 Admin: ${updatedAdmin.firstName} ${updatedAdmin.lastName}`)
    console.log(`🔑 Role: ${updatedAdmin.role}`)
    
    console.log('\n🎉 Admin login should now work with:')
    console.log('📧 Email: admin@exeterdigitalagency.co.uk')
    console.log('🔐 Password: admin123!')
    
  } catch (error) {
    console.error('❌ Error updating admin email:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  updateAdminEmail()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { updateAdminEmail }