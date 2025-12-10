import { NextRequest, NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

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

    // Email service temporarily disabled - log submission instead
    console.log('📧 Contact form submission received (email disabled during deployment):', {
      organization: data.organizationName,
      email: data.email,
      phone: data.phone,
      type: data.organizationType
    })

    // Email sending code removed - to be implemented with SMTP later

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