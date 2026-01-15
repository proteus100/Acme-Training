import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { getTenantSubdomain, getCurrentTenant } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('TEST LOGIN - Step 1: Getting tenant info')
    const tenantSubdomain = await getTenantSubdomain()
    const currentTenant = await getCurrentTenant()

    console.log('TEST LOGIN - Step 2: Tenant info:', {
      subdomain: tenantSubdomain,
      tenantName: currentTenant?.name
    })

    console.log('TEST LOGIN - Step 3: Finding admin user')
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        Tenant: true
      }
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    console.log('TEST LOGIN - Step 4: Admin found:', {
      email: admin.email,
      tenantId: admin.tenantId,
      tenantName: admin.Tenant?.name
    })

    console.log('TEST LOGIN - Step 5: Verifying password')
    const isValid = await verifyPassword(password, admin.passwordHash)

    console.log('TEST LOGIN - Step 6: Password valid:', isValid)

    return NextResponse.json({
      success: true,
      message: 'Test login successful',
      data: {
        adminEmail: admin.email,
        adminTenantId: admin.tenantId,
        currentTenantId: currentTenant?.id,
        passwordValid: isValid,
        match: admin.tenantId === currentTenant?.id
      }
    })

  } catch (error) {
    console.error('TEST LOGIN ERROR:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
