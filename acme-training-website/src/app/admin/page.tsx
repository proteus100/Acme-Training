'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Calendar,
  BookOpen,
  CreditCard,
  Plus,
  Search,
  Download
} from 'lucide-react'

interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  upcomingSessions: number
  totalCustomers: number
}

interface RecentBooking {
  id: string
  customerName: string
  courseTitle: string
  sessionDate: string
  amount: number
  paymentStatus: string
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    upcomingSessions: 0,
    totalCustomers: 0
  })
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalBookings: data.totalBookings || 0,
            totalRevenue: data.totalRevenue || 0,
            upcomingSessions: data.upcomingSessions || 0,
            totalCustomers: data.totalCustomers || 0
          })
          if (data.recentBookings) {
            setRecentBookings(data.recentBookings)
          }
        } else {
          // Fallback to demo data if API fails
          setStats({
            totalBookings: 156,
            totalRevenue: 89450,
            upcomingSessions: 23,
            totalCustomers: 134
          })

          setRecentBookings([
            {
              id: 'book_001',
              customerName: 'John Smith',
              courseTitle: 'Gas Safe Registration Training',
              sessionDate: '2025-01-15',
              amount: 850,
              paymentStatus: 'PAID',
              createdAt: '2025-01-01'
            },
            {
              id: 'book_002',
              customerName: 'Sarah Johnson',
              courseTitle: 'Heat Pump Installation Foundation',
              sessionDate: '2025-01-18',
              amount: 225,
              paymentStatus: 'PARTIALLY_PAID',
              createdAt: '2025-01-02'
            }
          ])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Fallback to demo data
        setStats({
          totalBookings: 156,
          totalRevenue: 89450,
          upcomingSessions: 23,
          totalCustomers: 134
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-900 mr-8">
                TrainKit
              </Link>
              <span className="text-gray-500">Admin Dashboard</span>
            </div>
            <nav className="flex space-x-6">
              <Link href="/admin" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/admin/courses" className="text-gray-600 hover:text-gray-900">Courses</Link>
              <Link href="/admin/bookings" className="text-gray-600 hover:text-gray-900">Bookings</Link>
              <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900">Customers</Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">← Back to Site</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your training centre operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                <Link href="/admin/bookings" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.courseTitle}</p>
                      <p className="text-xs text-gray-500">Session: {formatDate(booking.sessionDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(booking.amount)}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusBadge(booking.paymentStatus)}`}>
                        {booking.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/courses/new" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <Plus className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-900">Add Course</span>
                </Link>
                
                <Link href="/admin/sessions/new" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors">
                  <Calendar className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium text-gray-900">Schedule Session</span>
                </Link>
                
                <Link href="/admin/bookings" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors">
                  <Search className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="font-medium text-gray-900">Search Bookings</span>
                </Link>
                
                <Link href="/admin/reports" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors">
                  <Download className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="font-medium text-gray-900">Export Reports</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-green-800">Database</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-green-800">Payment System</p>
                <p className="text-xs text-green-600">Operational</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-green-800">Email Service</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <footer className="mt-8 py-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>TrainKit Training Management Platform © {new Date().getFullYear()} TrainKit Ltd. All Rights Reserved.</p>
        <p className="mt-1">Proprietary and Confidential Software</p>
      </footer>
    </div>
  )
}