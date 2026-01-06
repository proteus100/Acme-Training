import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '../../../../lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// GET handler for Stripe webhook URL validation
export async function GET() {
  return NextResponse.json({
    message: 'TrainKit Stripe Webhook Endpoint',
    status: 'active'
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    // Log the event for debugging
    await prisma.subscriptionEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        data: JSON.stringify(event.data),
        processed: false
      }
    })

    switch (event.type) {
      // Booking payment events
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleSuccessfulPayment(paymentIntent)
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleFailedPayment(paymentIntent)
        break
      }

      // Subscription billing events
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(subscription)
        break
      }

      case 'invoice.created': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoiceCreated(invoice)
        break
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoiceFinalized(invoice)
        break
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    // Mark event as processed
    await prisma.subscriptionEvent.update({
      where: { stripeEventId: event.id },
      data: { 
        processed: true,
        processedAt: new Date()
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  // Check if it's a bundle or single course booking
  const bookingType = paymentIntent.metadata.bookingType
  const bundleBookingId = paymentIntent.metadata.bundleBookingId
  const bookingId = paymentIntent.metadata.bookingId

  if (bookingType === 'bundle' && bundleBookingId) {
    return handleSuccessfulBundlePayment(paymentIntent, bundleBookingId)
  } else if (bookingId) {
    return handleSuccessfulCoursePayment(paymentIntent, bookingId)
  } else {
    console.error('[Stripe Webhook] No booking ID found in payment intent metadata')
    return
  }
}

async function handleSuccessfulCoursePayment(paymentIntent: Stripe.PaymentIntent, bookingId: string) {
  try {
    console.log(`[Stripe Webhook] Processing successful payment for booking: ${bookingId}`)

    // Update booking with payment success
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED'
      },
      include: {
        session: {
          include: {
            course: true
          }
        },
        customer: true
      }
    })

    console.log(`[Stripe Webhook] Booking ${bookingId} confirmed for customer: ${booking.customer.email}`)

    // Update session booked spots
    await prisma.courseSession.update({
      where: { id: booking.sessionId },
      data: {
        bookedSpots: {
          increment: 1
        }
      }
    })

    // Update payment record status
    await prisma.payment.updateMany({
      where: {
        bookingId: booking.id,
        stripePaymentIntentId: paymentIntent.id
      },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    })

    console.log(`[Stripe Webhook] Payment successful for booking ${bookingId}`)
    console.log(`[Stripe Webhook] - Course: ${booking.session.course.title}`)
    console.log(`[Stripe Webhook] - Amount: £${paymentIntent.amount_received / 100}`)
    console.log(`[Stripe Webhook] - Customer: ${booking.customer.email}`)

    // TODO: Send confirmation email to customer

  } catch (error) {
    console.error('Error updating booking after successful payment:', error)
  }
}

