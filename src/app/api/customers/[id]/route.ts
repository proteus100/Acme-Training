import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          include: {
            session: {
              include: {
                course: {
                  select: {
                    title: true,
                    duration: true,
                    price: true
                  }
                }
              }
            },
            payments: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' }, 
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' }, 
        { status: 404 }
      )
    }

    // Check if email is taken by another customer
    if (data.email !== existingCustomer.email) {
      const emailTaken = await prisma.customer.findFirst({
        where: { 
          email: data.email,
          NOT: { id: params.id }
        }
      })

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email already in use by another customer' },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          include: {
            payments: true
          }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' }, 
        { status: 404 }
      )
    }

    // Check if customer has active bookings
    const activeBookings = existingCustomer.bookings.filter(
      booking => booking.status === 'CONFIRMED' || booking.status === 'PENDING'
    )

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete customer with active bookings',
          activeBookings: activeBookings.length
        },
        { status: 409 }
      )
    }

    // Delete customer (this will cascade delete bookings and payments)
    await prisma.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' }, 
      { status: 500 }
    )
  }
}