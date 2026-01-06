import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// GET /api/admin/reports/export/revenue
// Export revenue report as Excel file
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

    // Fetch bookings with payments
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        session: {
          include: {
            course: true
          }
        },
        payments: {
          where: {
            status: 'PAID'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate revenue by course
    const revenueByCourse = new Map<string, {
      courseName: string
      category: string
      bookings: number
      totalRevenue: number
      depositRevenue: number
      fullPaymentRevenue: number
    }>()

    bookings.forEach(booking => {
      const courseId = booking.session.course.id
      const courseName = booking.session.course.title
      const category = booking.session.course.category

      const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0)
      const isFullPayment = totalPaid >= booking.totalAmount

      if (!revenueByCourse.has(courseId)) {
        revenueByCourse.set(courseId, {
          courseName,
          category,
          bookings: 0,
          totalRevenue: 0,
          depositRevenue: 0,
          fullPaymentRevenue: 0
        })
      }

      const stats = revenueByCourse.get(courseId)!
      stats.bookings += 1
      stats.totalRevenue += totalPaid

      if (isFullPayment) {
        stats.fullPaymentRevenue += totalPaid
      } else {
        stats.depositRevenue += totalPaid
      }
    })

    // Convert to array for export
    const revenueData = Array.from(revenueByCourse.values()).map(stats => ({
      'Course Name': stats.courseName,
      'Category': stats.category,
      'Total Bookings': stats.bookings,
      'Total Revenue': `£${stats.totalRevenue.toFixed(2)}`,
      'Deposit Revenue': `£${stats.depositRevenue.toFixed(2)}`,
      'Full Payment Revenue': `£${stats.fullPaymentRevenue.toFixed(2)}`,
      'Average per Booking': `£${(stats.totalRevenue / stats.bookings).toFixed(2)}`
    }))

    // Add summary row
    const totals = {
      'Course Name': 'TOTAL',
      'Category': '',
      'Total Bookings': bookings.length,
      'Total Revenue': `£${Array.from(revenueByCourse.values()).reduce((sum, s) => sum + s.totalRevenue, 0).toFixed(2)}`,
      'Deposit Revenue': `£${Array.from(revenueByCourse.values()).reduce((sum, s) => sum + s.depositRevenue, 0).toFixed(2)}`,
      'Full Payment Revenue': `£${Array.from(revenueByCourse.values()).reduce((sum, s) => sum + s.fullPaymentRevenue, 0).toFixed(2)}`,
      'Average per Booking': `£${(Array.from(revenueByCourse.values()).reduce((sum, s) => sum + s.totalRevenue, 0) / bookings.length || 0).toFixed(2)}`
    }

    // Create worksheets
    const revenueSheet = XLSX.utils.json_to_sheet([...revenueData, totals])

    // Set column widths
    revenueSheet['!cols'] = [
      { wch: 35 }, // Course Name
      { wch: 15 }, // Category
      { wch: 15 }, // Total Bookings
      { wch: 15 }, // Total Revenue
      { wch: 18 }, // Deposit Revenue
      { wch: 20 }, // Full Payment Revenue
      { wch: 18 }  // Average per Booking
    ]

    // Create detailed transactions sheet
    const transactions = bookings.flatMap(booking =>
      booking.payments.map(payment => ({
        'Payment Date': new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-GB'),
        'Customer': `${booking.customer.firstName} ${booking.customer.lastName}`,
        'Course': booking.session.course.title,
        'Category': booking.session.course.category,
        'Session Date': new Date(booking.session.startDate).toLocaleDateString('en-GB'),
        'Amount': `£${payment.amount.toFixed(2)}`,
        'Payment Type': payment.amount >= booking.totalAmount ? 'Full Payment' : 'Deposit',
        'Status': payment.status.toUpperCase(),
        'Payment ID': payment.id.substring(0, 8)
      }))
    )

    const transactionsSheet = XLSX.utils.json_to_sheet(transactions)
    transactionsSheet['!cols'] = [
      { wch: 12 }, // Payment Date
      { wch: 25 }, // Customer
      { wch: 35 }, // Course
      { wch: 15 }, // Category
      { wch: 12 }, // Session Date
      { wch: 12 }, // Amount
      { wch: 15 }, // Payment Type
      { wch: 12 }, // Status
      { wch: 12 }  // Payment ID
    ]

    // Create workbook with both sheets
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Summary')
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transaction Details')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `revenue-report-${timestamp}.xlsx`

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
    console.error('Error exporting revenue:', error)
    return NextResponse.json(
      { error: 'Failed to export revenue report' },
      { status: 500 }
    )
  }
}