async function handleSuccessfulBundlePayment(paymentIntent: Stripe.PaymentIntent, bundleBookingId: string) {
  try {
    console.log(`[Stripe Webhook] Processing successful payment for bundle booking: ${bundleBookingId}`)

    // Update bundle booking with payment success
    const bundleBooking = await prisma.bundleBooking.update({
      where: { id: bundleBookingId },
      data: {
        status: 'CONFIRMED'
      },
      include: {
        bundle: true,
        customer: true,
        sessions: {
          include: {
            session: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    console.log(`[Stripe Webhook] Bundle booking ${bundleBookingId} confirmed for customer: ${bundleBooking.customer.email}`)

    // Update booked spots for all sessions in the bundle
    for (const sessionBooking of bundleBooking.sessions) {
      await prisma.courseSession.update({
        where: { id: sessionBooking.sessionId },
        data: {
          bookedSpots: {
            increment: 1
          }
        }
      })
      console.log(`[Stripe Webhook] - Incremented booked spots for session: ${sessionBooking.session.course.title}`)
    }

    // Update payment record status
    await prisma.bundlePayment.updateMany({
      where: {
        bundleBookingId: bundleBooking.id,
        stripePaymentIntentId: paymentIntent.id
      },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    })

    console.log(`[Stripe Webhook] Bundle payment successful for booking ${bundleBookingId}`)
    console.log(`[Stripe Webhook] - Bundle: ${bundleBooking.bundle.title}`)
    console.log(`[Stripe Webhook] - Courses: ${bundleBooking.sessions.length}`)
    console.log(`[Stripe Webhook] - Amount: £${paymentIntent.amount_received / 100}`)
    console.log(`[Stripe Webhook] - Customer: ${bundleBooking.customer.email}`)

    // TODO: Send confirmation email to customer

  } catch (error) {
    console.error('Error updating bundle booking after successful payment:', error)
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const bookingType = paymentIntent.metadata.bookingType
  const bundleBookingId = paymentIntent.metadata.bundleBookingId
  const bookingId = paymentIntent.metadata.bookingId

  try {
    if (bookingType === 'bundle' && bundleBookingId) {
      // Mark bundle booking as cancelled
      await prisma.bundleBooking.update({
        where: { id: bundleBookingId },
        data: {
          status: 'CANCELLED'
        }
      })
      console.log(`[Stripe Webhook] Bundle payment failed for booking ${bundleBookingId}`)
    } else if (bookingId) {
      // Mark booking as payment failed
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED'
        }
      })
      console.log(`[Stripe Webhook] Payment failed for booking ${bookingId}`)
    }
  } catch (error) {
    console.error('Error updating booking after failed payment:', error)
  }
}

// Subscription billing handlers
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const tenantId = subscription.metadata.tenantId
    if (!tenantId) {
      console.error('No tenantId in subscription metadata')
      return
    }

    await prisma.tenantSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      },
      create: {
        tenantId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id || '',
        stripeCustomerId: subscription.customer as string,
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    })

    console.log(`Subscription created for tenant: ${tenantId}`)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const existingSubscription = await prisma.tenantSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { tenant: true }
    })

    if (!existingSubscription) {
      console.error(`Subscription not found: ${subscription.id}`)
      return
    }

    // Update subscription
    await prisma.tenantSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripePriceId: subscription.items.data[0]?.price.id || existingSubscription.stripePriceId
      }
    })

    // Update tenant status
    await prisma.tenant.update({
      where: { id: existingSubscription.tenantId },
      data: {
        subscriptionStatus: subscription.status as any,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        active: subscription.status === 'active' || subscription.status === 'trialing'
      }
    })

    console.log(`Subscription updated for tenant: ${existingSubscription.tenantId}`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const existingSubscription = await prisma.tenantSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { tenant: true }
    })

    if (!existingSubscription) {
      console.error(`Subscription not found: ${subscription.id}`)
      return
    }

    // Update subscription status
    await prisma.tenantSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date()
      }
    })

    // Deactivate tenant
    await prisma.tenant.update({
      where: { id: existingSubscription.tenantId },
      data: {
        subscriptionStatus: 'CANCELED',
        active: false
      }
    })

    console.log(`Subscription cancelled for tenant: ${existingSubscription.tenantId}`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { tenant: true }
    })

    if (!subscription) {
      console.error(`Subscription not found for invoice: ${invoice.id}`)
      return
    }

    // Create/update invoice record
    await prisma.subscriptionInvoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status: 'PAID',
        amountPaid: invoice.amount_paid / 100,
        paidAt: new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()),
        invoiceUrl: invoice.hosted_invoice_url
      },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        status: 'PAID',
        amountPaid: invoice.amount_paid / 100,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        paidAt: new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        invoiceUrl: invoice.hosted_invoice_url
      }
    })

    // Ensure tenant is active for successful payments
    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        active: true,
        subscriptionStatus: 'ACTIVE'
      }
    })

    console.log(`Payment succeeded for tenant: ${subscription.tenantId}`)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { tenant: true }
    })

    if (!subscription) {
      console.error(`Subscription not found for invoice: ${invoice.id}`)
      return
    }

    // Update invoice record
    await prisma.subscriptionInvoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status: 'OPEN',
        amountDue: invoice.amount_due / 100
      },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        status: 'OPEN',
        amountPaid: invoice.amount_paid / 100,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        invoiceUrl: invoice.hosted_invoice_url
      }
    })

    // Update tenant status to past due
    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        subscriptionStatus: 'PAST_DUE'
      }
    })

    console.log(`Payment failed for tenant: ${subscription.tenantId}`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const existingSubscription = await prisma.tenantSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { tenant: true }
    })

    if (!existingSubscription) {
      console.error(`Subscription not found: ${subscription.id}`)
      return
    }

    // Here you could send notification emails to the tenant
    console.log(`Trial ending soon for tenant: ${existingSubscription.tenantId}`)
  } catch (error) {
    console.error('Error handling trial will end:', error)
  }
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return

    const subscription = await prisma.tenantSubscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string }
    })

    if (!subscription) {
      console.error(`Subscription not found for invoice: ${invoice.id}`)
      return
    }

    // Create invoice record
    await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        status: invoice.status?.toUpperCase() as any || 'DRAFT',
        amountPaid: invoice.amount_paid / 100,
        amountDue: invoice.amount_due / 100,
        currency: invoice.currency,
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        invoiceUrl: invoice.hosted_invoice_url
      }
    })

    console.log(`Invoice created: ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice created:', error)
  }
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  try {
    await prisma.subscriptionInvoice.update({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'OPEN',
        invoiceUrl: invoice.hosted_invoice_url
      }
    })

    console.log(`Invoice finalized: ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice finalized:', error)
  }
}