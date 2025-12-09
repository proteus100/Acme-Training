import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

// PUT /api/admin/tenant/profile
// Allows tenant admins to update their own tenant profile information
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!admin.tenantId) {
      return NextResponse.json(
        { error: 'Only tenant admins can update tenant profile' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { name, email, phone, address, city, county, postcode } = data

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Update tenant profile
    const updatedTenant = await prisma.tenant.update({
      where: { id: admin.tenantId },
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        county: county || null,
        postcode: postcode || null
      }
    })

    // Return updated profile
    return NextResponse.json({
      name: updatedTenant.name,
      email: updatedTenant.email,
      phone: updatedTenant.phone,
      address: updatedTenant.address,
      city: updatedTenant.city,
      county: updatedTenant.county,
      postcode: updatedTenant.postcode
    })

  } catch (error) {
    console.error('Error updating tenant profile:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant profile' },
      { status: 500 }
    )
  }
}
