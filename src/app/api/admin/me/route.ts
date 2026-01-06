import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch admin with tenant information
    const adminWithTenant = await prisma.adminUser.findUnique({
      where: { id: admin.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true
          }
        }
      }
    })

    if (!adminWithTenant) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      admin: {
        id: adminWithTenant.id,
        email: adminWithTenant.email,
        firstName: adminWithTenant.firstName,
        lastName: adminWithTenant.lastName,
        role: adminWithTenant.role,
        tenantId: adminWithTenant.tenantId,
        tenant: adminWithTenant.tenant
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}