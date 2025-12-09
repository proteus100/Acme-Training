'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  PoundSterling,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Search
} from 'lucide-react'

interface PaymentData {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod?: string
  paidAt?: string
  createdAt: string
  booking: {
    id: string
    totalAmount: number
    customer: {
      firstName: string
      lastName: string
      email: string
      company?: string
    }
    session: {
      course: {
        title: string
        category: string
      }
      startDate: string
    }
  }
}

interface BillingStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingPayments: number
  paidPayments: number
  failedPayments: number
  refundedAmount: number
  averageBookingValue: number
  totalBookings: number
}

export default function TenantBillingPage() {
  const params = useParams()
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([])
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '90' | '365' | 'all'>('30')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBillingData()
  }, [params.slug, selectedPeriod])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, filterStatus])

  const fetchBillingData = async () => {
    try {
      const response = await fetch(`/api/tenant/${params.slug}/billing?period=${selectedPeriod}`)
      const data = await response.json()
      if (data.success) {
        setPayments(data.payments || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(payment => 
        payment.booking.customer.firstName.toLowerCase().includes(term) ||
        payment.booking.customer.lastName.toLowerCase().includes(term) ||
        payment.booking.customer.email.toLowerCase().includes(term) ||
        payment.booking.session.course.title.toLowerCase().includes(term) ||
        (payment.booking.customer.company && payment.booking.customer.company.toLowerCase().includes(term))
      )
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredPayments(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return CheckCircle
      case 'PENDING': return Clock
      case 'FAILED': return XCircle
      case 'REFUNDED': return AlertCircle
      default: return Clock
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
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
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Track payments, revenue, and financial performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PoundSterling className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Period Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.pendingPayments || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.averageBookingValue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Paid</p>
              <p className="text-lg font-bold text-gray-900">{stats?.paidPayments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="text-lg font-bold text-gray-900">{payments.filter(p => p.status === 'PENDING').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-red-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Failed</p>
              <p className="text-lg font-bold text-gray-900">{stats?.failedPayments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-gray-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Refunded</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats?.refundedAmount || 0)}
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
              placeholder="Search payments..."
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
              <option value="all">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Payments ({filteredPayments.length})
          </h2>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No matching payments' : 'No payments yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Payment transactions will appear here when students make bookings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const StatusIcon = getStatusIcon(payment.status)
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            #{payment.id.slice(-8)}
                          </span>
                          {payment.paymentMethod && (
                            <span className="text-xs text-gray-500">
                              {payment.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm">
                            <User className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {payment.booking.customer.firstName} {payment.booking.customer.lastName}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {payment.booking.customer.email}
                          </div>
                          {payment.booking.customer.company && (
                            <div className="text-xs text-gray-500">
                              {payment.booking.customer.company}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-600 mt-1">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {payment.booking.session.course.title}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                          <span className="text-xs text-gray-500">
                            of {formatCurrency(payment.booking.totalAmount)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {payment.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>
                            {payment.paidAt 
                              ? new Date(payment.paidAt).toLocaleDateString()
                              : new Date(payment.createdAt).toLocaleDateString()
                            }
                          </span>
                          <span className="text-xs text-gray-500">
                            {payment.paidAt 
                              ? new Date(payment.paidAt).toLocaleTimeString()
                              : new Date(payment.createdAt).toLocaleTimeString()
                            }
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 p-1">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}