import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// GET /api/subscriptions - Get all active subscriptions
export async function GET() {
  try {
    const subscriptions = await prisma.tenantSubscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            planType: true,
            active: true,
            createdAt: true
          }
        },
        invoices: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      subscriptions
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions - Create new subscription for tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, planType = 'STARTER', trialDays = 14 } = body

    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if tenant already has a subscription
    const existingSubscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Tenant already has a subscription' },
        { status: 409 }
      )
    }

    // Create or get Stripe customer
    let stripeCustomer = null
    if (tenant.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(tenant.stripeCustomerId)
    } else {
      stripeCustomer = await stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug
        }
      })

      // Update tenant with Stripe customer ID
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { 
          stripeCustomerId: stripeCustomer.id,
          subscriptionStatus: 'TRIAL'
        }
      })
    }

    // Get price ID for plan type
    const priceIds = {
      STARTER: process.env.STRIPE_STARTER_PRICE_ID,
      PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID
    }

    const stripePriceId = priceIds[planType as keyof typeof priceIds]
    if (!stripePriceId) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Create Stripe subscription with trial
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + trialDays)

    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{
        price: stripePriceId
      }],
      trial_end: Math.floor(trialEndDate.getTime() / 1000),
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      },
      expand: ['latest_invoice', 'customer']
    })

    // Create subscription record in database
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId,
        stripeCustomerId: stripeCustomer.id,
        status: 'TRIAL',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: new Date(),
        trialEnd: trialEndDate
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            planType: true
          }
        }
      }
    })

    // Update tenant subscription status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planType,
        subscriptionStatus: 'TRIAL',
        trialEndsAt: trialEndDate,
        subscriptionId: subscription.id
      }
    })

    return NextResponse.json({
      success: true,
      subscription,
      stripeSubscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: stripeSubscription.current_period_start,
        current_period_end: stripeSubscription.current_period_end,
        trial_end: stripeSubscription.trial_end
      }
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}