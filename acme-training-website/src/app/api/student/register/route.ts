import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, password } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Get tenant slug from middleware header
    const tenantSlug = request.headers.get('x-tenant-slug')
    console.log('Registration - Tenant slug from middleware:', tenantSlug)

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Unable to determine tenant. Please access this page through your training center URL.' },
        { status: 400 }
      )
    }

    // Find tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenant) {
      console.error('Registration failed - tenant not found:', tenantSlug)
      return NextResponse.json(
        { error: `Invalid tenant: ${tenantSlug}` },
        { status: 404 }
      )
    }

    // Check if customer already exists for this tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase()
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        emailVerified: new Date(), // Auto-verify for now
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      customer
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
