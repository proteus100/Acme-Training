import { Resend } from 'resend'

// Initialize Resend client
let resend: Resend | null = null

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    console.log('[Resend] Initializing with API key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...')
    resend = new Resend(process.env.RESEND_API_KEY)
  } else if (!process.env.RESEND_API_KEY) {
    console.error('[Resend] RESEND_API_KEY is not set in environment variables!')
  }
  return resend
}

// Generic email sending function
interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from
}: SendEmailParams) {
  try {
    const client = getResendClient()

    if (!client) {
      console.error('Email client not initialized - RESEND_API_KEY missing')
      return { success: false, error: 'Email service not configured' }
    }

    // Use FROM_EMAIL from env if from is not provided
    const fromEmail = from || process.env.FROM_EMAIL || 'TrainKit <noreply@trainkit.co.uk>'

    console.log('[Resend] Sending email:', { from: fromEmail, to, subject })

    const result = await client.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || undefined
    })

    console.log('[Resend] Full response:', JSON.stringify(result, null, 2))
    console.log('[Resend] Email sent successfully. ID:', result.data?.id || result.id || 'no-id')

    return { success: true, result: result.data || result }
  } catch (error) {
    console.error('[Resend] Error sending email:', error)
    if (error && typeof error === 'object') {
      console.error('[Resend] Error details:', JSON.stringify(error, null, 2))
    }
    return { success: false, error }
  }
}

interface BookingConfirmationData {
  customerName: string
  customerEmail: string
  courseTitle: string
  sessionDate: string
  sessionTime: string
  amount: number
  paymentType: 'full' | 'deposit'
  bookingId: string
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  try {
    const client = getResendClient()

    if (!client) {
      console.error('Email client not initialized')
      return { success: false, error: 'Email service not configured' }
    }

    const fromEmail = process.env.FROM_EMAIL || 'ACME Training Centre <bookings@acme-training.co.uk>'

    const result = await client.emails.send({
      from: fromEmail,
      to: [data.customerEmail],
      bcc: [process.env.TO_EMAIL || 'admin@acme-training.co.uk'],
      subject: `Booking Confirmation - ${data.courseTitle}`,
      html: generateBookingConfirmationHtml(data)
    })

    console.log('Booking confirmation sent via Resend:', result.data?.id)
    return { success: true, result: result.data }
  } catch (error) {
    console.error('Error sending booking confirmation:', error)
    return { success: false, error }
  }
}

function generateBookingConfirmationHtml(data: BookingConfirmationData): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const remainingAmount = data.paymentType === 'deposit' ?
    (data.amount / 0.3) - data.amount : 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Booking Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #1e3a8a;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
          margin: -30px -30px 30px -30px;
        }
        .booking-details {
          background-color: #f1f5f9;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-label {
          font-weight: bold;
          color: #475569;
        }
        .amount {
          font-size: 18px;
          font-weight: bold;
          color: #059669;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .contact-info {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmation</h1>
          <p>ACME Training Centre</p>
        </div>

        <h2>Dear ${data.customerName},</h2>

        <p>Thank you for booking with ACME Training Centre! Your booking has been confirmed and payment has been received.</p>

        <div class="booking-details">
          <h3>Booking Details</h3>
          <div class="detail-row">
            <span class="detail-label">Booking Reference:</span>
            <span>#${data.bookingId.substring(0, 8).toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Course:</span>
            <span>${data.courseTitle}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span>${formatDate(data.sessionDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span>${data.sessionTime}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount Paid:</span>
            <span class="amount">£${data.amount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Type:</span>
            <span>${data.paymentType === 'full' ? 'Full Payment' : 'Deposit (30%)'}</span>
          </div>
        </div>

        ${data.paymentType === 'deposit' ? `
          <div class="warning">
            <strong>⚠️ Outstanding Balance</strong><br>
            You have paid a deposit of £${data.amount.toFixed(2)}. The remaining balance of <strong>£${remainingAmount.toFixed(2)}</strong> is due before your course start date.
            We will contact you closer to the course date regarding the final payment.
          </div>
        ` : ''}

        <h3>What to Bring</h3>
        <ul>
          <li>Valid photo ID (driving licence or passport)</li>
          <li>Notepad and pen for taking notes</li>
          <li>Any relevant qualifications or certificates</li>
          <li>Comfortable work clothes and safety footwear</li>
        </ul>

        <h3>Course Location</h3>
        <div class="contact-info">
          <strong>ACME Training Centre</strong><br>
          Newton Abbot, Devon<br>
          <br>
          Full address and directions will be sent closer to your course date.
        </div>

        <h3>Important Information</h3>
        <ul>
          <li>Please arrive 15 minutes before the start time for registration</li>
          <li>Lunch and refreshments are provided during the course</li>
          <li>If you need to cancel or reschedule, please give us at least 48 hours notice</li>
          <li>Certificates will be issued upon successful completion of the course</li>
        </ul>

        <p>If you have any questions about your booking or the course, please don't hesitate to contact us.</p>

        <div class="contact-info">
          <strong>Contact Us:</strong><br>
          Email: info@acme-training.co.uk<br>
          Phone: [Phone number to be added]<br>
          Website: www.acme-training.co.uk
        </div>

        <p>We look forward to seeing you on the course!</p>

        <p>Best regards,<br>
        <strong>The ACME Training Centre Team</strong></p>

        <div class="footer">
          <p>ACME Training Centre - Professional Gas & Heating Training</p>
          <p>WRAS Approved Training Centre | Ariston Training Center</p>
          <p>This email was sent to ${data.customerEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendPaymentReminder(data: {
  customerName: string
  customerEmail: string
  courseTitle: string
  sessionDate: string
  outstandingAmount: number
  bookingId: string
}) {
  try {
    const client = getResendClient()

    if (!client) {
      console.error('Email client not initialized')
      return { success: false, error: 'Email service not configured' }
    }

    const fromEmail = process.env.FROM_EMAIL || 'ACME Training Centre <bookings@acme-training.co.uk>'

    const result = await client.emails.send({
      from: fromEmail,
      to: [data.customerEmail],
      subject: `Payment Reminder - ${data.courseTitle}`,
      html: `
        <h2>Payment Reminder</h2>
        <p>Dear ${data.customerName},</p>

        <p>This is a friendly reminder that you have an outstanding balance of <strong>£${data.outstandingAmount.toFixed(2)}</strong>
        for your upcoming course:</p>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <strong>${data.courseTitle}</strong><br>
          Date: ${new Date(data.sessionDate).toLocaleDateString('en-GB')}<br>
          Booking Reference: #${data.bookingId.substring(0, 8).toUpperCase()}
        </div>

        <p>Please ensure payment is made before your course start date. You can contact us to arrange payment.</p>

        <p>Contact: info@acme-training.co.uk</p>

        <p>Thank you,<br>ACME Training Centre</p>
      `
    })

    console.log('Payment reminder sent via Resend:', result.data?.id)
    return { success: true, result: result.data }
  } catch (error) {
    console.error('Error sending payment reminder:', error)
    return { success: false, error }
  }
}
