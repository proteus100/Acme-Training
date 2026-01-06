const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function showTenantCredentials() {
  try {
    const tenantSlug = process.argv[2]

    if (!tenantSlug) {
      console.log('\n❌ Please provide a tenant slug')
      console.log('Usage: node scripts/show-tenant-credentials.js <tenant-slug>\n')
      process.exit(1)
    }

    console.log(`\n=== TENANT CREDENTIALS FOR: ${tenantSlug} ===\n`)

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        planType: true,
        AdminUser: {
          where: { role: 'MANAGER' },
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true
          }
        }
      }
    })

    if (!tenant) {
      console.log('❌ Tenant not found!\n')
      process.exit(1)
    }

    console.log('Tenant Information:')
    console.log(`  Name: ${tenant.name}`)
    console.log(`  Email: ${tenant.email}`)
    console.log(`  Plan: ${tenant.planType}`)
    console.log(`  URL: http://localhost:3003/${tenant.slug}/admin`)
    console.log('')

    if (tenant.AdminUser && tenant.AdminUser.length > 0) {
      console.log('Admin Users:')
      tenant.AdminUser.forEach((admin, i) => {
        console.log(`  ${i + 1}. ${admin.firstName} ${admin.lastName}`)
        console.log(`     Email: ${admin.email}`)
        console.log(`     Role: ${admin.role}`)
        console.log(`     Active: ${admin.isActive}`)
        console.log(`     Password: Check database or reset via "Send Welcome Email"`)
        console.log('')
      })
    } else {
      console.log('⚠️  No admin users found for this tenant!')
      console.log('   You can create one by clicking "Send Welcome Email" in the admin panel.')
      console.log('')
    }

    console.log('='.repeat(50))
    console.log('')

  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

showTenantCredentials()
