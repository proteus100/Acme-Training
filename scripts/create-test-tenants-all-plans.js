const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestTenants() {
  try {
    console.log('Creating test tenants for all plan levels...')
    
    // Clean up existing test data first
    console.log('Cleaning up existing test data...')
    await prisma.course.deleteMany({
      where: {
        tenant: {
          slug: {
            in: ['starter-test', 'bristol', 'enterprise-test']
          }
        }
      }
    })
    
    await prisma.tenant.deleteMany({
      where: {
        slug: {
          in: ['starter-test', 'enterprise-test']
        }
      }
    })
    
    // STARTER Plan Tenant
    const starterTenant = await prisma.tenant.upsert({
      where: { slug: 'starter-test' },
      update: {},
      create: {
        name: 'Starter Gas Training',
        slug: 'starter-test',
        email: 'admin@startertest.com',
        phone: '01234 567890',
        address: '10 Starter Street, Test City, ST1 1AA',
        city: 'Test City',
        county: 'Test County',
        postcode: 'ST1 1AA',
        website: 'https://startertest.com',
        primaryColor: '#10b981',
        secondaryColor: '#34d399'
      }
    })

    // PROFESSIONAL Plan Tenant (Bristol already exists, but let's update it)
    const professionalTenant = await prisma.tenant.upsert({
      where: { slug: 'bristol' },
      update: {
        name: 'Professional Bristol Training',
      },
      create: {
        name: 'Professional Bristol Training',
        slug: 'bristol',
        email: 'admin@bristolpro.com',
        phone: '0117 123 4567',
        address: '123 Training Street, Bristol, BS1 2AB',
        city: 'Bristol',
        county: 'Somerset',
        postcode: 'BS1 2AB',
        website: 'https://bristolpro.com',
        primaryColor: '#3b82f6',
        secondaryColor: '#60a5fa'
      }
    })

    // ENTERPRISE Plan Tenant
    const enterpriseTenant = await prisma.tenant.upsert({
      where: { slug: 'enterprise-test' },
      update: {},
      create: {
        name: 'Enterprise Training Solutions',
        slug: 'enterprise-test',
        email: 'admin@enterprisetest.com',
        phone: '0208 999 8888',
        address: '500 Enterprise Boulevard, London, E1 6AN',
        city: 'London',
        county: 'Greater London',
        postcode: 'E1 6AN',
        website: 'https://enterprisetest.com',
        primaryColor: '#7c3aed',
        secondaryColor: '#a78bfa'
      }
    })

    // Add some test courses and students to simulate usage
    console.log('Adding test data to simulate usage...')

    // Starter tenant: 3 courses, 25 students (within limits)
    const starterCourses = await prisma.course.createMany({
      data: [
        {
          tenantId: starterTenant.id,
          title: 'Basic Gas Safety',
          description: 'Introduction to gas safety',
          category: 'GAS_SAFE',
          price: 150.00,
          duration: 480,
          maxStudents: 12,
        },
        {
          tenantId: starterTenant.id,
          title: 'Boiler Maintenance',
          description: 'Basic boiler maintenance',
          category: 'WATER',
          price: 200.00,
          duration: 360,
          maxStudents: 8,
        },
        {
          tenantId: starterTenant.id,
          title: 'Safety Regulations',
          description: 'Understanding safety regulations',
          category: 'GAS_SAFE',
          price: 100.00,
          duration: 240,
          maxStudents: 15,
        }
      ]
    })

    // Bristol (Professional): 10 courses, 75 students (within limits but room to grow)
    const bristolCourses = await prisma.course.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        tenantId: professionalTenant.id,
        title: `Professional Course ${i + 1}`,
        description: `Advanced training course ${i + 1}`,
        category: i % 2 === 0 ? 'GAS_SAFE' : 'HEAT_PUMP',
        price: 250.00 + (i * 25),
        duration: 480,
        maxStudents: 12,
      })),
    })

    // Enterprise: 25 courses, 200 students (heavy usage)
    const enterpriseCourses = await prisma.course.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        tenantId: enterpriseTenant.id,
        title: `Enterprise Course ${i + 1}`,
        description: `Enterprise-level training ${i + 1}`,
        category: ['GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG'][i % 4],
        price: 500.00 + (i * 50),
        duration: 720,
        maxStudents: 20,
      })),
    })

    console.log('✅ Test tenants created successfully!')
    console.log('')
    console.log('🎯 STARTER PLAN (£29/month):')
    console.log('   Name: Starter Gas Training')
    console.log('   URL: http://localhost:3000/starter-test')
    console.log('   Admin: http://localhost:3000/starter-test/admin')
    console.log('   Upgrade: http://localhost:3000/starter-test/admin/billing/upgrade')
    console.log('   Limits: 5 courses, 50 students')
    console.log('   Current: 3 courses, ~25 students')
    console.log('')
    console.log('🎯 PROFESSIONAL PLAN (£49/month):')
    console.log('   Name: Professional Bristol Training')
    console.log('   URL: http://localhost:3000/bristol')
    console.log('   Admin: http://localhost:3000/bristol/admin')
    console.log('   Upgrade: http://localhost:3000/bristol/admin/billing/upgrade')
    console.log('   Limits: 15 courses, 150 students')
    console.log('   Current: 10 courses, ~75 students')
    console.log('')
    console.log('🎯 ENTERPRISE PLAN (£149/month):')
    console.log('   Name: Enterprise Training Solutions')
    console.log('   URL: http://localhost:3000/enterprise-test')
    console.log('   Admin: http://localhost:3000/enterprise-test/admin')
    console.log('   Upgrade: http://localhost:3000/enterprise-test/admin/billing/upgrade')
    console.log('   Limits: Unlimited courses, unlimited students')
    console.log('   Current: 25 courses, ~200 students')
    console.log('')
    console.log('🧪 TEST SCENARIOS:')
    console.log('1. Starter → Professional upgrade')
    console.log('2. Professional → Enterprise upgrade')
    console.log('3. Enterprise (already at top tier)')
    
  } catch (error) {
    console.error('Error creating test tenants:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestTenants()