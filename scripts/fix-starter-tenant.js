const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixStarterTenant() {
  try {
    console.log('Checking starter-test tenant...')
    
    // Check current tenant data
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'starter-test' },
      select: { id: true, name: true, slug: true, planType: true, maxStudents: true, maxCourses: true }
    })
    
    console.log('Current starter-test tenant:', JSON.stringify(tenant, null, 2))
    
    if (!tenant) {
      console.log('starter-test tenant not found!')
      return
    }
    
    // Update to correct STARTER plan
    if (tenant.planType !== 'STARTER') {
      console.log('Fixing plan type from', tenant.planType, 'to STARTER')
      
      const updated = await prisma.tenant.update({
        where: { slug: 'starter-test' },
        data: {
          planType: 'STARTER',
          maxStudents: 50,
          maxCourses: 5
        }
      })
      
      console.log('Updated tenant:', JSON.stringify({
        id: updated.id,
        slug: updated.slug,
        planType: updated.planType,
        maxStudents: updated.maxStudents,
        maxCourses: updated.maxCourses
      }, null, 2))
    } else {
      console.log('Tenant already has STARTER plan type')
    }
    
    // Count courses
    const courseCount = await prisma.course.count({
      where: { tenantId: tenant.id }
    })
    
    console.log(`Tenant currently has ${courseCount} courses (limit: 5)`)
    
    if (courseCount > 5) {
      console.log('⚠️  This tenant is already over the limit! This is perfect for testing the upgrade modal.')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStarterTenant()