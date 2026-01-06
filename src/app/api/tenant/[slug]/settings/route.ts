import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Tenant slug is required' },
        { status: 400 }
      )
    }

    // Find the tenant
    const tenant = await prisma.tenant.findFirst({
      where: { slug, active: true }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Extract fields that can be updated
    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'city',
      'postcode',
      'primaryColor',
      'secondaryColor',
      'logo',
      'domain',
      'planType',
      'maxStudents'
    ]

    // Filter the body to only include allowed fields
    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Convert maxStudents to number if it exists
    if (updateData.maxStudents) {
      updateData.maxStudents = parseInt(updateData.maxStudents)
    }

    // Validate plan type if provided
    if (updateData.planType && !['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(updateData.planType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Update the tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
      include: {
        settings: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      tenant: updatedTenant
    })

  } catch (error) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}