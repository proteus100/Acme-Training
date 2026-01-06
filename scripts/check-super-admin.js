const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkSuperAdmin() {
  try {
    console.log('\n=== CHECKING SUPER ADMIN ACCOUNT ===\n')

    const superAdmin = await prisma.adminUser.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
        tenantId: true
      }
    })

    if (!superAdmin) {
      console.log('❌ No SUPER_ADMIN found in database!')
      console.log('\nCreating SUPER_ADMIN account...\n')

      const password = '1v4Fw=fOo,QDH5r'
      const hashedPassword = await bcrypt.hash(password, 12)

      const newAdmin = await prisma.adminUser.create({
        data: {
          email: 'admin@exeterdigitalagency.co.uk',
          passwordHash: hashedPassword,
          firstName: 'Platform',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          isActive: true,
          tenantId: null
        }
      })

      console.log('✅ Created SUPER_ADMIN account:')
      console.log('   Email:', newAdmin.email)
      console.log('   Password:', password)
      console.log('   Role:', newAdmin.role)
      console.log('')
    } else {
      console.log('✅ Found SUPER_ADMIN account:')
      console.log('   Email:', superAdmin.email)
      console.log('   Name:', superAdmin.firstName, superAdmin.lastName)
      console.log('   Role:', superAdmin.role)
      console.log('   Active:', superAdmin.isActive)
      console.log('   Has Password:', superAdmin.passwordHash ? 'YES' : 'NO')
      console.log('   Password Hash Length:', superAdmin.passwordHash ? superAdmin.passwordHash.length : 0)
      console.log('')

      if (!superAdmin.passwordHash) {
        console.log('⚠️  WARNING: No password hash found!')
        console.log('Setting password to: 1v4Fw=fOo,QDH5r\n')

        const password = '1v4Fw=fOo,QDH5r'
        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.adminUser.update({
          where: { id: superAdmin.id },
          data: { passwordHash: hashedPassword }
        })

        console.log('✅ Password set successfully!')
      } else {
        console.log('Password is already set.')
        console.log('\nTesting password verification...')
        const isValid = await bcrypt.compare('1v4Fw=fOo,QDH5r', superAdmin.passwordHash)
        console.log('Password "1v4Fw=fOo,QDH5r" is valid:', isValid)

        if (!isValid) {
          console.log('\n⚠️  Current password does not match!')
          console.log('Resetting password to: 1v4Fw=fOo,QDH5r\n')

          const password = '1v4Fw=fOo,QDH5r'
          const hashedPassword = await bcrypt.hash(password, 12)

          await prisma.adminUser.update({
            where: { id: superAdmin.id },
            data: { passwordHash: hashedPassword }
          })

          console.log('✅ Password reset successfully!')
        }
      }
    }

    console.log('\n=== LOGIN CREDENTIALS ===\n')
    console.log('URL: http://localhost:3003/admin/login')
    console.log('Email: admin@exeterdigitalagency.co.uk')
    console.log('Password: 1v4Fw=fOo,QDH5r')
    console.log('')

  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSuperAdmin()
