import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get tenant slug from middleware header
    const tenantSlug = request.headers.get('x-tenant-slug')

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Unable to determine tenant' },
        { status: 400 }
      )
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 404 }
      )
    }

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase()
      }
    })

    // Always return success for security (don't reveal if email exists)
    if (!customer) {
      console.log('Password reset requested for non-existent email:', email)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.'
      })
    }

    // Allow password reset for both email/password AND Google accounts
    // Google accounts can add password login this way
    const isGoogleAccount = !customer.password

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token: resetToken,
        expiresAt,
        used: false
      }
    })

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const resetUrl = `https://${tenantSlug}.trainkit.co.uk/student/reset-password?token=${resetToken}`

    const emailSubject = isGoogleAccount
      ? `Set Password for Your Account - ${tenant.name}`
      : `Password Reset - ${tenant.name}`

    const emailHeading = isGoogleAccount
      ? 'Set Your Password'
      : 'Password Reset Request'

    const emailMessage = isGoogleAccount
      ? `We received a request to set a password for your ${tenant.name} student account. This will allow you to login with your email and password in addition to Google Sign-In.`
      : `We received a request to reset your password for your ${tenant.name} student account.`

    const buttonText = isGoogleAccount ? 'Set Password' : 'Reset Password'

    await transporter.sendMail({
      from: `"${tenant.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${tenant.primaryColor} 0%, ${tenant.secondaryColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${emailHeading}</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${customer.firstName}</strong>,
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              ${emailMessage}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: ${tenant.primaryColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ${buttonText}
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #666; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This link will expire in 1 hour.
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn't request this, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              ${tenant.name}<br>
              ${tenant.email}${tenant.phone ? ` | ${tenant.phone}` : ''}
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${emailHeading}

        Hello ${customer.firstName},

        ${emailMessage}

        Click the link below to ${isGoogleAccount ? 'set' : 'reset'} your password:
        ${resetUrl}

        This link will expire in 1 hour.

        If you didn't request this, you can safely ignore this email.

        ${tenant.name}
        ${tenant.email}${tenant.phone ? ` | ${tenant.phone}` : ''}
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
