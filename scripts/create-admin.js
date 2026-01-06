const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDefaultAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:')
      console.log('Email:', existingAdmin.email)
      console.log('Password: admin123!')
      return
    }

    // Create new admin user
    const defaultPassword = 'admin123!'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    const admin = await prisma.adminUser.create({
      data: {
        email: 'admin@acme-training.co.uk',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    })

    console.log('✅ Default admin created successfully!')
    console.log('Email: admin@acme-training.co.uk')
    console.log('Password: admin123!')
    console.log('Please change this password after first login!')

  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDefaultAdmin()