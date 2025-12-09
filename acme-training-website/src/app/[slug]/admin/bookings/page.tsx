'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  BookOpen,
  PoundSterling,
  Mail,
  Phone,
  CalendarCheck
} from 'lucide-react'

interface Booking {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  specialRequests?: string
  totalAmount: number
  depositAmount?: number
  createdAt: string
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
  }
  session: {
    id: string
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    availableSpots: number
    bookedSpots: number
    course: {
      id: string
      title: string
      category: string
      duration: number
      price: number
    }
  }
  payments: {
    id: string
    amount: number
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
    paidAt?: string
  }[]
}

export default function TenantBookingsPage() {
  const params = useParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [params.slug])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, filterStatus])

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/tenant/${params.slug}/bookings`)
      const data = await response.json()
      if (data.success) {
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.customer.firstName.toLowerCase().includes(term) ||
        booking.customer.lastName.toLowerCase().includes(term) ||
        booking.customer.email.toLowerCase().includes(term) ||
        booking.session.course.title.toLowerCase().includes(term) ||
        (booking.customer.company && booking.customer.company.toLowerCase().includes(term))
      )
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredBookings(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'CONFIRMED': return CheckCircle
      case 'CANCELLED': return XCircle
      case 'COMPLETED': return CalendarCheck
      default: return AlertCircle
    }
  }

  const getPaymentStatus = (booking: Booking) => {
    if (!booking.payments.length) return { status: 'No payments', color: 'text-gray-500' }
    
    const totalPaid = booking.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0)
    
    if (totalPaid >= booking.totalAmount) {
      return { status: 'Fully Paid', color: 'text-green-600' }
    } else if (totalPaid > 0) {
      return { status: `£${totalPaid} / £${booking.totalAmount}`, color: 'text-yellow-600' }
    } else {
      return { status: 'Payment Pending', color: 'text-red-600' }
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tenant/${params.slug}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        fetchBookings() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">Manage course bookings and student registrations</p>
        </div>
        <Link
          href={`/${params.slug}/admin/bookings/add`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'CONFIRMED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <PoundSterling className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                £{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Bookings ({filteredBookings.length})
          </h2>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No matching bookings' : 'No bookings yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Course bookings will appear here when students register.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => {
              const StatusIcon = getStatusIcon(booking.status)
              const paymentStatus = getPaymentStatus(booking)
              
              return (
                <div key={booking.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {booking.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{booking.id.slice(-8)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Student Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Student</h4>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <User className="w-3 h-3 mr-1 text-gray-400" />
                              {booking.customer.firstName} {booking.customer.lastName}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {booking.customer.email}
                            </div>
                            {booking.customer.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                {booking.customer.phone}
                              </div>
                            )}
                            {booking.customer.company && (
                              <div className="text-xs text-gray-500">
                                {booking.customer.company}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Course & Session Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Course Details</h4>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <BookOpen className="w-3 h-3 mr-1 text-gray-400" />
                              {booking.session.course.title}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              {new Date(booking.session.startDate).toLocaleDateString()} - {new Date(booking.session.endDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.session.startTime} - {booking.session.endTime}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.session.bookedSpots}/{booking.session.availableSpots} spots booked
                            </div>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Payment</h4>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <PoundSterling className="w-3 h-3 mr-1 text-gray-400" />
                              £{booking.totalAmount}
                            </div>
                            <div className={`text-xs ${paymentStatus.color}`}>
                              {paymentStatus.status}
                            </div>
                            {booking.depositAmount && (
                              <div className="text-xs text-gray-500">
                                Deposit: £{booking.depositAmount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                          <p className="text-xs font-medium text-yellow-800 mb-1">Special Requests:</p>
                          <p className="text-xs text-yellow-700">{booking.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                        >
                          Complete
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
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