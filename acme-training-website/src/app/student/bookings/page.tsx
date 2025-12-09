'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react'
import ProfileAvatar, { getUserQualifications } from '../../../components/ProfileAvatar'

interface Payment {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  stripePaymentIntentId?: string
  paymentMethod?: string
  paidAt?: string
  createdAt: string
}

interface Course {
  id: string
  title: string
  duration: number
  price: number
  category: string
}

interface CourseSession {
  id: string
  startDate: string
  endDate: string
  instructor: string
  location: string
  course: Course
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
}

interface Booking {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  specialRequests?: string
  totalAmount: number
  depositAmount?: number
  createdAt: string
  updatedAt: string
  session: CourseSession
  customer: Customer
  payments: Payment[]
}

export default function StudentBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch customer ID from profile API (supports both JWT and NextAuth)
    const fetchCustomerId = async () => {
      try {
        const response = await fetch('/api/student/profile')
        if (response.ok) {
          const profile = await response.json()
          setCustomerId(profile.id)
          fetchBookings(profile.id)
        } else {
          // Not authenticated, redirect to login
          router.push('/student/login')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to authenticate. Please log in again.')
        setTimeout(() => router.push('/student/login'), 2000)
      }
    }

    fetchCustomerId()
  }, [])

  const fetchBookings = async (customerId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/bookings?customerId=${customerId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load your bookings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'text-green-600 bg-green-100'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'CANCELLED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING':
        return <AlertTriangle className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-100'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'FAILED':
      case 'REFUNDED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getLatestPayment = (payments: Payment[]) => {
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }

  const getTotalPaid = (payments: Payment[]) => {
    return payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const getOutstandingBalance = (booking: Booking) => {
    const totalPaid = getTotalPaid(booking.payments)
    return booking.totalAmount - totalPaid
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading your bookings...</span>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
            </div>
            
            <button
              onClick={() => customerId && fetchBookings(customerId)}
              disabled={!customerId}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">You haven't booked any courses yet. Start exploring our available training courses.</p>
            <button
              onClick={() => router.push('/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const latestPayment = getLatestPayment(booking.payments)
              const outstandingBalance = getOutstandingBalance(booking)
              const isUpcoming = new Date(booking.session.startDate) > new Date()
              
              return (
                <div key={booking.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.session.course.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Booking #{booking.id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                        {latestPayment && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(latestPayment.status)}`}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            {latestPayment.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Course Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Course Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(booking.session.startDate)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatTime(booking.session.startDate)} - {formatTime(booking.session.endDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{booking.session.course.duration} days</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{booking.session.location}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Eye className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">Instructor: {booking.session.instructor}</span>
                            </div>
                          </div>
                        </div>

                        {booking.specialRequests && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Special Requests</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                              {booking.specialRequests}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Payment Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Course Price:</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</span>
                            </div>
                            {booking.depositAmount && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Deposit Paid:</span>
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(booking.depositAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Paid:</span>
                              <span className="text-sm font-medium text-green-600">{formatCurrency(getTotalPaid(booking.payments))}</span>
                            </div>
                            {outstandingBalance > 0 && (
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-900">Outstanding Balance:</span>
                                <span className="text-sm font-medium text-red-600">{formatCurrency(outstandingBalance)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {booking.payments.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment History</h4>
                            <div className="space-y-2">
                              {booking.payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                                    <p className="text-xs text-gray-600">
                                      {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                                    </p>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                                    {payment.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {outstandingBalance > 0 && isUpcoming && (
                          <button
                            onClick={() => router.push(`/booking?booking=${booking.id}`)}
                            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                          >
                            Pay Outstanding Balance
                          </button>
                        )}
                        {booking.status === 'COMPLETED' && (
                          <button className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-500 font-medium">
                            <Download className="w-4 h-4" />
                            <span>Download Certificate</span>
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Booked on {formatDate(booking.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}