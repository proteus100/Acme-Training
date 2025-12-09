import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '../../../../../lib/auth'
import { sendBulkCertificationReminders } from '../../../../../lib/email-service'

export async function POST(request: NextRequest) {
  try {
    // Check for cron secret (for automated jobs)
    const cronSecret = request.headers.get('x-cron-secret')
    const isAutomatedJob = cronSecret && cronSecret === process.env.CRON_SECRET

    if (!isAutomatedJob) {
      // If not automated job, require admin authentication
      const admin = await getAdminFromRequest(request)

      if (!admin) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Only super admins and managers can trigger bulk reminders
      if (!['SUPER_ADMIN', 'MANAGER'].includes(admin.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      console.log(`Bulk reminder job triggered by admin: ${admin.email}`)
    } else {
      console.log('Bulk reminder job triggered by automated cron')
    }

    // Run the bulk reminder process
    await sendBulkCertificationReminders()

    return NextResponse.json({
      success: true,
      message: 'Bulk certification reminders sent successfully'
    })

  } catch (error) {
    console.error('Error in bulk reminder job:', error)
    return NextResponse.json(
      { error: 'Failed to send bulk reminders' },
      { status: 500 }
    )
  }
}