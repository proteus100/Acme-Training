import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get all students for this tenant
    const students = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: {
            bookings: true,
            achievements: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      students
    })

  } catch (error) {
    console.error('Error fetching tenant students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      companySize,
      jobTitle,
      address,
      city,
      postcode
    } = body

    // Check if email already exists for this tenant
    const existingStudent = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email
      }
    })

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student with this email already exists' },
        { status: 400 }
      )
    }

    // Create the student
    const student = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName,
        lastName,
        email,
        phone,
        company,
        companySize,
        jobTitle,
        address,
        city,
        postcode,
        isActive: true
      },
      include: {
        _count: {
          select: {
            bookings: true,
            achievements: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      student
    })

  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    )
  }
}