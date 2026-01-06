import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { generateTenantWelcomeEmail } from '@/lib/email-templates'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if admin user already exists
    let adminUser = await prisma.adminUser.findFirst({
      where: {
        tenantId: tenant.id,
        role: 'MANAGER'
      }
    })

    let tempPassword: string | null = null

    // If no admin user exists, create one
    if (!adminUser) {
      tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)
      const hashedPassword = await hashPassword(tempPassword)

      adminUser = await prisma.adminUser.create({
        data: {
          email: tenant.email,
          passwordHash: hashedPassword,
          firstName: tenant.name.split(' ')[0] || 'Admin',
          lastName: tenant.name.split(' ')[1] || 'User',
          role: 'MANAGER',
          tenantId: tenant.id,
          isActive: true
        }
      })
    } else {
      // Reset password for existing admin
      tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16)
      const hashedPassword = await hashPassword(tempPassword)

      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { passwordHash: hashedPassword }
      })
    }

    // Get plan limits
    const getPlanLimits = (plan: string) => {
      switch (plan) {
        case 'STARTER':
          return { maxStudents: 50, maxCourses: 5 }
        case 'PROFESSIONAL':
          return { maxStudents: 150, maxCourses: 15 }
        case 'ENTERPRISE':
          return { maxStudents: 999999, maxCourses: 999999 }
        default:
          return { maxStudents: 50, maxCourses: 5 }
      }
    }

    const { maxStudents, maxCourses } = getPlanLimits(tenant.planType)

    // Send welcome email with credentials
    const welcomeEmail = generateTenantWelcomeEmail({
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      adminEmail: tenant.email,
      adminPassword: tempPassword!,
      planType: tenant.planType,
      maxStudents: maxStudents,
      maxCourses: maxCourses
    })

    await sendEmail({
      to: tenant.email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      text: welcomeEmail.text
    })

    return NextResponse.json({
      success: true,
      message: `Welcome email sent to ${tenant.email}`,
      adminCreated: !adminUser,
      passwordReset: !!adminUser
    })

  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send welcome email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
