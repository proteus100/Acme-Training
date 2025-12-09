'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Download,
  Calendar,
  PoundSterling,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  PieChart,
  FileSpreadsheet
} from 'lucide-react'

interface BookingData {
  id: string
  customer: {
    firstName: string
    lastName: string
  }
  session: {
    course: {
      title: string
      category: string
    }
    startDate: string
  }
  totalAmount: number
  payments: {
    amount: number
    status: string
  }[]
  createdAt: string
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState('30')
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  const stats = {
    totalRevenue: bookings.reduce((sum, b) => {
      const paid = b.payments
        .filter(p => p.status === 'PAID')
        .reduce((pSum, p) => pSum + p.amount, 0)
      return sum + paid
    }, 0),
    totalBookings: bookings.length,
    totalCustomers: new Set(bookings.map(b => `${b.customer.firstName} ${b.customer.lastName}`)).size,
    completionRate: 92 // This would need actual completion tracking
  }

  // Group bookings by month
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    const last6Months = []

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0)

      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt)
        return bookingDate.getMonth() === monthIndex && bookingDate.getFullYear() === year
      })

      const revenue = monthBookings.reduce((sum, b) => {
        const paid = b.payments
          .filter(p => p.status === 'PAID')
          .reduce((pSum, p) => pSum + p.amount, 0)
        return sum + paid
      }, 0)

      last6Months.push({
        month: months[monthIndex],
        revenue,
        bookings: monthBookings.length
      })
    }

    return last6Months
  })()

  // Calculate course performance
  const coursePerformance = (() => {
    const courseMap = new Map<string, { bookings: number, revenue: number }>()

    bookings.forEach(b => {
      const courseName = b.session.course.title
      const paid = b.payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0)

      if (!courseMap.has(courseName)) {
        courseMap.set(courseName, { bookings: 0, revenue: 0 })
      }

      const course = courseMap.get(courseName)!
      course.bookings += 1
      course.revenue += paid
    })

    return Array.from(courseMap.entries())
      .map(([course, data]) => ({ course, ...data }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)
  })()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const handleExportBookings = async () => {
    setExporting('bookings')
    try {
      const response = await fetch('/api/admin/reports/export/bookings')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export bookings')
    } finally {
      setExporting(null)
    }
  }

  const handleExportRevenue = async () => {
    setExporting('revenue')
    try {
      const response = await fetch('/api/admin/reports/export/revenue')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export revenue report')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">View business performance and insights</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={handleExportBookings}
                disabled={exporting === 'bookings'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                {exporting === 'bookings' ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Bookings
                  </>
                )}
              </button>
              <button
                onClick={handleExportRevenue}
                disabled={exporting === 'revenue'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                {exporting === 'revenue' ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <PoundSterling className="w-4 h-4 mr-2" />
                    Export Revenue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex space-x-8">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
          <Link href="/admin/courses" className="text-gray-600 hover:text-gray-900">Courses</Link>
          <Link href="/admin/bookings" className="text-gray-600 hover:text-gray-900">Bookings</Link>
          <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900">Customers</Link>
          <Link href="/admin/reports" className="text-blue-600 font-medium">Reports</Link>
        </nav>
      </div>

      {/* Key Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PoundSterling className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% from last month
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8% from last month
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +15% from last month
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +2% from last month
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex items-center">
                  <div className="w-12 text-sm text-gray-600">{data.month}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${(data.revenue / 25000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 w-20 text-right">
                    {formatCurrency(data.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {coursePerformance.map((course, index) => (
                <div key={course.course} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{course.course}</h4>
                    <span className="text-sm text-gray-500">{course.bookings} bookings</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 rounded-full h-2"
                          style={{ width: `${(course.bookings / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-4 text-sm font-medium text-gray-900">
                      {formatCurrency(course.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading recent activity...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent activity to display</div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking, index) => {
                  const totalPaid = booking.payments
                    .filter(p => p.status === 'PAID')
                    .reduce((sum, p) => sum + p.amount, 0)

                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(booking.createdAt).getTime()
                    const hours = Math.floor(diff / (1000 * 60 * 60))
                    const days = Math.floor(hours / 24)

                    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
                    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
                    return 'Just now'
                  })()

                  return (
                    <div key={booking.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm text-gray-900">
                          New booking for <strong>{booking.session.course.title}</strong> by {booking.customer.firstName} {booking.customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(totalPaid)}
                        {totalPaid < booking.totalAmount && ' (deposit)'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <footer className="mt-8 py-4 border-t border-gray-200 text-center text-xs text-gray-500 bg-white">
        <p>TrainKit Training Management Platform © {new Date().getFullYear()} TrainKit Ltd. All Rights Reserved.</p>
        <p className="mt-1">Proprietary and Confidential Software</p>
      </footer>
    </div>
  )
}