import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()
    
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
    }
    
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }
    
    // Find booking by payment intent ID
    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        customer: true,
        course: true,
        session: true
      }
    })
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Update booking payment status
    const amountPaid = paymentIntent.amount / 100 // Convert from pence to pounds
    
    await prisma.$transaction(async (tx) => {
      // Update booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          amountPaid: amountPaid,
          paymentStatus: booking.totalAmount === amountPaid ? 'PAID' : 'PARTIALLY_PAID'
        }
      })
      
      // Create payment record
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: amountPaid,
          paymentType: booking.depositAmount ? 'DEPOSIT' : 'FULL_PAYMENT',
          paymentMethod: 'card',
          stripeChargeId: paymentIntent.latest_charge as string,
          status: 'PAID',
          processedAt: new Date()
        }
      })
      
      // Update session booking count
      await tx.courseSession.update({
        where: { id: booking.sessionId },
        data: {
          bookedSpots: {
            increment: 1
          }
        }
      })
    })
    
    // TODO: Send confirmation email here
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        course: booking.course.title,
        sessionDate: booking.session.startDate,
        customer: `${booking.customer.firstName} ${booking.customer.lastName}`,
        amountPaid: amountPaid,
        paymentStatus: booking.totalAmount === amountPaid ? 'PAID' : 'PARTIALLY_PAID'
      }
    })
    
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}