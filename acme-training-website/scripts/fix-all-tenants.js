const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixAllTenants() {
  try {
    console.log('Fixing all tenant plan types and limits...\n')
    
    const updates = [
      {
        slug: 'starter-test',
        planType: 'STARTER',
        maxCourses: 5,
        maxStudents: 50
      },
      {
        slug: 'bristol',
        planType: 'PROFESSIONAL', 
        maxCourses: 25,
        maxStudents: 150
      },
      {
        slug: 'enterprise-test',
        planType: 'ENTERPRISE',
        maxCourses: 999999,
        maxStudents: 999999
      }
    ]
    
    for (const update of updates) {
      const result = await prisma.tenant.update({
        where: { slug: update.slug },
        data: {
          planType: update.planType,
          maxCourses: update.maxCourses,
          maxStudents: update.maxStudents
        }
      })
      
      console.log(`✅ Fixed ${update.slug}:`)
      console.log(`   Plan: ${result.planType}`)
      console.log(`   Max Courses: ${result.maxCourses}`)
      console.log(`   Max Students: ${result.maxStudents}`)
      console.log('')
    }
    
    // Clear cache after updates
    console.log('Updates complete! Remember to clear the cache.')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllTenants()