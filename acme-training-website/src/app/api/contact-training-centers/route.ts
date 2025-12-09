import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateNotificationEmail, generateConfirmationEmail } from '@/lib/email-templates'

interface ContactFormData {
  // Lead Qualification
  organizationType: string
  organizationName: string
  currentStudentCount: string
  
  // Contact Details
  contactName: string
  jobTitle: string
  email: string
  phone: string
  website: string
  
  // Business Requirements
  specificRequirements: string
  timeframe: string
  currentChallenges: string
  
  // Spam Protection
  honeypot: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json()

    // Spam protection checks
    if (data.honeypot && data.honeypot.trim() !== '') {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      )
    }

    // Time-based spam protection (minimum 5 seconds)
    const timeSpent = Date.now() - data.timestamp
    if (timeSpent < 5000) {
      return NextResponse.json(
        { error: 'Submission too fast' },
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = [
      'organizationType',
      'organizationName', 
      'currentStudentCount',
      'contactName',
      'jobTitle',
      'email',
      'phone',
      'specificRequirements',
      'timeframe'
    ]

    const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '')
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    // Generate email templates
    const notificationEmail = generateNotificationEmail(data)
    const confirmationEmail = generateConfirmationEmail(data)

    try {
      // Send notification email to your team
      if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key-here') {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'partnerships@acme-training.co.uk',
          to: [process.env.TO_EMAIL || 'info@acme-training.co.uk'],
          subject: notificationEmail.subject,
          html: notificationEmail.html,
          text: notificationEmail.text,
        })

        // Send confirmation email to the contact
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'partnerships@acme-training.co.uk',
          to: [data.email],
          subject: confirmationEmail.subject,
          html: confirmationEmail.html,
          text: confirmationEmail.text,
        })
      } else {
        console.log('📧 Email would be sent (Resend not configured):')
        console.log('Notification:', notificationEmail.subject)
        console.log('Confirmation to:', data.email)
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails - log it and continue
    }

    // Log the submission for tracking
    console.log('Training Center Partnership Inquiry:', {
      timestamp: new Date().toISOString(),
      organization: {
        name: data.organizationName,
        type: data.organizationType,
        studentCount: data.currentStudentCount,
        website: data.website
      },
      contact: {
        name: data.contactName,
        title: data.jobTitle,
        email: data.email,
        phone: data.phone
      },
      requirements: {
        specific: data.specificRequirements,
        timeframe: data.timeframe,
        challenges: data.currentChallenges
      },
      submissionTime: timeSpent
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Your inquiry has been received successfully. We will contact you within 24 hours.'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}