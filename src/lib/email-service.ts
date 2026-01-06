import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
}

interface CertificationData {
  id: string
  customer: {
    firstName: string
    lastName: string
    email: string
  }
  course: {
    title: string
    category: string
  }
  certificationDate: Date
  expiryDate: Date | null
  isExpired: boolean
  certificateNumber: string | null
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const settings = await prisma.systemSettings.findFirst()
    
    if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      console.warn('SMTP settings not configured')
      return null
    }

    return {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      user: settings.smtpUser,
      password: settings.smtpPassword
    }
  } catch (error) {
    console.error('Failed to get email configuration:', error)
    return null
  }
}

async function createTransporter() {
  const config = await getEmailConfig()
  
  if (!config) {
    throw new Error('Email configuration not available')
  }

  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function getDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getReminderTemplate(certification: CertificationData): { subject: string, html: string, text: string } {
  const customerName = `${certification.customer.firstName} ${certification.customer.lastName}`
  const courseTitle = certification.course.title
  const category = certification.course.category.replace(/_/g, ' ')
  
  let subject: string
  let urgencyLevel: string
  let urgencyColor: string
  let actionText: string

  if (certification.isExpired) {
    subject = `URGENT: Your ${courseTitle} certification has expired`
    urgencyLevel = 'EXPIRED'
    urgencyColor = '#dc2626'
    actionText = 'Your certification has expired. Please book a renewal course immediately to maintain your qualifications.'
  } else if (certification.expiryDate) {
    const daysLeft = getDaysUntilExpiry(certification.expiryDate)
    
    if (daysLeft <= 30) {
      subject = `URGENT: Your ${courseTitle} certification expires in ${daysLeft} days`
      urgencyLevel = 'EXPIRES SOON'
      urgencyColor = '#dc2626'
      actionText = `Your certification expires in just ${daysLeft} days. Book your renewal course now to avoid any disruption to your work.`
    } else if (daysLeft <= 90) {
      subject = `Reminder: Your ${courseTitle} certification expires in ${daysLeft} days`
      urgencyLevel = 'RENEWAL DUE'
      urgencyColor = '#f59e0b'
      actionText = `Your certification expires in ${daysLeft} days. We recommend booking your renewal course soon to secure your preferred date.`
    } else {
      subject = `Reminder: Your ${courseTitle} certification renewal`
      urgencyLevel = 'RENEWAL REMINDER'
      urgencyColor = '#3b82f6'
      actionText = `Your certification expires in ${daysLeft} days. Start planning your renewal course to maintain your qualifications.`
    }
  } else {
    subject = `Reminder: Your ${courseTitle} certification renewal`
    urgencyLevel = 'RENEWAL REMINDER'
    urgencyColor = '#3b82f6'
    actionText = 'Please check your certification expiry date and book a renewal course if needed.'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .urgency-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
        .cert-details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .cert-details h3 { margin: 0 0 10px 0; color: #1f2937; }
        .cert-details p { margin: 5px 0; }
        .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .cta-button:hover { background: #2563eb; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .contact-info { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ACME Training Centre</h1>
          <p>Certification Renewal Notice</p>
        </div>
        
        <div class="content">
          <div class="urgency-badge" style="background-color: ${urgencyColor}; color: white;">
            ${urgencyLevel}
          </div>
          
          <h2>Dear ${customerName},</h2>
          
          <p>This is an important reminder regarding your professional certification.</p>
          
          <div class="cert-details">
            <h3>Certification Details</h3>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Original Certification Date:</strong> ${formatDate(certification.certificationDate)}</p>
            ${certification.expiryDate ? `<p><strong>Expiry Date:</strong> ${formatDate(certification.expiryDate)}</p>` : ''}
            ${certification.certificateNumber ? `<p><strong>Certificate Number:</strong> ${certification.certificateNumber}</p>` : ''}
          </div>
          
          <div class="warning">
            <strong>Action Required:</strong> ${actionText}
          </div>
          
          <p>Maintaining current certifications is essential for:</p>
          <ul>
            <li>Legal compliance and professional standing</li>
            <li>Insurance coverage validity</li>
            <li>Continued access to work opportunities</li>
            <li>Up-to-date knowledge of safety standards and regulations</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="tel:01234567890" class="cta-button">Call Us: 01234 567890</a>
          </div>
          
          <div class="contact-info">
            <h3>Book Your Renewal Course</h3>
            <p><strong>Phone:</strong> 01234 567890</p>
            <p><strong>Email:</strong> bookings@acmetraining.co.uk</p>
            <p><strong>Website:</strong> www.acmetraining.co.uk</p>
            <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
          </div>
          
          <p>If you have already renewed your certification, please disregard this message or contact us to update our records.</p>
          
          <p>Thank you for choosing ACME Training Centre for your professional development needs.</p>
          
          <p>Best regards,<br>
          <strong>The ACME Training Team</strong></p>
        </div>
        
        <div class="footer">
          <p><small>
            ACME Training Centre | Registered Training Provider<br>
            This is an automated reminder. Please do not reply to this email.<br>
            For inquiries, contact us at info@acmetraining.co.uk
          </small></p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
ACME Training Centre - Certification Renewal Notice
${urgencyLevel}

Dear ${customerName},

This is an important reminder regarding your professional certification.

Certification Details:
- Course: ${courseTitle}
- Category: ${category}
- Original Certification Date: ${formatDate(certification.certificationDate)}
${certification.expiryDate ? `- Expiry Date: ${formatDate(certification.expiryDate)}` : ''}
${certification.certificateNumber ? `- Certificate Number: ${certification.certificateNumber}` : ''}

Action Required: ${actionText}

Maintaining current certifications is essential for:
• Legal compliance and professional standing
• Insurance coverage validity
• Continued access to work opportunities  
• Up-to-date knowledge of safety standards and regulations

Book Your Renewal Course:
Phone: 01234 567890
Email: bookings@acmetraining.co.uk
Website: www.acmetraining.co.uk
Office Hours: Monday - Friday, 8:00 AM - 6:00 PM

If you have already renewed your certification, please disregard this message or contact us to update our records.

Thank you for choosing ACME Training Centre for your professional development needs.

Best regards,
The ACME Training Team

---
ACME Training Centre | Registered Training Provider
This is an automated reminder. Please do not reply to this email.
For inquiries, contact us at info@acmetraining.co.uk
  `

  return { subject, html, text }
}

export async function sendCertificationReminder(certification: CertificationData): Promise<boolean> {
  try {
    const transporter = await createTransporter()
    const template = getReminderTemplate(certification)
    
    const settings = await prisma.systemSettings.findFirst()
    const fromEmail = settings?.companyEmail || 'noreply@acmetraining.co.uk'
    const companyName = settings?.companyName || 'ACME Training Centre'

    const mailOptions = {
      from: `"${companyName}" <${fromEmail}>`,
      to: certification.customer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`Certification reminder sent to ${certification.customer.email}:`, result.messageId)
    
    return true
  } catch (error) {
    console.error('Failed to send certification reminder:', error)
    return false
  }
}

export async function sendCertificateEmail(data: {
  achievement: any
  subject: string
  message: string
  certificateInfo: any
}): Promise<boolean> {
  try {
    const transporter = await createTransporter()

    const settings = await prisma.systemSettings.findFirst()
    const fromEmail = settings?.companyEmail || 'noreply@acmetraining.co.uk'
    const companyName = settings?.companyName || 'ACME Training Centre'

    const customerName = `${data.achievement.customer.firstName} ${data.achievement.customer.lastName}`
    const courseTitle = data.achievement.course.title
    const certDate = formatDate(data.achievement.certificationDate)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .cert-details { background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .cert-details h3 { margin: 0 0 15px 0; color: #1f2937; }
          .cert-details p { margin: 8px 0; }
          .certificate-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.achievement.tenant.name || 'ACME Training Centre'}</h1>
            <p>Certificate Delivery</p>
          </div>

          <div class="content">
            <div class="certificate-badge">🏆 CERTIFICATE ISSUED</div>

            <h2>Dear ${customerName},</h2>

            <div style="white-space: pre-line; margin: 20px 0;">
              ${data.message}
            </div>

            <div class="cert-details">
              <h3>Certificate Details</h3>
              <p><strong>Course:</strong> ${courseTitle}</p>
              <p><strong>Category:</strong> ${data.achievement.course.category.replace(/_/g, ' ')}</p>
              <p><strong>Certification Date:</strong> ${certDate}</p>
              ${data.certificateInfo?.certificateNumber ? `<p><strong>Certificate Number:</strong> ${data.certificateInfo.certificateNumber}</p>` : ''}
              ${data.achievement.expiryDate ? `<p><strong>Valid Until:</strong> ${formatDate(data.achievement.expiryDate)}</p>` : ''}
            </div>

            <p>Please keep this certificate in a safe place for your records. You may need to present it for work purposes or regulatory compliance.</p>

            <p>If you have any questions about your certificate, please don't hesitate to contact us.</p>

            <p>Congratulations once again on your achievement!</p>

            <p>Best regards,<br>
            <strong>The ${data.achievement.tenant.name || 'ACME Training'} Team</strong></p>
          </div>

          <div class="footer">
            <p><small>
              ${data.achievement.tenant.name || 'ACME Training Centre'} | Registered Training Provider<br>
              ${data.achievement.tenant.email ? `Contact: ${data.achievement.tenant.email}` : ''}<br>
              ${data.achievement.tenant.phone ? `Phone: ${data.achievement.tenant.phone}` : ''}
            </small></p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
${data.achievement.tenant.name || 'ACME Training Centre'} - Certificate Delivery

Dear ${customerName},

${data.message}

Certificate Details:
- Course: ${courseTitle}
- Category: ${data.achievement.course.category.replace(/_/g, ' ')}
- Certification Date: ${certDate}
${data.certificateInfo?.certificateNumber ? `- Certificate Number: ${data.certificateInfo.certificateNumber}` : ''}
${data.achievement.expiryDate ? `- Valid Until: ${formatDate(data.achievement.expiryDate)}` : ''}

Please keep this certificate in a safe place for your records. You may need to present it for work purposes or regulatory compliance.

If you have any questions about your certificate, please don't hesitate to contact us.

Congratulations once again on your achievement!

Best regards,
The ${data.achievement.tenant.name || 'ACME Training'} Team
    `

    const mailOptions: any = {
      from: `"${companyName}" <${fromEmail}>`,
      to: data.achievement.customer.email,
      subject: data.subject,
      html: html,
      text: text,
    }

    // Add certificate attachment if available
    if (data.certificateInfo?.filePath) {
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')

      try {
        const certificatePath = path.join(process.cwd(), 'public', data.certificateInfo.filePath)
        const certificateBuffer = await fs.readFile(certificatePath)

        mailOptions.attachments = [{
          filename: data.certificateInfo.fileName || 'certificate.pdf',
          content: certificateBuffer
        }]
      } catch (error) {
        console.warn('Could not attach certificate file:', error)
      }
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`Certificate emailed to ${data.achievement.customer.email}:`, result.messageId)

    return true
  } catch (error) {
    console.error('Failed to send certificate email:', error)
    return false
  }
}

export async function sendBulkCertificationReminders(): Promise<void> {
  try {
    console.log('🔄 Starting bulk certification reminder check...')
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Find certifications that need reminders
    const certificationsNeedingReminders = await prisma.achievement.findMany({
      where: {
        OR: [
          {
            // Due for scheduled reminders
            nextReminderDate: {
              lte: today
            },
            isExpired: false
          },
          {
            // Expired but haven't been marked as expired
            expiryDate: {
              lt: today
            },
            isExpired: false
          }
        ]
      },
      include: {
        customer: true,
        course: true
      }
    })

    console.log(`📧 Found ${certificationsNeedingReminders.length} certifications needing reminders`)

    let sentCount = 0
    let errorCount = 0

    for (const certification of certificationsNeedingReminders) {
      try {
        // Check if expired and update status
        if (certification.expiryDate && certification.expiryDate < today && !certification.isExpired) {
          await prisma.achievement.update({
            where: { id: certification.id },
            data: { isExpired: true }
          })
        }

        // Send reminder
        const success = await sendCertificationReminder(certification)
        
        if (success) {
          // Calculate next reminder date
          let nextReminderDate: Date | null = null
          
          if (certification.expiryDate && !certification.isExpired) {
            const daysUntilExpiry = getDaysUntilExpiry(certification.expiryDate)
            
            if (daysUntilExpiry > 90) {
              // Next reminder in 30 days
              nextReminderDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
            } else if (daysUntilExpiry > 30) {
              // Next reminder in 14 days
              nextReminderDate = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000))
            } else if (daysUntilExpiry > 0) {
              // Next reminder in 7 days
              nextReminderDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
            }
          }

          // Update achievement
          await prisma.achievement.update({
            where: { id: certification.id },
            data: {
              remindersSent: certification.remindersSent + 1,
              nextReminderDate
            }
          })

          // Create reminder record
          await prisma.certificationReminder.create({
            data: {
              tenantId: certification.tenantId,
              achievementId: certification.id,
              reminderType: certification.isExpired ? 'EXPIRED' :
                           getDaysUntilExpiry(certification.expiryDate!) <= 30 ? 'ONE_MONTH' :
                           getDaysUntilExpiry(certification.expiryDate!) <= 90 ? 'THREE_MONTHS' :
                           'SIX_MONTHS',
              scheduledFor: now,
              sentAt: now,
              emailSent: true,
              emailSubject: getReminderTemplate(certification).subject,
              emailContent: 'Automated reminder sent'
            }
          })

          sentCount++
          console.log(`✅ Sent reminder to ${certification.customer.email} for ${certification.course.title}`)
        } else {
          errorCount++
          console.error(`❌ Failed to send reminder to ${certification.customer.email}`)
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Error processing reminder for certification ${certification.id}:`, error)
      }
    }

    console.log(`🎉 Bulk reminder process completed: ${sentCount} sent, ${errorCount} errors`)
  } catch (error) {
    console.error('❌ Error in bulk certification reminder process:', error)
  }
}