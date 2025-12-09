'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Award,
  Clock,
  PoundSterling,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalBookings: number
  totalRevenue: number
  recentBookings: any[]
  topAchievers: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // For now, we'll use mock data since we don't have the stats API yet
      // In a real implementation, you'd fetch from /api/admin/dashboard
      setStats({
        totalCourses: 49,
        totalStudents: 156,
        totalBookings: 42,
        totalRevenue: 15600,
        recentBookings: [
          { id: 1, student: 'John Smith', course: 'Gas Safe Core Safety', date: '2025-01-15', status: 'confirmed' },
          { id: 2, student: 'Sarah Jones', course: 'Heat Pump Installation', date: '2025-01-16', status: 'pending' },
          { id: 3, student: 'Mike Wilson', course: 'OFTEC OT1', date: '2025-01-17', status: 'confirmed' },
        ],
        topAchievers: [
          { name: 'Elite Master', courses: 6, level: 'ELITE' },
          { name: 'Test Student', courses: 4, level: 'GOLD' },
          { name: 'Bronze Beginner', courses: 1, level: 'BRONZE' },
        ]
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+5 this month'
    },
    {
      title: 'Active Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'bg-green-500',
      change: '+12 this week'
    },
    {
      title: 'Course Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      change: '+8 this week'
    },
    {
      title: 'Monthly Revenue',
      value: `£${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: PoundSterling,
      color: 'bg-emerald-500',
      change: '+15% vs last month'
    }
  ]

  return (
    <div className="space-y-6 py-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your training programs.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.student}</p>
                    <p className="text-sm text-gray-600">{booking.course}</p>
                    <p className="text-xs text-gray-500">{booking.date}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a
                href="/admin/bookings"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all bookings →
              </a>
            </div>
          </div>
        </div>

        {/* Top Achievers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Top Achievers</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.topAchievers.map((achiever, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      achiever.level === 'ELITE' ? 'bg-purple-500' :
                      achiever.level === 'GOLD' ? 'bg-yellow-500' :
                      achiever.level === 'SILVER' ? 'bg-gray-400' :
                      'bg-orange-600'
                    }`}>
                      {achiever.level === 'ELITE' ? '👑' :
                       achiever.level === 'GOLD' ? '🥇' :
                       achiever.level === 'SILVER' ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{achiever.name}</p>
                      <p className="text-sm text-gray-600">{achiever.courses} courses completed</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    achiever.level === 'ELITE' ? 'bg-purple-100 text-purple-800' :
                    achiever.level === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                    achiever.level === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {achiever.level}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a
                href="/admin/customers"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all students →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/courses"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Manage Courses</p>
              <p className="text-sm text-gray-600">Add, edit, or remove courses</p>
            </div>
          </a>
          <a
            href="/admin/bookings"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">View Bookings</p>
              <p className="text-sm text-gray-600">Check recent bookings</p>
            </div>
          </a>
          <a
            href="/admin/reports"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-sm text-gray-600">Analyze performance data</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}