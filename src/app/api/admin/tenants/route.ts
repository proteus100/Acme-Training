import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { generateTenantWelcomeEmail } from '@/lib/email-templates'
import crypto from 'crypto'

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            customers: true,
            courses: true,
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      tenants
    })

  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tenants' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      name, 
      slug, 
      email, 
      domain,
      phone,
      address,
      city,
      postcode,
      planType = 'STARTER',
      primaryColor = '#1e40af',
      secondaryColor = '#dc2626',
      // SEO fields
      businessType,
      mainServices,
      serviceAreas,
      yearsExperience,
      accreditations,
      metaTitle,
      metaDescription,
      metaKeywords,
      businessHours,
      socialLinks,
      county,
      nearbyAreas,
      latitude,
      longitude,
      heroHeading,
      heroSubheading,
      aboutText,
      whyChooseUs,
      testimonialText,
      logo
    } = body

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Slug already exists' 
        },
        { status: 400 }
      )
    }

    // Calculate maxStudents and maxCourses based on plan type
    const getPlanLimits = (plan: string) => {
      switch (plan) {
        case 'STARTER': 
          return { maxStudents: 50, maxCourses: 5 }
        case 'PROFESSIONAL': 
          return { maxStudents: 150, maxCourses: 15 }
        case 'ENTERPRISE': 
          return { maxStudents: 999999, maxCourses: 999999 } // Unlimited
        default: 
          return { maxStudents: 50, maxCourses: 5 }
      }
    }

    const { maxStudents, maxCourses } = getPlanLimits(planType)

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        email,
        domain,
        phone,
        address,
        city,
        postcode,
        planType,
        maxStudents,
        maxCourses,
        primaryColor,
        secondaryColor,
        // SEO fields
        businessType,
        mainServices: mainServices ? JSON.stringify(mainServices) : null,
        serviceAreas: serviceAreas ? JSON.stringify(serviceAreas) : null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        accreditations: accreditations ? JSON.stringify(accreditations) : null,
        metaTitle,
        metaDescription,
        metaKeywords,
        businessHours: businessHours ? JSON.stringify(businessHours) : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        county,
        nearbyAreas: nearbyAreas ? JSON.stringify(nearbyAreas) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        heroHeading,
        heroSubheading,
        aboutText,
        whyChooseUs: whyChooseUs ? JSON.stringify(whyChooseUs) : null,
        testimonialText,
        logo
      }
    })

    // Create default tenant settings
    await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        emailFromName: name,
        emailFromAddress: email
      }
    })

    // Generate secure temporary password
    const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)
    const hashedPassword = await hashPassword(tempPassword)

    // Create admin user for the tenant
    const adminUser = await prisma.adminUser.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        firstName: name.split(' ')[0] || 'Admin',
        lastName: name.split(' ')[1] || 'User',
        role: 'MANAGER',
        tenantId: tenant.id,
        isActive: true
      }
    })

    // Send welcome email with credentials
    try {
      const welcomeEmail = generateTenantWelcomeEmail({
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        adminEmail: email,
        adminPassword: tempPassword,
        planType: tenant.planType,
        maxStudents: maxStudents,
        maxCourses: maxCourses
      })

      await sendEmail({
        to: email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
        text: welcomeEmail.text
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the tenant creation if email fails
    }

    return NextResponse.json({
      success: true,
      tenant,
      adminCreated: true,
      message: 'Tenant created successfully. Welcome email sent to ' + email
    })

  } catch (error) {
    console.error('Error creating tenant:', error)

    // Handle specific Prisma errors
    let errorMessage = 'Failed to create tenant'
    let statusCode = 500

    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const meta = 'meta' in error ? error.meta : null
        const field = meta && typeof meta === 'object' && 'target' in meta ? meta.target : 'field'
        errorMessage = `A tenant with this ${field} already exists. Please use a different ${field}.`
        statusCode = 400
      }
    }

    // Include actual error message for better debugging
    if (error instanceof Error) {
      console.error('Detailed error:', error.message)
      if (error.message.includes('email')) {
        errorMessage = 'This email address is already in use. Please use a different email address.'
        statusCode = 400
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: statusCode }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      name, 
      slug, 
      email, 
      domain,
      phone,
      address,
      city,
      postcode,
      planType = 'STARTER',
      active,
      primaryColor = '#1e40af',
      secondaryColor = '#dc2626',
      // SEO fields
      businessType,
      mainServices,
      serviceAreas,
      yearsExperience,
      accreditations,
      metaTitle,
      metaDescription,
      metaKeywords,
      businessHours,
      socialLinks,
      county,
      nearbyAreas,
      latitude,
      longitude,
      heroHeading,
      heroSubheading,
      aboutText,
      whyChooseUs,
      testimonialText,
      logo
    } = body

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tenant ID is required' 
        },
        { status: 400 }
      )
    }

    // Check if slug is unique (excluding current tenant)
    if (slug) {
      const existingTenant = await prisma.tenant.findFirst({
        where: { 
          slug,
          NOT: { id }
        }
      })

      if (existingTenant) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Slug already exists' 
          },
          { status: 400 }
        )
      }
    }

    // Calculate maxStudents and maxCourses based on plan type
    const getPlanLimits = (plan: string) => {
      switch (plan) {
        case 'STARTER': 
          return { maxStudents: 50, maxCourses: 5 }
        case 'PROFESSIONAL': 
          return { maxStudents: 150, maxCourses: 15 }
        case 'ENTERPRISE': 
          return { maxStudents: 999999, maxCourses: 999999 } // Unlimited
        default: 
          return { maxStudents: 50, maxCourses: 5 }
      }
    }

    const { maxStudents, maxCourses } = getPlanLimits(planType)

    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        slug,
        email,
        domain,
        phone,
        address,
        city,
        postcode,
        planType,
        maxStudents,
        ...(active !== undefined && { active }),
        primaryColor,
        secondaryColor,
        // SEO fields
        businessType,
        mainServices: mainServices ? JSON.stringify(mainServices) : null,
        serviceAreas: serviceAreas ? JSON.stringify(serviceAreas) : null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        accreditations: accreditations ? JSON.stringify(accreditations) : null,
        metaTitle,
        metaDescription,
        metaKeywords,
        businessHours: businessHours ? JSON.stringify(businessHours) : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        county,
        nearbyAreas: nearbyAreas ? JSON.stringify(nearbyAreas) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        heroHeading,
        heroSubheading,
        aboutText,
        whyChooseUs: whyChooseUs ? JSON.stringify(whyChooseUs) : null,
        testimonialText,
        logo
      }
    })

    return NextResponse.json({
      success: true,
      tenant
    })

  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update tenant' 
      },
      { status: 500 }
    )
  }
}