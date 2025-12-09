'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PoundSterling,
  CalendarCheck,
  GraduationCap,
  Star,
  Building2
} from 'lucide-react'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalCourses: number
  activeSessions: number
  upcomingSessions: number
  completedSessions: number
  pendingBookings: number
  confirmedBookings: number
  totalRevenue: number
  monthlyRevenue: number
  outstandingPayments: number
}

interface RecentActivity {
  id: string
  type: 'booking' | 'payment' | 'completion' | 'registration'
  message: string
  timestamp: string
  studentName?: string
  amount?: number
}

export default function TenantAdminDashboard() {
  const params = useParams()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [params.slug])

  const fetchDashboardData = async () => {
    try {
      // Fetch both dashboard stats and tenant info
      const [dashboardResponse, tenantResponse] = await Promise.all([
        fetch(`/api/tenant/${params.slug}/dashboard`),
        fetch(`/api/tenant/${params.slug}`)
      ])

      const dashboardData = await dashboardResponse.json()
      const tenantData = await tenantResponse.json()

      if (dashboardData.success) {
        setStats(dashboardData.stats)
        setRecentActivity(dashboardData.recentActivity || [])
      }

      if (tenantData.success) {
        setTenantInfo(tenantData.tenant)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: `/${params.slug}/admin/students`
    },
    {
      title: 'Active Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'bg-green-500',
      href: `/${params.slug}/admin/courses`
    },
    {
      title: 'Upcoming Sessions',
      value: stats?.upcomingSessions || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      href: `/${params.slug}/admin/bookings`
    },
    {
      title: 'Monthly Revenue',
      value: `£${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: PoundSterling,
      color: 'bg-yellow-500',
      href: `/${params.slug}/admin/billing`
    }
  ]

  const quickStats = [
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Confirmed Bookings',
      value: stats?.confirmedBookings || 0,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Completed Sessions',
      value: stats?.completedSessions || 0,
      icon: GraduationCap,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Outstanding Payments',
      value: `£${(stats?.outstandingPayments || 0).toLocaleString()}`,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar
      case 'payment': return CreditCard
      case 'completion': return CheckCircle
      case 'registration': return Users
      default: return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-600 bg-blue-100'
      case 'payment': return 'text-green-600 bg-green-100'
      case 'completion': return 'text-purple-600 bg-purple-100'
      case 'registration': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Training Center Header - SUPER CLEAR IDENTIFICATION */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  🏢 TRAINING CENTER ADMIN 🏢
                </h1>
                <p className="text-green-100 text-sm font-medium">
                  {tenantInfo?.name || 'Training Center'} • Self-Service Portal • Plan: {tenantInfo?.planType || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-green-100">
              <span>📍 {tenantInfo?.city && tenantInfo?.county ? `${tenantInfo.city}, ${tenantInfo.county}` : 'Location not set'}</span>
              <span>🌐 /{params.slug}</span>
              <span>⚡ Max Courses: {tenantInfo?.maxCourses || '...'} | Max Students: {tenantInfo?.maxStudents || '...'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs text-green-200">You Are Managing</div>
              <div className="text-lg font-bold">{tenantInfo?.name || 'Your Training Center'}</div>
              <div className="text-xs text-green-200">Center ID: {params.slug}</div>
            </div>
          </div>
        </div>
        
        {/* Important Notice */}
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-sm text-green-100">
            <strong>🔒 This is YOUR training center's admin panel.</strong> You can only manage courses, students, and bookings for <strong>{tenantInfo?.name || 'your center'}</strong>.
            You cannot see or modify other training centers' data.
          </p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type)
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href={`/${params.slug}/admin/courses/add`}
              className="flex items-center w-full p-3 text-left text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-3" />
              Add New Course
            </Link>
            <Link
              href={`/${params.slug}/admin/students/add`}
              className="flex items-center w-full p-3 text-left text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Users className="h-4 w-4 mr-3" />
              Add New Student
            </Link>
            <Link
              href={`/${params.slug}/admin/bookings`}
              className="flex items-center w-full p-3 text-left text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Calendar className="h-4 w-4 mr-3" />
              View All Bookings
            </Link>
            <Link
              href={`/${params.slug}/admin/billing`}
              className="flex items-center w-full p-3 text-left text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-3" />
              Manage Billing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}