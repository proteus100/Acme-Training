import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Schema for single course booking
const createPaymentSchema = z.object({
  courseId: z.string(),
  sessionId: z.string(),
  customer: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    company: z.string().optional(),
    address: z.string(),
    postcode: z.string(),
    specialRequests: z.string().optional()
  }),
  paymentType: z.enum(['full', 'deposit'])
})

// Schema for bundle booking
const createBundlePaymentSchema = z.object({
  bundleId: z.string(),
  sessionSelections: z.array(z.object({
    courseId: z.string(),
    sessionId: z.string()
  })),
  customer: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    company: z.string().optional(),
    address: z.string(),
    postcode: z.string(),
    specialRequests: z.string().optional()
  }),
  paymentType: z.enum(['full', 'deposit'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Determine if it's a bundle or single course booking
    const isBundle = 'bundleId' in body

    if (isBundle) {
      return handleBundleBooking(body)
    } else {
      return handleSingleCourseBooking(body)
    }

  } catch (error) {
    console.error('Error creating payment intent:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}

// Handle single course booking
async function handleSingleCourseBooking(body: any) {
  const data = createPaymentSchema.parse(body)

  // Get course and session details
  const course = await prisma.course.findUnique({
    where: { id: data.courseId }
  })

  const session = await prisma.courseSession.findUnique({
    where: { id: data.sessionId }
  })

  if (!course || !session) {
    return NextResponse.json({ error: 'Course or session not found' }, { status: 404 })
  }

  // Check availability
  if (session.bookedSpots >= session.availableSpots) {
    return NextResponse.json({ error: 'Session is fully booked' }, { status: 400 })
  }

  // Calculate amount
  const amount = data.paymentType === 'full' ? course.price : course.price * 0.3
  const amountInPence = Math.round(amount * 100)

  // Create or find customer (scoped to tenant)
  let customer = await prisma.customer.findFirst({
    where: {
      email: data.customer.email,
      tenantId: course.tenantId
    }
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: course.tenantId,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        email: data.customer.email,
        phone: data.customer.phone,
        company: data.customer.company,
        address: data.customer.address,
        postcode: data.customer.postcode
      }
    })
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      tenantId: course.tenantId,
      customerId: customer.id,
      sessionId: session.id,
      totalAmount: course.price,
      depositAmount: data.paymentType === 'deposit' ? amount : null,
      status: 'PENDING',
      specialRequests: data.customer.specialRequests
    }
  })

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPence,
    currency: 'gbp',
    metadata: {
      bookingId: booking.id,
      bookingType: 'course',
      courseTitle: course.title,
      customerEmail: customer.email,
      paymentType: data.paymentType
    },
    description: `${course.title} - ${data.customer.firstName} ${data.customer.lastName}`,
    receipt_email: customer.email
  })

  // Create payment record
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: amount,
      status: 'PENDING',
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: 'card'
    }
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    bookingId: booking.id,
    amount: amount
  })
}

// Handle bundle booking
async function handleBundleBooking(body: any) {
  const data = createBundlePaymentSchema.parse(body)

  console.log('[Payment Intent] Creating bundle booking:', data.bundleId)

  // Get bundle details
  const bundle = await prisma.bundle.findUnique({
    where: { id: data.bundleId },
    include: {
      courses: {
        include: {
          course: true
        }
      }
    }
  })

  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
  }

  // Verify all session selections are valid and available
  for (const selection of data.sessionSelections) {
    const session = await prisma.courseSession.findUnique({
      where: { id: selection.sessionId }
    })

    if (!session) {
      return NextResponse.json({
        error: `Session ${selection.sessionId} not found`
      }, { status: 404 })
    }

    if (session.bookedSpots >= session.availableSpots) {
      return NextResponse.json({
        error: `Session for course ${selection.courseId} is fully booked`
      }, { status: 400 })
    }
  }

  // Calculate amount
  const amount = data.paymentType === 'full' ? bundle.bundlePrice : bundle.bundlePrice * 0.3
  const amountInPence = Math.round(amount * 100)

  // Create or find customer
  let customer = await prisma.customer.findFirst({
    where: {
      email: data.customer.email,
      tenantId: bundle.tenantId
    }
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: bundle.tenantId,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        email: data.customer.email,
        phone: data.customer.phone,
        company: data.customer.company,
        address: data.customer.address,
        postcode: data.customer.postcode
      }
    })
  }

  // Create bundle booking with session selections
  const bundleBooking = await prisma.bundleBooking.create({
    data: {
      tenantId: bundle.tenantId,
      customerId: customer.id,
      bundleId: bundle.id,
      totalAmount: bundle.bundlePrice,
      depositAmount: data.paymentType === 'deposit' ? amount : null,
      status: 'PENDING',
      specialRequests: data.customer.specialRequests,
      sessions: {
        create: data.sessionSelections.map(selection => ({
          sessionId: selection.sessionId,
          courseId: selection.courseId
        }))
      }
    }
  })

  console.log('[Payment Intent] Bundle booking created:', bundleBooking.id)

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPence,
    currency: 'gbp',
    metadata: {
      bundleBookingId: bundleBooking.id,
      bookingType: 'bundle',
      bundleTitle: bundle.title,
      customerEmail: customer.email,
      paymentType: data.paymentType,
      courseCount: data.sessionSelections.length.toString()
    },
    description: `${bundle.title} (${data.sessionSelections.length} courses) - ${data.customer.firstName} ${data.customer.lastName}`,
    receipt_email: customer.email
  })

  // Create payment record
  await prisma.bundlePayment.create({
    data: {
      bundleBookingId: bundleBooking.id,
      amount: amount,
      status: 'PENDING',
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: 'card'
    }
  })

  console.log('[Payment Intent] Bundle payment intent created:', paymentIntent.id)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    bundleBookingId: bundleBooking.id,
    amount: amount,
    courseCount: data.sessionSelections.length
  })
}