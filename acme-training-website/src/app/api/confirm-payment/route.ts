import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
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
    
    // Find payment record by payment intent ID
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        booking: {
          include: {
            customer: true,
            session: {
              include: {
                course: {
                  include: {
                    tenant: true
                  }
                }
              }
            },
            tenant: true
          }
        }
      }
    })

    if (!payment || !payment.booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const booking = payment.booking
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Update payment status
    const amountPaid = paymentIntent.amount / 100 // Convert from pence to pounds

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    })

    // Update booking status
    const totalPaid = await prisma.payment.aggregate({
      where: {
        bookingId: booking.id,
        status: 'PAID'
      },
      _sum: { amount: true }
    })

    const newStatus = (totalPaid._sum.amount || 0) >= booking.totalAmount ? 'CONFIRMED' : 'PENDING'

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: newStatus }
    })

    // Format session details
    const sessionDate = new Date(booking.session.startDate)
    const formattedDate = sessionDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const formattedTime = `${booking.session.startTime} - ${booking.session.endTime}`

    const tenant = booking.tenant
    const course = booking.session.course

    // Send booking confirmation email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `${tenant.name} <noreply@trainkit.co.uk>`,
        to: booking.customer.email,
        subject: `Booking Confirmed - ${course.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: ${tenant.primaryColor}; border-radius: 8px 8px 0 0;">
                          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                            ✓ Booking Confirmed!
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px 40px; color: #374151; font-size: 16px; line-height: 24px;">
                          <p style="margin: 0 0 20px 0;">Dear ${booking.customer.firstName},</p>
                          <p style="margin: 0 0 20px 0;">Thank you for booking with ${tenant.name}! Your payment has been confirmed and your place is secured.</p>

                          <div style="background-color: #f9fafb; border-left: 4px solid ${tenant.primaryColor}; padding: 20px; margin: 20px 0;">
                            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111827;">Course Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Course:</td>
                                <td style="padding: 8px 0; color: #111827;">${course.title}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date:</td>
                                <td style="padding: 8px 0; color: #111827;">${formattedDate}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Time:</td>
                                <td style="padding: 8px 0; color: #111827;">${formattedTime}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Duration:</td>
                                <td style="padding: 8px 0; color: #111827;">${course.duration} days</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Booking ID:</td>
                                <td style="padding: 8px 0; color: #111827; font-family: monospace;">#${booking.id.substring(0, 8).toUpperCase()}</td>
                              </tr>
                            </table>
                          </div>

                          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #065f46;">Payment Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Amount Paid:</td>
                                <td style="padding: 8px 0; color: #111827; font-weight: 700;">£${amountPaid.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Total Course Fee:</td>
                                <td style="padding: 8px 0; color: #111827;">£${booking.totalAmount.toFixed(2)}</td>
                              </tr>
                              ${(totalPaid._sum.amount || 0) < booking.totalAmount ? `
                              <tr>
                                <td style="padding: 8px 0; color: #dc2626; font-weight: 600;">Balance Due:</td>
                                <td style="padding: 8px 0; color: #dc2626; font-weight: 700;">£${(booking.totalAmount - (totalPaid._sum.amount || 0)).toFixed(2)}</td>
                              </tr>
                              ` : ''}
                            </table>
                          </div>

                          ${booking.specialRequests ? `
                          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: 600; color: #92400e;">Your Special Requests:</p>
                            <p style="margin: 5px 0 0 0; color: #78350f;">${booking.specialRequests}</p>
                          </div>
                          ` : ''}

                          <h3 style="margin: 30px 0 15px 0; font-size: 18px; color: #111827;">What to Bring</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #374151;">
                            <li style="margin-bottom: 8px;">Photo ID (driving license or passport)</li>
                            <li style="margin-bottom: 8px;">Appropriate work clothing and safety boots</li>
                            <li style="margin-bottom: 8px;">Pen and notepad for taking notes</li>
                            <li style="margin-bottom: 8px;">Any relevant certificates or documentation</li>
                          </ul>

                          <h3 style="margin: 30px 0 15px 0; font-size: 18px; color: #111827;">Need Help?</h3>
                          <p style="margin: 0 0 10px 0;">If you have any questions, please contact us:</p>
                          <p style="margin: 0; color: #374151;">
                            📧 Email: <a href="mailto:${tenant.email}" style="color: ${tenant.primaryColor};">${tenant.email}</a><br>
                            ${tenant.phone ? `📞 Phone: ${tenant.phone}<br>` : ''}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; text-align: center;">
                            We look forward to seeing you on the course!
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} ${tenant.name}. All rights reserved.<br>
                            Powered by TrainKit Training Management Platform
                          </p>
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
Booking Confirmed - ${course.title}

Dear ${booking.customer.firstName},

Thank you for booking with ${tenant.name}! Your payment has been confirmed and your place is secured.

COURSE DETAILS:
Course: ${course.title}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${course.duration} days
Booking ID: #${booking.id.substring(0, 8).toUpperCase()}

PAYMENT SUMMARY:
Amount Paid: £${amountPaid.toFixed(2)}
Total Course Fee: £${booking.totalAmount.toFixed(2)}
${(totalPaid._sum.amount || 0) < booking.totalAmount ? `Balance Due: £${(booking.totalAmount - (totalPaid._sum.amount || 0)).toFixed(2)}` : ''}

${booking.specialRequests ? `YOUR SPECIAL REQUESTS:\n${booking.specialRequests}\n\n` : ''}

WHAT TO BRING:
- Photo ID (driving license or passport)
- Appropriate work clothing and safety boots
- Pen and notepad for taking notes
- Any relevant certificates or documentation

NEED HELP?
Email: ${tenant.email}
${tenant.phone ? `Phone: ${tenant.phone}` : ''}

We look forward to seeing you on the course!

© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.
Powered by TrainKit Training Management Platform
        `
      })
      console.log('Booking confirmation email sent successfully')
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
    }

    // Create student portal account if doesn't exist
    const existingAccount = await prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: booking.customer.email
        }
      }
    })

    // If customer exists but hasn't logged in before, send welcome email
    if (existingAccount && !existingAccount.emailVerified) {
      // Generate a temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex')
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      // This would normally update password field but Customer model doesn't have password
      // Instead, we'll just send them Google Sign-In instructions

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `${tenant.name} <noreply@trainkit.co.uk>`,
          to: booking.customer.email,
          subject: `Welcome to Your ${tenant.name} Student Portal`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 40px 0;">
                      <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <tr>
                          <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: ${tenant.primaryColor}; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                              🎓 Welcome to Your Student Portal
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 30px 40px; color: #374151; font-size: 16px; line-height: 24px;">
                            <p style="margin: 0 0 20px 0;">Hello ${booking.customer.firstName}!</p>
                            <p style="margin: 0 0 20px 0;">Your booking has been confirmed, and we've created a student portal account for you!</p>

                            <div style="background-color: #dbeafe; border-left: 4px solid ${tenant.primaryColor}; padding: 20px; margin: 20px 0;">
                              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #1e40af;">What You Can Do in Your Portal</h2>
                              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                                <li style="margin-bottom: 10px;">View all your bookings and payment history</li>
                                <li style="margin-bottom: 10px;">Track your certifications and renewal dates</li>
                                <li style="margin-bottom: 10px;">Download certificates when available</li>
                                <li style="margin-bottom: 10px;">Book new courses quickly</li>
                                <li style="margin-bottom: 10px;">Update your profile information</li>
                              </ul>
                            </div>

                            <div style="text-align: center; margin: 30px 0;">
                              <a href="https://${tenant.slug}.trainkit.co.uk/student/login" style="display: inline-block; padding: 14px 32px; background-color: ${tenant.primaryColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Access Your Portal
                              </a>
                            </div>

                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">How to Sign In:</h3>
                              <p style="margin: 0; color: #6b7280;">Use the "Sign in with Google" button and use this email address:</p>
                              <p style="margin: 10px 0 0 0; font-weight: 600; color: #111827;">${booking.customer.email}</p>
                            </div>

                            <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
                              If you have any questions about accessing your portal, please contact us at <a href="mailto:${tenant.email}" style="color: ${tenant.primaryColor};">${tenant.email}</a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                              &copy; ${new Date().getFullYear()} ${tenant.name}. All rights reserved.<br>
                              Powered by TrainKit Training Management Platform
                            </p>
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
Welcome to Your Student Portal - ${tenant.name}

Hello ${booking.customer.firstName}!

Your booking has been confirmed, and we've created a student portal account for you!

WHAT YOU CAN DO IN YOUR PORTAL:
- View all your bookings and payment history
- Track your certifications and renewal dates
- Download certificates when available
- Book new courses quickly
- Update your profile information

ACCESS YOUR PORTAL:
Visit: https://${tenant.slug}.trainkit.co.uk/student/login

HOW TO SIGN IN:
Use the "Sign in with Google" button and use this email address:
${booking.customer.email}

If you have any questions about accessing your portal, please contact us at ${tenant.email}

© ${new Date().getFullYear()} ${tenant.name}. All rights reserved.
Powered by TrainKit Training Management Platform
          `
        })
        console.log('Welcome email sent successfully')
      } catch (welcomeEmailError) {
        console.error('Failed to send welcome email:', welcomeEmailError)
      }
    }

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