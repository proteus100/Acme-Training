import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/provision-tenant - Automate tenant setup after successful onboarding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, setupType = 'standard' } = body

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
        settings: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const provisioningResults = {
      tenantId: tenant.id,
      slug: tenant.slug,
      setupType,
      results: {
        courses: 0,
        emailTemplates: 0,
        certificationRules: 0,
        adminUser: false,
        sampleData: false
      }
    }

    // Create default courses based on business type
    const courseTemplates = getDefaultCourses(tenant.businessType, setupType)
    
    for (const courseTemplate of courseTemplates) {
      try {
        await prisma.course.create({
          data: {
            tenantId: tenant.id,
            title: courseTemplate.title,
            description: courseTemplate.description,
            category: courseTemplate.category,
            duration: courseTemplate.duration,
            price: courseTemplate.price,
            maxStudents: courseTemplate.maxStudents || 12
          }
        })
        provisioningResults.results.courses++
      } catch (error) {
        console.error(`Error creating course ${courseTemplate.title}:`, error)
      }
    }

    // Create default email templates
    const emailTemplates = getDefaultEmailTemplates()
    
    for (const template of emailTemplates) {
      try {
        await prisma.emailTemplate.create({
          data: {
            tenantId: tenant.id,
            name: template.name,
            category: template.category,
            reminderType: template.reminderType,
            subject: template.subject.replace('{{companyName}}', tenant.name),
            htmlContent: template.htmlContent.replace(/{{companyName}}/g, tenant.name),
            textContent: template.textContent.replace(/{{companyName}}/g, tenant.name),
            isActive: true
          }
        })
        provisioningResults.results.emailTemplates++
      } catch (error) {
        console.error(`Error creating email template ${template.name}:`, error)
      }
    }

    // Create certification rules
    const certificationRules = getDefaultCertificationRules()
    
    for (const rule of certificationRules) {
      try {
        // Check if rule already exists (global rules)
        const existingRule = await prisma.certificationRule.findUnique({
          where: { category: rule.category }
        })

        if (!existingRule) {
          await prisma.certificationRule.create({
            data: rule
          })
          provisioningResults.results.certificationRules++
        }
      } catch (error) {
        console.error(`Error creating certification rule for ${rule.category}:`, error)
      }
    }

    // Create default admin user if requested
    if (setupType === 'full' && tenant.email) {
      try {
        const adminUser = await prisma.adminUser.create({
          data: {
            email: tenant.email,
            passwordHash: '$2a$10$temporary.hash.needs.to.be.set.manually',
            firstName: 'Admin',
            lastName: 'User',
            role: 'MANAGER',
            isActive: false // Will need to set password on first login
          }
        })
        provisioningResults.results.adminUser = true
      } catch (error) {
        console.error('Error creating admin user:', error)
      }
    }

    // Create sample sessions if requested
    if (setupType === 'demo') {
      try {
        const courses = await prisma.course.findMany({
          where: { tenantId: tenant.id },
          take: 2
        })

        for (const course of courses) {
          // Create a sample session for next month
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() + 1)
          startDate.setDate(15) // 15th of next month
          
          const endDate = new Date(startDate)
          if (course.duration > 1) {
            endDate.setDate(endDate.getDate() + course.duration - 1)
          }

          await prisma.courseSession.create({
            data: {
              tenantId: tenant.id,
              courseId: course.id,
              startDate,
              endDate,
              startTime: '09:00',
              endTime: '17:00',
              availableSpots: course.maxStudents,
              bookedSpots: 0,
              isActive: true,
              instructorNotes: 'Sample session - update details as needed'
            }
          })
        }
        provisioningResults.results.sampleData = true
      } catch (error) {
        console.error('Error creating sample sessions:', error)
      }
    }

    // Update tenant status to indicate provisioning is complete
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        // Could add a 'provisionedAt' field to track when setup was completed
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tenant provisioning completed successfully',
      provisioning: provisioningResults,
      urls: {
        adminDashboard: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/admin`,
        publicSite: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}`,
        coursesManagement: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/admin/courses`
      }
    })

  } catch (error) {
    console.error('Error provisioning tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to provision tenant' },
      { status: 500 }
    )
  }
}

// Default course templates based on business type
function getDefaultCourses(businessType?: string, setupType?: string) {
  const baseGasCourses = [
    {
      title: 'Gas Safety Training - CCN1',
      description: 'Core Gas Safety course covering all essential topics for gas engineers.',
      category: 'GAS_SAFE' as const,
      duration: 5,
      price: 450.00
    },
    {
      title: 'Domestic Gas Safety - CEN1',
      description: 'Domestic central heating and hot water systems installation and maintenance.',
      category: 'GAS_SAFE' as const,
      duration: 3,
      price: 350.00
    }
  ]

  const heatPumpCourses = [
    {
      title: 'Heat Pump Installation Training',
      description: 'Comprehensive training on air source heat pump installation and commissioning.',
      category: 'HEAT_PUMP' as const,
      duration: 2,
      price: 650.00
    }
  ]

  const electricalCourses = [
    {
      title: '18th Edition Wiring Regulations',
      description: 'Current electrical installation standards and regulations.',
      category: 'ELECTRICAL' as const,
      duration: 3,
      price: 295.00
    }
  ]

  // Return different course sets based on business type
  switch (businessType?.toLowerCase()) {
    case 'gas safety training':
    case 'gas training':
      return setupType === 'full' ? 
        [...baseGasCourses, ...heatPumpCourses] : 
        baseGasCourses
    
    case 'electrical training':
      return electricalCourses
    
    case 'heat pump training':
      return heatPumpCourses
    
    default:
      // Mixed training center
      return setupType === 'full' ? 
        [...baseGasCourses, ...heatPumpCourses, ...electricalCourses] : 
        baseGasCourses
  }
}

// Default email templates
function getDefaultEmailTemplates() {
  return [
    {
      name: 'Booking Confirmation',
      category: null,
      reminderType: 'CUSTOM' as const,
      subject: 'Training Booking Confirmed - {{companyName}}',
      htmlContent: `
        <h2>Booking Confirmed</h2>
        <p>Dear {{customerName}},</p>
        <p>Your booking for <strong>{{courseTitle}}</strong> has been confirmed.</p>
        <h3>Session Details:</h3>
        <ul>
          <li>Date: {{sessionDate}}</li>
          <li>Time: {{sessionTime}}</li>
          <li>Duration: {{courseDuration}} days</li>
          <li>Price: £{{coursePrice}}</li>
        </ul>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>{{companyName}}</p>
      `,
      textContent: `
        Booking Confirmed
        
        Dear {{customerName}},
        
        Your booking for {{courseTitle}} has been confirmed.
        
        Session Details:
        - Date: {{sessionDate}}
        - Time: {{sessionTime}}
        - Duration: {{courseDuration}} days
        - Price: £{{coursePrice}}
        
        If you have any questions, please contact us.
        
        Best regards,
        {{companyName}}
      `
    },
    {
      name: 'Certificate Expiry - 6 Months',
      category: 'GAS_SAFE' as const,
      reminderType: 'SIX_MONTHS' as const,
      subject: 'Certificate Expiry Reminder - {{companyName}}',
      htmlContent: `
        <h2>Certificate Expiry Reminder</h2>
        <p>Dear {{customerName}},</p>
        <p>Your <strong>{{certificateType}}</strong> certificate is due to expire in 6 months on {{expiryDate}}.</p>
        <p>To maintain your qualifications, please book a refresher course soon.</p>
        <p>Contact us to book your training.</p>
        <p>Best regards,<br>{{companyName}}</p>
      `,
      textContent: `
        Certificate Expiry Reminder
        
        Dear {{customerName}},
        
        Your {{certificateType}} certificate is due to expire in 6 months on {{expiryDate}}.
        
        To maintain your qualifications, please book a refresher course soon.
        
        Contact us to book your training.
        
        Best regards,
        {{companyName}}
      `
    }
  ]
}

// Default certification rules
function getDefaultCertificationRules() {
  return [
    {
      category: 'GAS_SAFE' as const,
      validityYears: 5,
      reminderMonths: '12,6,3,1',
      isActive: true
    },
    {
      category: 'HEAT_PUMP' as const,
      validityYears: 5,
      reminderMonths: '6,3,1',
      isActive: true
    },
    {
      category: 'ELECTRICAL' as const,
      validityYears: 3,
      reminderMonths: '6,3,1',
      isActive: true
    },
    {
      category: 'OFTEC' as const,
      validityYears: 5,
      reminderMonths: '6,3,1',
      isActive: true
    }
  ]
}