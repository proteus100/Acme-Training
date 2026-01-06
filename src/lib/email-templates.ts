interface ContactFormData {
  organizationType: string
  organizationName: string
  currentStudentCount: string
  contactName: string
  jobTitle: string
  email: string
  phone: string
  website: string
  specificRequirements: string
  timeframe: string
  currentChallenges: string
}

export const generateNotificationEmail = (data: ContactFormData) => {
  const organizationTypeLabels: { [key: string]: string } = {
    'training-center': 'Training Center',
    'college': 'College/University',
    'corporate': 'Corporate Training',
    'apprenticeship': 'Apprenticeship Provider',
    'other': 'Other'
  }

  const studentCountLabels: { [key: string]: string } = {
    '1-50': '1-50 students',
    '51-100': '51-100 students',
    '101-250': '101-250 students',
    '251-500': '251-500 students',
    '500+': '500+ students'
  }

  const timeframeLabels: { [key: string]: string } = {
    'immediate': 'Immediate (within 1 month)',
    'short-term': 'Short-term (1-3 months)',
    'medium-term': 'Medium-term (3-6 months)',
    'long-term': 'Long-term (6+ months)',
    'exploring': 'Just exploring options'
  }

  return {
    subject: `New Partnership Inquiry: ${data.organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Partnership Inquiry</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8fafc; padding: 30px; }
          .section { background-color: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .section h3 { margin-top: 0; color: #1e40af; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #111827; }
          .priority { background-color: #fef3c7; border-left-color: #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Partnership Inquiry</h1>
            <p>ACME Training Centre Platform</p>
          </div>
          
          <div class="content">
            <div class="section priority">
              <h3>🔔 Quick Summary</h3>
              <div class="field">
                <span class="label">Organization:</span> <span class="value">${data.organizationName}</span>
              </div>
              <div class="field">
                <span class="label">Contact:</span> <span class="value">${data.contactName} (${data.jobTitle})</span>
              </div>
              <div class="field">
                <span class="label">Timeframe:</span> <span class="value">${timeframeLabels[data.timeframe] || data.timeframe}</span>
              </div>
              <div class="field">
                <span class="label">Email:</span> <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="field">
                <span class="label">Phone:</span> <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
            </div>

            <div class="section">
              <h3>🏢 Organization Details</h3>
              <div class="field">
                <span class="label">Organization Name:</span> <span class="value">${data.organizationName}</span>
              </div>
              <div class="field">
                <span class="label">Organization Type:</span> <span class="value">${organizationTypeLabels[data.organizationType] || data.organizationType}</span>
              </div>
              <div class="field">
                <span class="label">Current Student Count:</span> <span class="value">${studentCountLabels[data.currentStudentCount] || data.currentStudentCount}</span>
              </div>
              ${data.website ? `
              <div class="field">
                <span class="label">Website:</span> <span class="value"><a href="${data.website}" target="_blank">${data.website}</a></span>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <h3>👤 Contact Information</h3>
              <div class="field">
                <span class="label">Contact Name:</span> <span class="value">${data.contactName}</span>
              </div>
              <div class="field">
                <span class="label">Job Title:</span> <span class="value">${data.jobTitle}</span>
              </div>
              <div class="field">
                <span class="label">Email:</span> <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="field">
                <span class="label">Phone:</span> <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
            </div>

            <div class="section">
              <h3>💼 Business Requirements</h3>
              <div class="field">
                <span class="label">Implementation Timeframe:</span> <span class="value">${timeframeLabels[data.timeframe] || data.timeframe}</span>
              </div>
              <div class="field">
                <span class="label">Specific Requirements:</span>
                <div class="value" style="margin-top: 10px; padding: 15px; background-color: #f3f4f6; border-radius: 4px;">
                  ${data.specificRequirements.replace(/\n/g, '<br>')}
                </div>
              </div>
              ${data.currentChallenges ? `
              <div class="field">
                <span class="label">Current Challenges:</span>
                <div class="value" style="margin-top: 10px; padding: 15px; background-color: #f3f4f6; border-radius: 4px;">
                  ${data.currentChallenges.replace(/\n/g, '<br>')}
                </div>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <h3>📋 Next Steps</h3>
              <ul>
                <li>Follow up within 24 hours</li>
                <li>Prepare customized demo based on their requirements</li>
                <li>Schedule discovery call to understand their needs better</li>
                <li>Send relevant case studies and pricing information</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>This inquiry was submitted through the ACME Training Centre contact form.</p>
            <p>Received: ${new Date().toLocaleString('en-GB')}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
NEW PARTNERSHIP INQUIRY - ACME Training Centre

QUICK SUMMARY:
Organization: ${data.organizationName}
Contact: ${data.contactName} (${data.jobTitle})
Email: ${data.email}
Phone: ${data.phone}
Timeframe: ${timeframeLabels[data.timeframe] || data.timeframe}

ORGANIZATION DETAILS:
- Name: ${data.organizationName}
- Type: ${organizationTypeLabels[data.organizationType] || data.organizationType}
- Student Count: ${studentCountLabels[data.currentStudentCount] || data.currentStudentCount}
${data.website ? `- Website: ${data.website}` : ''}

CONTACT INFORMATION:
- Name: ${data.contactName}
- Title: ${data.jobTitle}
- Email: ${data.email}
- Phone: ${data.phone}

BUSINESS REQUIREMENTS:
- Timeframe: ${timeframeLabels[data.timeframe] || data.timeframe}
- Requirements: ${data.specificRequirements}
${data.currentChallenges ? `- Challenges: ${data.currentChallenges}` : ''}

NEXT STEPS:
- Follow up within 24 hours
- Prepare customized demo
- Schedule discovery call
- Send case studies and pricing

Received: ${new Date().toLocaleString('en-GB')}
    `
  }
}

export const generateConfirmationEmail = (data: ContactFormData) => {
  return {
    subject: 'Your Partnership Inquiry - ACME Training Centre',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Partnership Inquiry Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 30px; text-align: center; }
          .content { background-color: white; padding: 30px; }
          .section { margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; }
          .highlight { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
          .contact-info { background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          a { color: #1e40af; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Thank You, ${data.contactName}!</h1>
            <p>Your partnership inquiry has been received</p>
          </div>
          
          <div class="content">
            <p>Dear ${data.contactName},</p>
            
            <p>Thank you for your interest in partnering with ACME Training Centre. We're excited about the possibility of working with ${data.organizationName} to deliver comprehensive training solutions.</p>

            <div class="highlight">
              <h3>📋 What Happens Next?</h3>
              <ul>
                <li><strong>Within 24 Hours:</strong> One of our partnership specialists will review your requirements and contact you</li>
                <li><strong>Discovery Call:</strong> We'll schedule a consultation to understand your specific needs</li>
                <li><strong>Custom Demo:</strong> We'll prepare a personalized demonstration of our platform</li>
                <li><strong>Proposal:</strong> We'll provide a tailored solution and pricing proposal</li>
              </ul>
            </div>

            <div class="section">
              <h3>🚀 Why Training Centers Choose ACME</h3>
              <ul>
                <li>Complete training management from installation through compliance</li>
                <li>47+ comprehensive courses across all major qualifications</li>
                <li>Advanced booking and student management system</li>
                <li>Automated compliance tracking and reporting</li>
                <li>One-stop software house for all your training needs</li>
              </ul>
            </div>

            <div class="contact-info">
              <h3>📞 Need Immediate Assistance?</h3>
              <p>If you have urgent questions or would like to speak with someone sooner, please don't hesitate to contact us directly:</p>
              <ul style="list-style: none; padding: 0;">
                <li>📧 Email: <a href="mailto:partnerships@acme-training.co.uk">partnerships@acme-training.co.uk</a></li>
                <li>📱 Phone: <a href="tel:01626123456">01626 123456</a></li>
                <li>📍 Location: Newton Abbot, Devon</li>
              </ul>
            </div>

            <p>We look forward to discussing how we can help ${data.organizationName} achieve your training objectives with our comprehensive management platform.</p>

            <p>Best regards,<br>
            The ACME Training Centre Partnership Team</p>
          </div>
          
          <div class="footer">
            <p>ACME Training Centre - Complete Training Solutions</p>
            <p>This is an automated confirmation. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Thank You, ${data.contactName}!

Your partnership inquiry has been received.

Dear ${data.contactName},

Thank you for your interest in partnering with ACME Training Centre. We're excited about the possibility of working with ${data.organizationName} to deliver comprehensive training solutions.

WHAT HAPPENS NEXT?

• Within 24 Hours: One of our partnership specialists will review your requirements and contact you
• Discovery Call: We'll schedule a consultation to understand your specific needs  
• Custom Demo: We'll prepare a personalized demonstration of our platform
• Proposal: We'll provide a tailored solution and pricing proposal

WHY TRAINING CENTERS CHOOSE ACME:
• Complete training management from installation through compliance
• 47+ comprehensive courses across all major qualifications
• Advanced booking and student management system
• Automated compliance tracking and reporting
• One-stop software house for all your training needs

NEED IMMEDIATE ASSISTANCE?
If you have urgent questions or would like to speak with someone sooner:

Email: partnerships@acme-training.co.uk
Phone: 01626 123456
Location: Newton Abbot, Devon

We look forward to discussing how we can help ${data.organizationName} achieve your training objectives.

Best regards,
The ACME Training Centre Partnership Team

---
ACME Training Centre - Complete Training Solutions
This is an automated confirmation. Please do not reply to this email.
    `
  }
}

interface TenantWelcomeData {
  tenantName: string
  tenantSlug: string
  adminEmail: string
  adminPassword: string
  planType: string
  maxStudents: number
  maxCourses: number
}

export const generateTenantWelcomeEmail = (data: TenantWelcomeData) => {
  const planNames: { [key: string]: string } = {
    'STARTER': 'Starter Plan',
    'PROFESSIONAL': 'Professional Plan',
    'ENTERPRISE': 'Enterprise Plan'
  }

  const planPrices: { [key: string]: string } = {
    'STARTER': '£297/month',
    'PROFESSIONAL': '£497/month',
    'ENTERPRISE': '£797/month'
  }

  return {
    subject: `Welcome to TrainKit - Your Training Center is Ready! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TrainKit</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: white; padding: 30px; border: 1px solid #e5e7eb; }
          .credentials-box { background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0; }
          .credentials-box h3 { margin-top: 0; color: #92400e; }
          .credential-field { background-color: white; padding: 12px; margin: 10px 0; border-radius: 4px; font-family: monospace; }
          .credential-label { font-weight: bold; color: #92400e; display: block; margin-bottom: 5px; font-size: 12px; }
          .credential-value { color: #1f2937; font-size: 16px; word-break: break-all; }
          .button { display: inline-block; background-color: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background-color: #1e3a8a; }
          .section { margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .section h3 { margin-top: 0; color: #1e40af; }
          .plan-info { background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .plan-info h3 { margin-top: 0; color: #065f46; }
          .feature-list { list-style: none; padding: 0; }
          .feature-list li { padding: 8px 0; padding-left: 24px; position: relative; }
          .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
          .warning { background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .warning-icon { color: #dc2626; font-size: 18px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 30px; }
          .highlight { background-color: #dbeafe; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">🎉 Welcome to TrainKit!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your Training Center is Now Active</p>
          </div>

          <div class="content">
            <p>Hello from the TrainKit team!</p>

            <p>Congratulations! Your training center <strong>${data.tenantName}</strong> has been successfully set up and is ready to use. You now have access to our comprehensive training management platform.</p>

            <div class="credentials-box">
              <h3>🔐 Your Admin Login Credentials</h3>
              <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px;">Use these credentials to access your admin dashboard:</p>

              <div class="credential-field">
                <span class="credential-label">LOGIN URL</span>
                <span class="credential-value"><a href="https://${data.tenantSlug}.trainkit.co.uk/admin/login" style="color: #1e40af;">https://${data.tenantSlug}.trainkit.co.uk/admin/login</a></span>
              </div>

              <div class="credential-field">
                <span class="credential-label">EMAIL</span>
                <span class="credential-value">${data.adminEmail}</span>
              </div>

              <div class="credential-field">
                <span class="credential-label">TEMPORARY PASSWORD</span>
                <span class="credential-value">${data.adminPassword}</span>
              </div>
            </div>

            <div class="warning">
              <strong class="warning-icon">⚠️ Important Security Notice</strong>
              <p style="margin: 10px 0 0 0;">Please change your password immediately after your first login. This temporary password should not be used long-term for security reasons.</p>
            </div>

            <div style="text-align: center;">
              <a href="https://${data.tenantSlug}.trainkit.co.uk/admin/login" class="button">Login to Your Dashboard →</a>
            </div>

            <div class="plan-info">
              <h3>📦 Your Plan: ${planNames[data.planType] || data.planType}</h3>
              <p><strong>Plan Price:</strong> ${planPrices[data.planType] || 'Custom'}</p>
              <p><strong>Maximum Students:</strong> ${data.maxStudents >= 999999 ? 'Unlimited' : data.maxStudents}</p>
              <p><strong>Maximum Courses:</strong> ${data.maxCourses >= 999999 ? 'Unlimited' : data.maxCourses}</p>
            </div>

            <div class="section">
              <h3>🚀 Quick Start Guide</h3>
              <ol style="padding-left: 20px;">
                <li><strong>Login:</strong> Access your admin dashboard using the credentials above</li>
                <li><strong>Change Password:</strong> Update your temporary password immediately</li>
                <li><strong>Add Courses:</strong> Navigate to "Courses" and create your first training course</li>
                <li><strong>Create Bundles:</strong> Use the "Bundles" feature to offer discounted course packages</li>
                <li><strong>Manage Students:</strong> Add students and start tracking their progress</li>
                <li><strong>Customize Settings:</strong> Update your branding, colors, and center information</li>
              </ol>
            </div>

            <div class="section">
              <h3>✨ What You Can Do</h3>
              <ul class="feature-list">
                <li>Create and manage unlimited courses (within your plan limits)</li>
                <li>Design custom course bundles with discounted pricing</li>
                <li>Schedule training sessions and manage bookings</li>
                <li>Track student enrollments and progress</li>
                <li>Handle payments and billing</li>
                <li>Customize your public training center website</li>
                <li>Send automated emails to students</li>
                <li>Generate reports and analytics</li>
              </ul>
            </div>

            <div class="section">
              <h3>🌐 Your Public Website</h3>
              <p>Your training center also has a public-facing website where students can browse courses and make bookings:</p>
              <p><a href="https://${data.tenantSlug}.trainkit.co.uk" style="color: #1e40af; font-weight: bold;">https://${data.tenantSlug}.trainkit.co.uk</a></p>
              <p>You can customize the look and content of this website from your admin dashboard settings.</p>
            </div>

            <div class="section" style="background-color: #ecfdf5; border-left-color: #10b981;">
              <h3>📞 Need Help?</h3>
              <p>Our support team is here to help you get started:</p>
              <ul style="list-style: none; padding: 0;">
                <li>📧 Email: <a href="mailto:support@trainkit.co.uk" style="color: #065f46;">support@trainkit.co.uk</a></li>
                <li>📖 Documentation: <a href="https://docs.trainkit.co.uk" style="color: #065f46;">docs.trainkit.co.uk</a></li>
                <li>💬 Live Chat: Available in your admin dashboard</li>
              </ul>
            </div>

            <p>We're excited to have you on board and look forward to helping ${data.tenantName} deliver exceptional training experiences!</p>

            <p>Best regards,<br>
            <strong>The TrainKit Team</strong><br>
            <em>Making training management effortless</em></p>
          </div>

          <div class="footer">
            <p><strong>TrainKit Training Management Platform</strong></p>
            <p>Software by <a href="https://exeterdigitalagency.co.uk" style="color: #6b7280;">Exeter Digital Agency</a></p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
              This email contains important account information. Please keep it secure.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
WELCOME TO TRAINKIT! 🎉
Your Training Center is Now Active

Hello from the TrainKit team!

Congratulations! Your training center "${data.tenantName}" has been successfully set up and is ready to use.

═══════════════════════════════════════
🔐 YOUR ADMIN LOGIN CREDENTIALS
═══════════════════════════════════════

Login URL: https://${data.tenantSlug}.trainkit.co.uk/admin/login
Email: ${data.adminEmail}
Temporary Password: ${data.adminPassword}

⚠️ IMPORTANT: Please change your password immediately after your first login for security reasons.

═══════════════════════════════════════
📦 YOUR PLAN
═══════════════════════════════════════

Plan: ${planNames[data.planType] || data.planType}
Price: ${planPrices[data.planType] || 'Custom'}
Maximum Students: ${data.maxStudents >= 999999 ? 'Unlimited' : data.maxStudents}
Maximum Courses: ${data.maxCourses >= 999999 ? 'Unlimited' : data.maxCourses}

═══════════════════════════════════════
🚀 QUICK START GUIDE
═══════════════════════════════════════

1. Login to your admin dashboard
2. Change your temporary password
3. Add your first training course
4. Create course bundles with discounts
5. Manage students and enrollments
6. Customize your settings and branding

═══════════════════════════════════════
✨ FEATURES
═══════════════════════════════════════

✓ Create and manage courses
✓ Design custom course bundles
✓ Schedule training sessions
✓ Track student progress
✓ Handle payments and billing
✓ Customize your public website
✓ Send automated emails
✓ Generate reports and analytics

═══════════════════════════════════════
🌐 YOUR PUBLIC WEBSITE
═══════════════════════════════════════

Your training center has a public website:
https://${data.tenantSlug}.trainkit.co.uk

Students can browse courses and make bookings here.
Customize it from your admin dashboard settings.

═══════════════════════════════════════
📞 NEED HELP?
═══════════════════════════════════════

Email: support@trainkit.co.uk
Documentation: docs.trainkit.co.uk
Live Chat: Available in your admin dashboard

We're excited to have you on board and look forward to helping ${data.tenantName} deliver exceptional training experiences!

Best regards,
The TrainKit Team
Making training management effortless

---
TrainKit Training Management Platform
Software by Exeter Digital Agency
This email contains important account information. Please keep it secure.
    `
  }
}