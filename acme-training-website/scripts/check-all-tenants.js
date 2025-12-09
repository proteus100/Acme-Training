const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllTenants() {
  try {
    console.log('Checking all test tenants...\n')
    
    const tenants = await prisma.tenant.findMany({
      where: {
        slug: {
          in: ['starter-test', 'bristol', 'enterprise-test']
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        planType: true,
        maxStudents: true,
        maxCourses: true,
        _count: {
          select: {
            courses: true
          }
        }
      }
    })
    
    console.log('Current tenant status:')
    console.log('=====================')
    
    for (const tenant of tenants) {
      const expectedLimits = {
        'STARTER': { maxCourses: 5, maxStudents: 50 },
        'PROFESSIONAL': { maxCourses: 25, maxStudents: 150 },
        'ENTERPRISE': { maxCourses: 999999, maxStudents: 999999 }
      }
      
      const expected = expectedLimits[tenant.planType]
      const isCorrect = expected && 
        tenant.maxCourses === expected.maxCourses && 
        tenant.maxStudents === expected.maxStudents
      
      console.log(`${tenant.slug}:`)
      console.log(`  Plan: ${tenant.planType}`)
      console.log(`  Courses: ${tenant._count.courses}/${tenant.maxCourses} ${isCorrect ? '✅' : '❌'}`)
      console.log(`  Students: ${tenant.maxStudents} ${isCorrect ? '✅' : '❌'}`)
      console.log(`  Status: ${isCorrect ? 'CORRECT' : 'NEEDS FIX'}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllTenants()