import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// GET /api/subscriptions/[subscriptionId] - Get subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params
    
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            planType: true,
            active: true,
            maxStudents: true,
            maxCourses: true,
            createdAt: true
          }
        },
        invoices: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get Stripe subscription details
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
      { expand: ['latest_invoice', 'customer'] }
    )

    return NextResponse.json({
      success: true,
      subscription,
      stripeDetails: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: stripeSubscription.current_period_start,
        current_period_end: stripeSubscription.current_period_end,
        trial_end: stripeSubscription.trial_end,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        canceled_at: stripeSubscription.canceled_at,
        latest_invoice: stripeSubscription.latest_invoice
      }
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// PATCH /api/subscriptions/[subscriptionId] - Update subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params
    const body = await request.json()
    const { action, planType } = body

    const subscription = await prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true }
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      )
    }

    let updatedSubscription

    switch (action) {
      case 'cancel':
        // Cancel subscription at period end
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        })

        updatedSubscription = await prisma.tenantSubscription.update({
          where: { id: subscriptionId },
          data: { 
            cancelAtPeriodEnd: true,
            canceledAt: new Date()
          }
        })

        await prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: { cancelAtPeriodEnd: true }
        })
        break

      case 'reactivate':
        // Reactivate cancelled subscription
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false
        })

        updatedSubscription = await prisma.tenantSubscription.update({
          where: { id: subscriptionId },
          data: { 
            cancelAtPeriodEnd: false,
            canceledAt: null
          }
        })

        await prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: { cancelAtPeriodEnd: false }
        })
        break

      case 'change_plan':
        if (!planType) {
          return NextResponse.json(
            { success: false, error: 'Plan type required for plan change' },
            { status: 400 }
          )
        }

        // Get new price ID
        const priceIds = {
          STARTER: process.env.STRIPE_STARTER_PRICE_ID,
          PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
          ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID
        }

        const newPriceId = priceIds[planType as keyof typeof priceIds]
        if (!newPriceId) {
          return NextResponse.json(
            { success: false, error: 'Invalid plan type' },
            { status: 400 }
          )
        }

        // Update Stripe subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        )

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        })

        // Update database
        updatedSubscription = await prisma.tenantSubscription.update({
          where: { id: subscriptionId },
          data: { stripePriceId: newPriceId }
        })

        // Update tenant plan limits
        const planLimits = {
          STARTER: { maxStudents: 50, maxCourses: 5 },
          PROFESSIONAL: { maxStudents: 150, maxCourses: 15 },
          ENTERPRISE: { maxStudents: 999999, maxCourses: 999999 }
        }

        const limits = planLimits[planType as keyof typeof planLimits]
        await prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: { 
            planType,
            maxStudents: limits.maxStudents,
            maxCourses: limits.maxCourses
          }
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

// DELETE /api/subscriptions/[subscriptionId] - Cancel subscription immediately
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params

    const subscription = await prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true }
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Cancel Stripe subscription immediately
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

    // Update database
    const updatedSubscription = await prisma.tenantSubscription.update({
      where: { id: subscriptionId },
      data: { 
        status: 'CANCELED',
        canceledAt: new Date()
      }
    })

    // Deactivate tenant
    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { 
        active: false,
        subscriptionStatus: 'CANCELED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled immediately',
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}