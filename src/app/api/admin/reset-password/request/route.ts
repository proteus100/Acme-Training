import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// POST /api/admin/reset-password/request
// Creates a password reset token and sends email to admin
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if admin exists
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (!admin) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { message: 'If an account exists with that email, a password reset link has been sent' },
        { status: 200 }
      )
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: {
        email,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })

    // Create reset link using tenant subdomain
    const tenantSlug = admin.tenant?.slug
    let resetLink: string

    if (tenantSlug) {
      // Use tenant subdomain
      resetLink = `https://${tenantSlug}.trainkit.co.uk/admin/reset-password?token=${token}`
    } else {
      // Fallback to main domain
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainkit.co.uk'
      resetLink = `${appUrl}/admin/reset-password?token=${token}`
    }

    // Send email with SMTP
    const tenantName = admin.tenant?.name || 'TrainKit'

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'TrainKit <admin@trainkit.co.uk>',
        to: email,
        subject: `Set Your ${tenantName} Admin Password`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Set Your Password</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1e40af;">
                            Welcome to ${tenantName}
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px; color: #374151; font-size: 16px; line-height: 24px;">
                          <p style="margin: 0 0 20px 0;">Hello ${admin.firstName},</p>
                          <p style="margin: 0 0 20px 0;">Your admin account has been created for <strong>${tenantName}</strong>. Please set your password to access your admin dashboard.</p>
                          <p style="margin: 0 0 20px 0;">Click the button below to set your password:</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                          <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #1e40af; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Set Password
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px; color: #6b7280; font-size: 14px; line-height: 20px;">
                          <p style="margin: 0 0 12px 0;">Or copy and paste this link into your browser:</p>
                          <p style="margin: 0; word-break: break-all; color: #1e40af;">
                            ${resetLink}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px; color: #9ca3af; font-size: 13px; line-height: 18px; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 8px 0;">This link will expire in 1 hour.</p>
                          <p style="margin: 0;">If you didn't request this, please ignore this email.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px; text-align: center; color: #9ca3af; font-size: 12px;">
                          <p style="margin: 0;">&copy; 2025 TrainKit. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
        text: `
Welcome to ${tenantName}

Hello ${admin.firstName},

Your admin account has been created for ${tenantName}. Please set your password to access your admin dashboard.

Set your password by visiting this link:
${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

© 2025 TrainKit. All rights reserved.
        `
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success to user (don't reveal if email failed)
    }

    return NextResponse.json(
      { message: 'If an account exists with that email, a password reset link has been sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating password reset token:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
