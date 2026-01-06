import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { generateTenantWelcomeEmail } from '@/lib/email-templates'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// POST /api/onboarding - Complete tenant onboarding with payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Company details
      companyName,
      email,
      phone,
      address,
      city,
      postcode,
      county,
      website,
      
      // Business details
      businessType,
      mainServices,
      serviceAreas,
      yearsExperience,
      accreditations,
      
      // SEO & Content
      metaTitle,
      metaDescription,
      heroHeading,
      heroSubheading,
      aboutText,
      whyChooseUs,
      
      // Subscription details
      planType = 'STARTER',
      paymentMethodId, // Stripe payment method ID
      billingAddress,
      
      // Location data
      latitude,
      longitude,
      nearbyAreas,

      // Admin user details
      adminFirstName,
      adminLastName,
      adminEmail
    } = body

    // Validate required fields
    if (!companyName || !email || !planType) {
      return NextResponse.json(
        { success: false, error: 'Company name, email, and plan type are required' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Ensure slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })
    
    if (existingTenant) {
      slug = `${slug}-${nanoid(6)}`
    }

    // Check email uniqueness
    const existingEmail = await prisma.tenant.findFirst({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name: companyName,
      phone,
      address: billingAddress || {
        line1: address,
        city,
        postal_code: postcode,
        country: 'GB'
      },
      metadata: {
        companyName,
        tenantSlug: slug
      }
    })

    // Attach payment method to customer if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.id,
      })

      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // Get plan pricing and limits
    const planDetails = {
      STARTER: { 
        maxStudents: 50, 
        maxCourses: 5,
        priceId: process.env.STRIPE_STARTER_PRICE_ID 
      },
      PROFESSIONAL: { 
        maxStudents: 150, 
        maxCourses: 15,
        priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID 
      },
      ENTERPRISE: { 
        maxStudents: 999999, 
        maxCourses: 999999,
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID 
      }
    }

    const selectedPlan = planDetails[planType as keyof typeof planDetails]
    if (!selectedPlan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Create tenant in database
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        email,
        phone,
        address,
        city,
        postcode,
        county,
        website,
        businessType,
        mainServices: mainServices ? JSON.stringify(mainServices) : null,
        serviceAreas: serviceAreas ? JSON.stringify(serviceAreas) : null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        accreditations: accreditations ? JSON.stringify(accreditations) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        heroHeading: heroHeading || null,
        heroSubheading: heroSubheading || null,
        aboutText: aboutText || null,
        whyChooseUs: whyChooseUs ? JSON.stringify(whyChooseUs) : null,
        nearbyAreas: nearbyAreas ? JSON.stringify(nearbyAreas) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        planType,
        maxStudents: selectedPlan.maxStudents,
        maxCourses: selectedPlan.maxCourses,
        stripeCustomerId: stripeCustomer.id,
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        active: true
      }
    })

    // Create Stripe subscription with trial
    const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{
        price: selectedPlan.priceId
      }],
      trial_end: Math.floor(trialEndDate.getTime() / 1000),
      metadata: {
        tenantId: tenant.id,
        tenantSlug: slug,
        companyName
      },
      expand: ['latest_invoice']
    })

    // Create subscription record
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: selectedPlan.priceId!,
        stripeCustomerId: stripeCustomer.id,
        status: 'TRIAL',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: new Date(),
        trialEnd: trialEndDate
      }
    })

    // Update tenant with subscription ID
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionId: subscription.id }
    })

    // Create default tenant settings
    await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        emailFromName: companyName,
        emailFromAddress: email,
        bookingWindowDays: 30,
        cancellationHours: 24,
        depositPercentage: 0.3
      }
    })

    // Create sample course for new tenant (optional)
    await prisma.course.create({
      data: {
        tenantId: tenant.id,
        title: 'Gas Safe Training Course',
        description: 'Comprehensive gas safety training course covering all essential topics for gas engineers.',
        category: 'GAS_SAFE',
        duration: 5,
        price: 450.00,
        maxStudents: 12
      }
    })

    // Create tenant admin account if admin details provided
    let adminUser = null
    let tempPassword: string | null = null

    if (adminFirstName && adminLastName && adminEmail) {
      // Generate secure temporary password
      tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)
      const hashedPassword = await hashPassword(tempPassword)

      // Create admin user with temporary password
      adminUser = await prisma.adminUser.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash: hashedPassword,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'MANAGER',
          isActive: true
        }
      })

      // Send comprehensive welcome email with login credentials
      try {
        const welcomeEmail = generateTenantWelcomeEmail({
          tenantName: companyName,
          tenantSlug: slug,
          adminEmail: adminEmail,
          adminPassword: tempPassword,
          planType: planType,
          maxStudents: selectedPlan.maxStudents,
          maxCourses: selectedPlan.maxCourses
        })

        await sendEmail({
          to: adminEmail,
          subject: welcomeEmail.subject,
          html: welcomeEmail.html,
          text: welcomeEmail.text
        })

        console.log(`Welcome email sent to ${adminEmail}`)
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the whole onboarding if email fails
      }
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        planType: tenant.planType,
        trialEndsAt: tenant.trialEndsAt,
        adminUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin`,
        publicUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trialEnd,
        stripeSubscriptionId: stripeSubscription.id
      },
      stripe: {
        customerId: stripeCustomer.id,
        subscriptionId: stripeSubscription.id
      },
      admin: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        resetEmailSent: true
      } : null
    })

  } catch (error) {
    console.error('Error during onboarding:', error)
    
    // If we get a Stripe error, provide more specific feedback
    if (error instanceof Error && error.message.includes('card')) {
      return NextResponse.json(
        { success: false, error: 'Payment failed. Please check your card details.' },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

// GET /api/onboarding/check-slug - Check if slug is available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter required' },
        { status: 400 }
      )
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    return NextResponse.json({
      success: true,
      available: !existingTenant,
      slug
    })

  } catch (error) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check slug availability' },
      { status: 500 }
    )
  }
}