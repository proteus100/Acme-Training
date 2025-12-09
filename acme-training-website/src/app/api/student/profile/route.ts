import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/nextauth'
import { prisma } from '../../../../lib/prisma'
import { getStudentFromRequest } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('[Profile API] Request received')
    // Try JWT authentication first (email/password users)
    const studentFromJWT = await getStudentFromRequest(request)

    console.log('[Profile API] JWT auth result:', studentFromJWT ? 'Found' : 'Not found')
    if (studentFromJWT) {
      console.log('[Profile API] Returning JWT student:', studentFromJWT.email)
      // Return student from JWT token
      return NextResponse.json({
        id: studentFromJWT.id,
        firstName: studentFromJWT.firstName,
        lastName: studentFromJWT.lastName,
        email: studentFromJWT.email,
        phone: studentFromJWT.phone,
        company: studentFromJWT.company,
        companySize: studentFromJWT.companySize,
        jobTitle: studentFromJWT.jobTitle,
        address: studentFromJWT.address,
        city: studentFromJWT.city,
        postcode: studentFromJWT.postcode,
      })
    }

    console.log('[Profile API] Trying NextAuth session')
    // Fall back to NextAuth session (Google Sign-In users)
    const session = await getServerSession(authOptions)

    console.log('[Profile API] NextAuth session:', session ? 'Found' : 'Not found')
    if (!session?.user?.email) {
      console.log('[Profile API] No authentication found, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use findFirst instead of findUnique since email alone is not unique
    const customer = await prisma.customer.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        companySize: true,
        jobTitle: true,
        address: true,
        city: true,
        postcode: true,
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try JWT authentication first (email/password users)
    const studentFromJWT = await getStudentFromRequest(request)

    let userEmail: string | undefined
    let customerId: string | undefined

    if (studentFromJWT) {
      // Email/password user - we have their ID from JWT
      userEmail = studentFromJWT.email
      customerId = studentFromJWT.id
    } else {
      // Fall back to NextAuth session (Google Sign-In users)
      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      userEmail = session.user.email
      // Find customer to get their ID
      const customer = await prisma.customer.findFirst({
        where: { email: userEmail }
      })
      customerId = customer?.id
    }

    if (!userEmail || !customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { firstName, lastName, phone, company, companySize, jobTitle, address, city, postcode } = data

    // Update customer by ID (which is unique)
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName,
        lastName,
        phone,
        company,
        companySize,
        jobTitle,
        address,
        city,
        postcode,
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}