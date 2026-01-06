import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()

// JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get tenant slug from middleware header
    const tenantSlug = request.headers.get('x-tenant-slug')
    console.log('Login - Tenant slug from middleware:', tenantSlug)

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
      console.error('Login failed - tenant not found:', tenantSlug)
      return NextResponse.json(
        { error: `Invalid tenant: ${tenantSlug}` },
        { status: 404 }
      )
    }

    // Find customer by email and tenantId
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase()
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if customer has a password (might be Google-only account)
    if (!customer.password) {
      return NextResponse.json(
        { error: 'This account uses Google Sign-In. Please use the "Continue with Google" button.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!customer.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      )
    }

    // Create JWT token
    const token = await new SignJWT({
      customerId: customer.id,
      tenantId: tenant.id,
      email: customer.email
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    // Create response with customer data
    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        company: customer.company
      }
    })

    // Set HTTP-only cookie with JWT
    response.cookies.set('student-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
