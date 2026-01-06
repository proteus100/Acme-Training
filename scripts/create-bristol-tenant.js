const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createBristolTenant() {
  try {
    console.log('Creating Bristol tenant...')
    
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'bristol' },
      update: {},
      create: {
        name: 'Bristol Gas Training Center',
        slug: 'bristol',
        email: 'admin@bristolgastraining.com',
        phone: '0117 123 4567',
        address: '123 Training Street, Bristol, BS1 2AB',
        city: 'Bristol',
        county: 'Somerset',
        postcode: 'BS1 2AB',
        website: 'https://bristolgastraining.com',
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6'
      }
    })
    
    console.log('Bristol tenant created successfully:', tenant.name)
    console.log('Tenant URL: http://localhost:3000/bristol')
    console.log('Admin URL: http://localhost:3000/bristol/admin')
    
  } catch (error) {
    console.error('Error creating Bristol tenant:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createBristolTenant()