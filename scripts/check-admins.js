const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkAdmins() {
  try {
    console.log('\n=== CHECKING ADMIN USERS ===\n')

    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    if (admins.length === 0) {
      console.log('❌ No admin users found in database')
      console.log('\nYou need to create an admin user or run the seed script.')
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):\n`)
      admins.forEach((admin, i) => {
        console.log(`${i + 1}. ${admin.firstName} ${admin.lastName}`)
        console.log(`   Email: ${admin.email}`)
        console.log(`   Role: ${admin.role}`)
        console.log(`   Active: ${admin.isActive}`)
        if (admin.tenant) {
          console.log(`   Tenant: ${admin.tenant.name} (${admin.tenant.slug})`)
        } else {
          console.log(`   Tenant: Platform Admin (Super Admin)`)
        }
        console.log('')
      })
    }

    console.log('\n=== CHECKING TENANTS ===\n')

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        active: true,
        planType: true
      }
    })

    if (tenants.length === 0) {
      console.log('❌ No tenants found in database')
    } else {
      console.log(`✅ Found ${tenants.length} tenant(s):\n`)
      tenants.forEach((tenant, i) => {
        console.log(`${i + 1}. ${tenant.name}`)
        console.log(`   Slug: ${tenant.slug}`)
        console.log(`   Email: ${tenant.email}`)
        console.log(`   Plan: ${tenant.planType}`)
        console.log(`   Active: ${tenant.active}`)
        console.log(`   URL: http://localhost:3003/${tenant.slug}/admin`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmins()
