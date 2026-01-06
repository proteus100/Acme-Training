'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  User,
  PoundSterling,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  AlertTriangle
} from 'lucide-react'

interface Booking {
  id: string
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  session: {
    id: string
    course: {
      title: string
      duration: number
      category: string
    }
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    availableSpots: number
    bookedSpots: number
    remainingSpaces: number
  }
  status: string
  totalAmount: number
  depositAmount?: number
  payments: Array<{
    id: string
    amount: number
    status: string
    paidAt?: string
  }>
  createdAt: string
  updatedAt: string
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [actionInProgress, setActionInProgress] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`.toLowerCase()
    const courseTitle = booking.session.course.title.toLowerCase()
    const matchesSearch = customerName.includes(searchTerm.toLowerCase()) ||
                         courseTitle.includes(searchTerm.toLowerCase()) ||
                         booking.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'CONFIRMED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'CANCELLED':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getSpaceStatusIcon = (remainingSpaces: number, totalSpaces: number) => {
    const percentFull = ((totalSpaces - remainingSpaces) / totalSpaces) * 100
    
    if (remainingSpaces === 0) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />
    } else if (percentFull >= 80) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />
    } else {
      return <Users className="w-4 h-4 text-green-600" />
    }
  }

  const getSpaceStatusBadge = (remainingSpaces: number, totalSpaces: number) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    if (remainingSpaces === 0) {
      return `${baseClasses} bg-red-100 text-red-800`
    } else if (remainingSpaces <= 2) {
      return `${baseClasses} bg-amber-100 text-amber-800`
    } else {
      return `${baseClasses} bg-green-100 text-green-800`
    }
  }

  const getPaymentStatus = (booking: Booking) => {
    const totalPaid = booking.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid === 0) return 'Unpaid'
    if (totalPaid >= booking.totalAmount) return 'Paid in Full'
    return 'Deposit Paid'
  }

  const getCourseColors = (category: string) => {
    const colorMap: Record<string, { bg: string, border: string, text: string, icon: string }> = {
      'GAS_SAFE': {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: 'bg-blue-100 text-blue-600'
      },
      'HEAT_PUMP': {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        icon: 'bg-green-100 text-green-600'
      },
      'OFTEC': {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        icon: 'bg-purple-100 text-purple-600'
      },
      'LPG': {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-900',
        icon: 'bg-orange-100 text-orange-600'
      },
      'VAPORIZING': {
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        text: 'text-pink-900',
        icon: 'bg-pink-100 text-pink-600'
      },
      'WATER': {
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        text: 'text-cyan-900',
        icon: 'bg-cyan-100 text-cyan-600'
      },
      'FGAS_AIR_CONDITIONING': {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        text: 'text-teal-900',
        icon: 'bg-teal-100 text-teal-600'
      },
      'COMMERCIAL_CATERING': {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        icon: 'bg-amber-100 text-amber-600'
      },
      'COMMERCIAL_LAUNDRY': {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-900',
        icon: 'bg-indigo-100 text-indigo-600'
      },
      'COMMERCIAL_GAS': {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-900',
        icon: 'bg-sky-100 text-sky-600'
      },
      'COMMERCIAL_CORE': {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        text: 'text-violet-900',
        icon: 'bg-violet-100 text-violet-600'
      },
      'ELECTRICAL': {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        icon: 'bg-yellow-100 text-yellow-600'
      },
      'REFRIGERATION': {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        icon: 'bg-emerald-100 text-emerald-600'
      },
      'CUSTOM': {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        icon: 'bg-gray-100 text-gray-600'
      }
    }

    return colorMap[category] || colorMap['CUSTOM']
  }

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setViewModalOpen(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setEditStatus(booking.status)
    setEditNotes('')
    setEditModalOpen(true)
  }

  const handleCancelBooking = async (bookingId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to cancel the booking for ${customerName}?\n\nThis action cannot be undone.`)) {
      return
    }

    setActionInProgress(true)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setActionMessage({
          type: 'success',
          text: 'Booking cancelled successfully'
        })
        await fetchBookings()
        setTimeout(() => setActionMessage(null), 5000)
      } else {
        const data = await response.json()
        setActionMessage({
          type: 'error',
          text: data.error || 'Failed to cancel booking'
        })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      setActionMessage({
        type: 'error',
        text: 'Failed to cancel booking'
      })
    } finally {
      setActionInProgress(false)
    }
  }

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return

    setActionInProgress(true)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes
        })
      })

      if (response.ok) {
        setActionMessage({
          type: 'success',
          text: 'Booking updated successfully'
        })
        setEditModalOpen(false)
        await fetchBookings()
        setTimeout(() => setActionMessage(null), 5000)
      } else {
        const data = await response.json()
        setActionMessage({
          type: 'error',
          text: data.error || 'Failed to update booking'
        })
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      setActionMessage({
        type: 'error',
        text: 'Failed to update booking'
      })
    } finally {
      setActionInProgress(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
              <p className="text-gray-600">View and manage course bookings</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
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
          <Link href="/admin/bookings" className="text-blue-600 font-medium">Bookings</Link>
          <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900">Customers</Link>
        </nav>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {actionMessage.text}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No bookings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const courseColors = getCourseColors(booking.session.course.category)
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.customer.firstName} {booking.customer.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{booking.customer.email}</div>
                              {booking.customer.phone && (
                                <div className="text-sm text-gray-500">{booking.customer.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-block px-3 py-2 rounded-lg border-l-4 ${courseColors.bg} ${courseColors.border} ${courseColors.text}`}>
                            <div className="text-sm font-medium">{booking.session.course.title}</div>
                            <div className="text-xs opacity-75">{booking.session.course.duration} hours</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(booking.session.startDate)}
                            {booking.session.startDate !== booking.session.endDate && (
                              <> - {formatDate(booking.session.endDate)}</>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.session.startTime} - {booking.session.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getSpaceStatusIcon(booking.session.remainingSpaces, booking.session.availableSpots)}
                            <div className="ml-2">
                              <div className="text-sm text-gray-900">
                                {booking.session.remainingSpaces} of {booking.session.availableSpots} left
                              </div>
                              <span className={getSpaceStatusBadge(booking.session.remainingSpaces, booking.session.availableSpots)}>
                                {booking.session.remainingSpaces === 0 ? 'FULL' :
                                 booking.session.remainingSpaces <= 2 ? 'Nearly Full' : 'Available'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(booking.totalAmount)}</div>
                          {booking.depositAmount && (
                            <div className="text-sm text-gray-500">Deposit: {formatCurrency(booking.depositAmount)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{getPaymentStatus(booking)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewBooking(booking)}
                              className="text-blue-600 hover:text-blue-700"
                              title="View booking details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditBooking(booking)}
                              className="text-green-600 hover:text-green-700"
                              title="Edit booking"
                              disabled={actionInProgress}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id, `${booking.customer.firstName} ${booking.customer.lastName}`)}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel booking"
                              disabled={actionInProgress || booking.status === 'CANCELLED'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Booking Modal */}
      {viewModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">
                      {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{selectedBooking.customer.email}</span>
                  </div>
                  {selectedBooking.customer.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{selectedBooking.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Course & Session Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Course & Session Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium text-gray-900">{selectedBooking.session.course.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{selectedBooking.session.course.duration} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Dates:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(selectedBooking.session.startDate)} - {formatDate(selectedBooking.session.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Time:</span>
                    <span className="font-medium text-gray-900">
                      {selectedBooking.session.startTime} - {selectedBooking.session.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Spots:</span>
                    <span className="font-medium text-gray-900">
                      {selectedBooking.session.remainingSpaces} of {selectedBooking.session.availableSpots} remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <PoundSterling className="w-5 h-5 mr-2 text-blue-600" />
                  Payment Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedBooking.totalAmount)}</span>
                  </div>
                  {selectedBooking.depositAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Amount:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedBooking.depositAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-medium text-gray-900">{getPaymentStatus(selectedBooking)}</span>
                  </div>
                  {selectedBooking.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Payment History:</p>
                      {selectedBooking.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {formatCurrency(payment.amount)} - {payment.status}
                          </span>
                          <span className="text-gray-500">
                            {payment.paidAt ? formatDate(payment.paidAt) : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Booking Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={getStatusBadge(selectedBooking.status)}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booked On:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedBooking.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedBooking.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Edit Booking</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Booking for <strong>{selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</strong>
                  <br />
                  Course: <strong>{selectedBooking.session.course.title}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any notes about this booking update..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBooking}
                disabled={actionInProgress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionInProgress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}