import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
    
    // Create or find customer
    let customer = await prisma.customer.findUnique({
      where: { email: data.customer.email }
    })
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
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
        customerId: customer.id,
        courseId: course.id,
        sessionId: session.id,
        totalAmount: course.price,
        depositAmount: data.paymentType === 'deposit' ? amount : null,
        amountPaid: 0,
        paymentStatus: 'PENDING',
        bookingStatus: 'CONFIRMED',
        specialRequests: data.customer.specialRequests,
        notes: `Payment type: ${data.paymentType}`
      }
    })
    
    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      metadata: {
        bookingId: booking.id,
        courseTitle: course.title,
        customerEmail: customer.email,
        paymentType: data.paymentType
      },
      description: `${course.title} - ${data.customer.firstName} ${data.customer.lastName}`,
      receipt_email: customer.email
    })
    
    // Update booking with payment intent ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripePaymentIntentId: paymentIntent.id }
    })
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      amount: amount
    })
    
  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}