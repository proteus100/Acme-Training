const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const defaultTemplates = [
  {
    name: 'Gas Safe - 1 Month Renewal Reminder',
    category: 'GAS_SAFE',
    reminderType: 'ONE_MONTH',
    subject: 'URGENT: Your Gas Safe certification expires in 1 month - {{courseTitle}}',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gas Safe Certification Renewal Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    .urgency-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; background-color: #dc2626; color: white; }
    .cert-details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .cert-details h3 { margin: 0 0 10px 0; color: #1f2937; }
    .cert-details p { margin: 5px 0; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .contact-info { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ACME Training Centre</h1>
      <p>Gas Safe Certification Renewal Notice</p>
    </div>
    
    <div class="content">
      <div class="urgency-badge">URGENT - EXPIRES SOON</div>
      
      <h2>Dear {{customerName}},</h2>
      
      <p><strong>Your Gas Safe certification expires in 1 month.</strong> This is a critical reminder to ensure you maintain your professional qualifications.</p>
      
      <div class="cert-details">
        <h3>Certification Details</h3>
        <p><strong>Course:</strong> {{courseTitle}}</p>
        <p><strong>Category:</strong> Gas Safe</p>
        <p><strong>Original Certification Date:</strong> {{certificationDate}}</p>
        <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
        {{#if certificateNumber}}<p><strong>Certificate Number:</strong> {{certificateNumber}}</p>{{/if}}
      </div>
      
      <div class="warning">
        <strong>Action Required:</strong> Book your Gas Safe renewal course now to avoid any disruption to your work and maintain legal compliance.
      </div>
      
      <p><strong>Why renew your Gas Safe certification?</strong></p>
      <ul>
        <li>Legal requirement to work on gas appliances</li>
        <li>Insurance coverage validity</li>
        <li>Continued access to work opportunities</li>
        <li>Up-to-date safety knowledge and regulations</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="tel:01234567890" class="cta-button">Call Now: 01234 567890</a>
      </div>
      
      <div class="contact-info">
        <h3>Book Your Gas Safe Renewal Course</h3>
        <p><strong>Phone:</strong> 01234 567890</p>
        <p><strong>Email:</strong> bookings@acmetraining.co.uk</p>
        <p><strong>Website:</strong> www.acmetraining.co.uk</p>
        <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
      </div>
      
      <p>If you have already renewed your certification, please contact us to update our records.</p>
      
      <p>Best regards,<br>
      <strong>The ACME Training Team</strong></p>
    </div>
    
    <div class="footer">
      <p><small>
        ACME Training Centre | Registered Gas Safe Training Provider<br>
        This is an automated reminder. For inquiries, contact us at info@acmetraining.co.uk
      </small></p>
    </div>
  </div>
</body>
</html>`,
    textContent: `ACME Training Centre - Gas Safe Certification Renewal Notice
URGENT - EXPIRES SOON

Dear {{customerName}},

Your Gas Safe certification expires in 1 month. This is a critical reminder to ensure you maintain your professional qualifications.

Certification Details:
- Course: {{courseTitle}}
- Category: Gas Safe
- Original Certification Date: {{certificationDate}}
- Expiry Date: {{expiryDate}}
{{#if certificateNumber}}- Certificate Number: {{certificateNumber}}{{/if}}

Action Required: Book your Gas Safe renewal course now to avoid any disruption to your work and maintain legal compliance.

Why renew your Gas Safe certification?
• Legal requirement to work on gas appliances
• Insurance coverage validity
• Continued access to work opportunities
• Up-to-date safety knowledge and regulations

Book Your Gas Safe Renewal Course:
Phone: 01234 567890
Email: bookings@acmetraining.co.uk
Website: www.acmetraining.co.uk
Office Hours: Monday - Friday, 8:00 AM - 6:00 PM

If you have already renewed your certification, please contact us to update our records.

Best regards,
The ACME Training Team

---
ACME Training Centre | Registered Gas Safe Training Provider
This is an automated reminder. For inquiries, contact us at info@acmetraining.co.uk`,
    isActive: true
  },
  {
    name: 'General - 3 Month Renewal Reminder',
    category: null,
    reminderType: 'THREE_MONTHS',
    subject: 'Certification Renewal Reminder - {{courseTitle}} expires in 3 months',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certification Renewal Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    .cert-details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .cert-details h3 { margin: 0 0 10px 0; color: #1f2937; }
    .cert-details p { margin: 5px 0; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .info-box { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ACME Training Centre</h1>
      <p>Certification Renewal Notice</p>
    </div>
    
    <div class="content">
      <h2>Dear {{customerName}},</h2>
      
      <p>This is a friendly reminder that your professional certification will expire in approximately 3 months.</p>
      
      <div class="cert-details">
        <h3>Certification Details</h3>
        <p><strong>Course:</strong> {{courseTitle}}</p>
        <p><strong>Category:</strong> {{courseCategory}}</p>
        <p><strong>Original Certification Date:</strong> {{certificationDate}}</p>
        <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
        {{#if certificateNumber}}<p><strong>Certificate Number:</strong> {{certificateNumber}}</p>{{/if}}
      </div>
      
      <p>We recommend booking your renewal course soon to secure your preferred date and avoid any last-minute scheduling issues.</p>
      
      <div style="text-align: center;">
        <a href="tel:01234567890" class="cta-button">Call Us: 01234 567890</a>
      </div>
      
      <div class="info-box">
        <h3>Contact Information</h3>
        <p><strong>Phone:</strong> 01234 567890</p>
        <p><strong>Email:</strong> bookings@acmetraining.co.uk</p>
        <p><strong>Website:</strong> www.acmetraining.co.uk</p>
        <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
      </div>
      
      <p>Thank you for choosing ACME Training Centre for your professional development needs.</p>
      
      <p>Best regards,<br>
      <strong>The ACME Training Team</strong></p>
    </div>
    
    <div class="footer">
      <p><small>
        ACME Training Centre | Registered Training Provider<br>
        This is an automated reminder. For inquiries, contact us at info@acmetraining.co.uk
      </small></p>
    </div>
  </div>
</body>
</html>`,
    textContent: `ACME Training Centre - Certification Renewal Notice

Dear {{customerName}},

This is a friendly reminder that your professional certification will expire in approximately 3 months.

Certification Details:
- Course: {{courseTitle}}
- Category: {{courseCategory}}
- Original Certification Date: {{certificationDate}}
- Expiry Date: {{expiryDate}}
{{#if certificateNumber}}- Certificate Number: {{certificateNumber}}{{/if}}

We recommend booking your renewal course soon to secure your preferred date and avoid any last-minute scheduling issues.

Contact Information:
Phone: 01234 567890
Email: bookings@acmetraining.co.uk
Website: www.acmetraining.co.uk
Office Hours: Monday - Friday, 8:00 AM - 6:00 PM

Thank you for choosing ACME Training Centre for your professional development needs.

Best regards,
The ACME Training Team

---
ACME Training Centre | Registered Training Provider
This is an automated reminder. For inquiries, contact us at info@acmetraining.co.uk`,
    isActive: true
  },
  {
    name: 'Expired Certification Notice',
    category: null,
    reminderType: 'EXPIRED',
    subject: 'URGENT: Your {{courseTitle}} certification has expired',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expired Certification Notice</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    .expired-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; background-color: #dc2626; color: white; }
    .cert-details { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #f87171; }
    .cert-details h3 { margin: 0 0 10px 0; color: #991b1b; }
    .cert-details p { margin: 5px 0; }
    .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .urgent-warning { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 6px; margin: 15px 0; }
    .contact-info { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ACME Training Centre</h1>
      <p>URGENT: Certification Expired</p>
    </div>
    
    <div class="content">
      <div class="expired-badge">CERTIFICATION EXPIRED</div>
      
      <h2>Dear {{customerName}},</h2>
      
      <p><strong>Your professional certification has expired.</strong> Immediate action is required to maintain your qualifications and legal compliance.</p>
      
      <div class="cert-details">
        <h3>Expired Certification Details</h3>
        <p><strong>Course:</strong> {{courseTitle}}</p>
        <p><strong>Category:</strong> {{courseCategory}}</p>
        <p><strong>Original Certification Date:</strong> {{certificationDate}}</p>
        <p><strong>Expired On:</strong> {{expiryDate}}</p>
        {{#if certificateNumber}}<p><strong>Certificate Number:</strong> {{certificateNumber}}</p>{{/if}}
      </div>
      
      <div class="urgent-warning">
        <h3>⚠️ IMMEDIATE ACTION REQUIRED</h3>
        <p><strong>Your certification has expired. You may no longer legally perform work requiring this certification until renewed.</strong></p>
        <ul>
          <li>Stop all work requiring this certification immediately</li>
          <li>Book a renewal course as soon as possible</li>
          <li>Inform relevant parties (employers, insurance, etc.) of expired status</li>
        </ul>
      </div>
      
      <p><strong>Consequences of working with expired certification:</strong></p>
      <ul>
        <li>Legal liability and potential prosecution</li>
        <li>Insurance coverage may be void</li>
        <li>Professional reputation damage</li>
        <li>Loss of work opportunities</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="tel:01234567890" class="cta-button">CALL URGENTLY: 01234 567890</a>
      </div>
      
      <div class="contact-info">
        <h3>Renew Your Certification Immediately</h3>
        <p><strong>Emergency Booking Line:</strong> 01234 567890</p>
        <p><strong>Email:</strong> urgent@acmetraining.co.uk</p>
        <p><strong>Website:</strong> www.acmetraining.co.uk</p>
        <p><strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
      </div>
      
      <p>We are here to help you get back on track quickly. Contact us immediately to discuss emergency renewal options.</p>
      
      <p>Urgent regards,<br>
      <strong>The ACME Training Team</strong></p>
    </div>
    
    <div class="footer">
      <p><small>
        ACME Training Centre | Registered Training Provider<br>
        This is an automated notice. For urgent assistance, call 01234 567890
      </small></p>
    </div>
  </div>
</body>
</html>`,
    textContent: `ACME Training Centre - URGENT: Certification Expired
CERTIFICATION EXPIRED

Dear {{customerName}},

Your professional certification has expired. Immediate action is required to maintain your qualifications and legal compliance.

Expired Certification Details:
- Course: {{courseTitle}}
- Category: {{courseCategory}}
- Original Certification Date: {{certificationDate}}
- Expired On: {{expiryDate}}
{{#if certificateNumber}}- Certificate Number: {{certificateNumber}}{{/if}}

⚠️ IMMEDIATE ACTION REQUIRED
Your certification has expired. You may no longer legally perform work requiring this certification until renewed.

• Stop all work requiring this certification immediately
• Book a renewal course as soon as possible  
• Inform relevant parties (employers, insurance, etc.) of expired status

Consequences of working with expired certification:
• Legal liability and potential prosecution
• Insurance coverage may be void
• Professional reputation damage
• Loss of work opportunities

Renew Your Certification Immediately:
Emergency Booking Line: 01234 567890
Email: urgent@acmetraining.co.uk
Website: www.acmetraining.co.uk
Office Hours: Monday - Friday, 8:00 AM - 6:00 PM

We are here to help you get back on track quickly. Contact us immediately to discuss emergency renewal options.

Urgent regards,
The ACME Training Team

---
ACME Training Centre | Registered Training Provider
This is an automated notice. For urgent assistance, call 01234 567890`,
    isActive: true
  }
]

async function main() {
  console.log('🔄 Seeding default email templates...')
  
  for (const template of defaultTemplates) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { name: template.name }
    })
    
    if (existing) {
      console.log(`⚠️  Email template "${template.name}" already exists, skipping...`)
      continue
    }
    
    const created = await prisma.emailTemplate.create({
      data: template
    })
    console.log(`✅ Created email template: "${created.name}" for ${created.reminderType}`)
  }
  
  console.log('🎉 Email templates seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding email templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })