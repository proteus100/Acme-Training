import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// GET /api/admin/reports/export/bookings
// Export bookings as Excel file
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!admin.tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    // Build where clause
    let whereClause: any = {
      session: {
        course: {
          tenantId: admin.tenantId
        }
      }
    }

    // Add date filter if provided
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Fetch bookings with related data
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        session: {
          include: {
            course: true
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for Excel export
    const exportData = bookings.map(booking => {
      const totalPaid = booking.payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0)

      const remainingAmount = booking.totalAmount - totalPaid

      return {
        'Booking ID': booking.id.substring(0, 8),
        'Booking Date': new Date(booking.createdAt).toLocaleDateString('en-GB'),
        'Customer Name': `${booking.customer.firstName} ${booking.customer.lastName}`,
        'Email': booking.customer.email,
        'Phone': booking.customer.phone || 'N/A',
        'Course': booking.session.course.title,
        'Category': booking.session.course.category,
        'Session Date': new Date(booking.session.startDate).toLocaleDateString('en-GB'),
        'Session Time': `${booking.session.startTime} - ${booking.session.endTime}`,
        'Total Amount': `£${booking.totalAmount.toFixed(2)}`,
        'Deposit': `£${booking.depositAmount.toFixed(2)}`,
        'Paid': `£${totalPaid.toFixed(2)}`,
        'Remaining': `£${remainingAmount.toFixed(2)}`,
        'Status': booking.status.toUpperCase(),
        'Payment Status': remainingAmount <= 0 ? 'PAID' : remainingAmount < booking.totalAmount ? 'PARTIAL' : 'UNPAID'
      }
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Booking ID
      { wch: 12 }, // Booking Date
      { wch: 25 }, // Customer Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 35 }, // Course
      { wch: 15 }, // Category
      { wch: 12 }, // Session Date
      { wch: 15 }, // Session Time
      { wch: 12 }, // Total Amount
      { wch: 10 }, // Deposit
      { wch: 10 }, // Paid
      { wch: 10 }, // Remaining
      { wch: 12 }, // Status
      { wch: 15 }  // Payment Status
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `bookings-export-${timestamp}.xlsx`

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exporting bookings:', error)
    return NextResponse.json(
      { error: 'Failed to export bookings' },
      { status: 500 }
    )
  }
}
