import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getTenantFilter, getTenantId } from '../../../lib/tenant'

// GET /api/customers - List all customers with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Get tenant filter for multi-tenancy
    const tenantFilter = await getTenantFilter()

    const where = search ? {
      ...tenantFilter,
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } }
      ]
    } : tenantFilter

    const customers = await prisma.customer.findMany({
      where,
      include: {
        bookings: {
          include: {
            session: {
              include: {
                course: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' }, 
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Get tenantId from the current request context
    let tenantId = await getTenantId()

    // If no tenant detected, try to use provided tenantId (for platform admin)
    if (!tenantId && data.tenantId) {
      tenantId = data.tenantId
    }

    // If still no tenant, find first available tenant (fallback)
    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({
        where: { active: true },
        select: { id: true }
      })
      if (!firstTenant) {
        return NextResponse.json(
          { error: 'No active tenant found' },
          { status: 400 }
        )
      }
      tenantId = firstTenant.id
    }

    // Check if email already exists for this tenant (email is unique per tenant)
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenantId,
          email: data.email
        }
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId: tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        address: data.address || null,
        city: data.city || null,
        postcode: data.postcode || null
      },
      include: {
        bookings: {
          include: {
            session: {
              include: {
                course: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' }, 
      { status: 500 }
    )
  }
}