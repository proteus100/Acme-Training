'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  User, 
  Calendar, 
  Award,
  Bell,
  BookOpen,
  LogOut,
  Settings,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Plus,
  ExternalLink
} from 'lucide-react'
import ProfileAvatar, { getUserQualifications, getTierInfo } from '../../../components/ProfileAvatar'
import GamificationPanel from '../../../components/GamificationPanel'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  companySize?: string
  jobTitle?: string
  address?: string
  city?: string
  postcode?: string
}

interface Certification {
  id: string
  name: string
  issuedDate: string
  expiryDate: string
  status: 'active' | 'expiring' | 'expired'
  certificateUrl?: string
}

interface Course {
  id: string
  title: string
  description: string
  duration: string
  price: number
  category: string
  nextAvailableDate?: string
}

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // For development bypass mode, always fetch data
    if (status === 'loading') return
    
    if (status === 'unauthenticated' && !session) {
      // In development mode, simulate user session
      fetchDashboardData()
    } else if (session?.user) {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch user profile (supports both JWT and NextAuth)
      const profileResponse = await fetch('/api/student/profile')
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        setUserProfile(profile)

        // Fetch user bookings using the correct customer ID from profile
        const bookingsResponse = await fetch(`/api/bookings?customerId=${profile.id}`)
        if (bookingsResponse.ok) {
          const userBookings = await bookingsResponse.json()
          setBookings(userBookings)
        }
      }

      // Fetch certifications
      const certsResponse = await fetch('/api/student/certifications')
      if (certsResponse.ok) {
        const certs = await certsResponse.json()
        setCertifications(certs)
      }

      // Fetch available courses
      const coursesResponse = await fetch('/api/courses')
      if (coursesResponse.ok) {
        const courses = await coursesResponse.json()
        // Transform the course data to match our interface
        const transformedCourses = courses.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          duration: `${course.duration} days`,
          price: course.price,
          category: course.category,
          nextAvailableDate: course.sessions?.[0]?.startDate ? 
            new Date(course.sessions[0].startDate).toISOString().split('T')[0] : 
            new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }))
        setAvailableCourses(transformedCourses)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/student/login' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'expiring':
        return 'text-amber-600 bg-amber-100'
      case 'expired':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'expiring':
      case 'expired':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ACME Training Centre</h1>
                <p className="text-sm text-gray-600">Student Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push('/student/profile-setup')}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile?.firstName || session?.user?.name?.split(' ')[0] || 'Student'}!
          </h2>
          <p className="text-gray-600">
            {userProfile?.company ? `${userProfile.company} - ` : ''}
            {userProfile?.jobTitle || 'Professional'}
          </p>
        </div>

        {/* Gamification Panel */}
        <div className="mb-8">
          <GamificationPanel bookings={bookings} certifications={certifications} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {certifications.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-sm text-gray-600">Active Certifications</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {certifications.filter(c => c.status === 'expiring').length}
                    </p>
                    <p className="text-sm text-gray-600">Expiring Soon</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{availableCourses.length}</p>
                    <p className="text-sm text-gray-600">Available Courses</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Your Certifications</h3>
                  <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                    View All
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {certifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No certifications yet</h4>
                    <p className="text-gray-600 mb-4">Start by booking your first course below</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certifications.slice(0, 3).map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(cert.status)}`}>
                            {getStatusIcon(cert.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{cert.name}</h4>
                            <p className="text-sm text-gray-600">
                              Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cert.status)}`}>
                            {cert.status}
                          </span>
                          {cert.certificateUrl && (
                            <button className="p-2 text-gray-500 hover:text-gray-700">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Courses */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Available Courses</h3>
                <p className="text-sm text-gray-600 mt-1">Browse and book training courses</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCourses.slice(0, 4).map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 group">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{course.title}</h4>
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">£{course.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{course.duration}</span>
                        <button
                          onClick={() => router.push(`/booking?course=${course.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {availableCourses.length > 4 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => router.push('/courses')}
                      className="px-6 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium rounded-lg transition-colors"
                    >
                      View All Courses →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ProfileAvatar 
                  qualifications={getUserQualifications(bookings, certifications)} 
                  size="lg"
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {userProfile?.firstName || session?.user?.name || 'Student'}
                  </h4>
                  <p className="text-sm text-gray-600">{session?.user?.email}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    {getTierInfo(getUserQualifications(bookings, certifications).length).title}
                  </p>
                </div>
              </div>
              
              {userProfile && (
                <div className="space-y-2 text-sm">
                  {userProfile.company && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{userProfile.company}</span>
                    </div>
                  )}
                  {userProfile.jobTitle && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{userProfile.jobTitle}</span>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => router.push('/student/profile-setup')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Profile
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/courses')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Book a Course</span>
                </button>
                <button 
                  onClick={() => router.push('/booking')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">View Calendar</span>
                </button>
                <button 
                  onClick={() => router.push('/student/bookings')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">My Bookings</span>
                </button>
              </div>
            </div>

            {/* Upcoming Renewals */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
              <h4 className="font-medium text-amber-900 mb-3">Renewal Reminders</h4>
              {certifications.filter(c => c.status === 'expiring').length === 0 ? (
                <p className="text-sm text-amber-700">No upcoming renewals</p>
              ) : (
                <div className="space-y-2">
                  {certifications.filter(c => c.status === 'expiring').map((cert) => (
                    <div key={cert.id} className="text-sm">
                      <p className="font-medium text-amber-900">{cert.name}</p>
                      <p className="text-amber-700">Expires {new Date(cert.expiryDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}