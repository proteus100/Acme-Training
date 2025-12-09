import { PrismaClient, AdminRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding tenant-scoped admin users...\n')

  // Hash password once for reuse
  const passwordHash = await bcrypt.hash('admin123!', 10)

  // 1. Create Platform Super Admin (no tenant)
  console.log('Creating platform super admin...')
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@exeterdigitalagency.co.uk' },
    update: {
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      tenantId: null, // Platform admin - can access all tenants
      isActive: true
    },
    create: {
      email: 'admin@exeterdigitalagency.co.uk',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      role: AdminRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true
    }
  })
  console.log(`✅ Super Admin: ${superAdmin.email} (role: ${superAdmin.role})`)

  // 2. Get all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  })

  console.log(`\nFound ${tenants.length} active tenants\n`)

  // 3. Create tenant-specific admin users
  for (const tenant of tenants) {
    console.log(`Creating admins for: ${tenant.name} (${tenant.slug})`)

    // Manager for each tenant
    const manager = await prisma.adminUser.upsert({
      where: { email: `manager@${tenant.slug}.com` },
      update: {
        passwordHash,
        tenantId: tenant.id,
        role: AdminRole.MANAGER,
        isActive: true
      },
      create: {
        email: `manager@${tenant.slug}.com`,
        passwordHash,
        firstName: tenant.name,
        lastName: 'Manager',
        role: AdminRole.MANAGER,
        tenantId: tenant.id,
        isActive: true
      }
    })
    console.log(`  ✅ Manager: ${manager.email}`)

    // Staff member for each tenant
    const staff = await prisma.adminUser.upsert({
      where: { email: `staff@${tenant.slug}.com` },
      update: {
        passwordHash,
        tenantId: tenant.id,
        role: AdminRole.STAFF,
        isActive: true
      },
      create: {
        email: `staff@${tenant.slug}.com`,
        passwordHash,
        firstName: tenant.name,
        lastName: 'Staff',
        role: AdminRole.STAFF,
        tenantId: tenant.id,
        isActive: true
      }
    })
    console.log(`  ✅ Staff: ${staff.email}`)

    // Instructor for each tenant
    const instructor = await prisma.adminUser.upsert({
      where: { email: `instructor@${tenant.slug}.com` },
      update: {
        passwordHash,
        tenantId: tenant.id,
        role: AdminRole.INSTRUCTOR,
        isActive: true
      },
      create: {
        email: `instructor@${tenant.slug}.com`,
        passwordHash,
        firstName: tenant.name,
        lastName: 'Instructor',
        role: AdminRole.INSTRUCTOR,
        tenantId: tenant.id,
        isActive: true
      }
    })
    console.log(`  ✅ Instructor: ${instructor.email}\n`)
  }

  console.log('🎉 Admin user seeding completed!\n')
  console.log('📋 Summary:')
  console.log('─────────────────────────────────────────────────')
  console.log('Platform Super Admin:')
  console.log('  Email: admin@exeterdigitalagency.co.uk')
  console.log('  Password: admin123!')
  console.log('  Access: ALL tenants')
  console.log('')
  console.log('Tenant-Specific Admins (per tenant):')
  console.log('  Manager: manager@{tenant-slug}.com')
  console.log('  Staff: staff@{tenant-slug}.com')
  console.log('  Instructor: instructor@{tenant-slug}.com')
  console.log('  Password: admin123!')
  console.log('  Access: ONLY their tenant')
  console.log('─────────────────────────────────────────────────')
  console.log('')
  console.log('🔐 Login URLs:')
  console.log('  Platform Admin: http://localhost:3001/admin/login')
  console.log('  Tenant Admin: http://{tenant-slug}.localhost:3001/admin/login')
  console.log('')
  console.log('Example tenant slugs:', tenants.map(t => t.slug).join(', '))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
