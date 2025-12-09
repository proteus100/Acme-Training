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
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  PoundSterling,
  X,
  Save
} from 'lucide-react'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  postcode?: string
  bookings: Array<{
    id: string
    totalAmount: number
    status: string
    createdAt: string
    session: {
      course: {
        title: string
      }
    }
  }>
  createdAt: string
  updatedAt: string
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Modal states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeleteingCustomer] = useState<Customer | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit form data
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postcode: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else {
        console.error('Failed to fetch customers')
        // Fallback to mock data if API fails
        loadMockData()
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      // Fallback to mock data if API fails
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    setTimeout(() => {
      const mockCustomers: Customer[] = [
        {
          id: 'cust-1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '07123 456789',
          company: 'Smith Gas Services',
          address: '123 High Street',
          city: 'Newton Abbot',
          postcode: 'TQ12 1AA',
          bookings: [
            {
              id: 'booking-1',
              totalAmount: 650.00,
              status: 'CONFIRMED',
              createdAt: '2025-09-11T10:30:00Z',
              session: {
                course: {
                  title: 'ACS CORE & 4 REA'
                }
              }
            },
            {
              id: 'booking-2',
              totalAmount: 995.00,
              status: 'COMPLETED',
              createdAt: '2025-06-15T14:20:00Z',
              session: {
                course: {
                  title: 'ACS CORE & 4 INITIAL'
                }
              }
            }
          ],
          createdAt: '2025-06-15T14:20:00Z',
          updatedAt: '2025-09-11T10:30:00Z'
        },
        {
          id: 'cust-2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@company.com',
          phone: '07987 654321',
          company: 'Green Energy Solutions',
          address: '456 Park Road',
          city: 'Exeter',
          postcode: 'EX1 2BB',
          bookings: [
            {
              id: 'booking-3',
              totalAmount: 650.00,
              status: 'PENDING',
              createdAt: '2025-09-11T14:20:00Z',
              session: {
                course: {
                  title: 'Air Source Heat Pump'
                }
              }
            }
          ],
          createdAt: '2025-09-11T14:20:00Z',
          updatedAt: '2025-09-11T14:20:00Z'
        },
        {
          id: 'cust-3',
          firstName: 'Mike',
          lastName: 'Williams',
          email: 'mike.williams@email.com',
          phone: '07555 123456',
          company: '',
          address: '',
          city: 'Plymouth',
          postcode: 'PL1 3CC',
          bookings: [],
          createdAt: '2025-08-20T09:15:00Z',
          updatedAt: '2025-08-20T09:15:00Z'
        }
      ]
      
      setCustomers(mockCustomers)
    }, 1000)
  }

  // Handler functions
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address: customer.address || '',
      city: customer.city || '',
      postcode: customer.postcode || ''
    })
    setShowEditModal(true)
  }

  const handleDelete = (customer: Customer) => {
    setDeleteingCustomer(customer)
    setShowDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCustomer) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        
        // Update local state with the response from server
        setCustomers(customers.map(customer => 
          customer.id === editingCustomer.id ? updatedCustomer : customer
        ))
        
        setShowEditModal(false)
        setEditingCustomer(null)
      } else {
        const error = await response.json()
        console.error('Failed to update customer:', error.error)
        alert('Failed to update customer: ' + error.error)
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove customer from local state
        setCustomers(customers.filter(customer => customer.id !== deletingCustomer.id))
        
        setShowDeleteModal(false)
        setDeleteingCustomer(null)
      } else {
        const error = await response.json()
        console.error('Failed to delete customer:', error.error)
        alert('Failed to delete customer: ' + error.error)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error deleting customer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const filteredCustomers = customers.filter(customer => {
    const searchableText = `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.company || ''}`.toLowerCase()
    return searchableText.includes(searchTerm.toLowerCase())
  })

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

  const getCustomerStats = (customer: Customer) => {
    const totalSpent = customer.bookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
    const completedBookings = customer.bookings.filter(b => b.status === 'COMPLETED').length
    return { totalSpent, completedBookings, totalBookings: customer.bookings.length }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600">View and manage customer information</p>
            </div>
            <div className="flex space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Grid
                </button>
              </div>
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
          <Link href="/admin/bookings" className="text-gray-600 hover:text-gray-900">Bookings</Link>
          <Link href="/admin/customers" className="text-blue-600 font-medium">Customers</Link>
        </nav>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Customers Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No customers found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => {
              const stats = getCustomerStats(customer)
              return (
                <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        {customer.company && (
                          <p className="text-sm text-gray-500">{customer.company}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      
                      {(customer.city || customer.postcode) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{customer.city} {customer.postcode}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{stats.totalBookings}</div>
                          <div className="text-gray-500">Total Bookings</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{formatCurrency(stats.totalSpent)}</div>
                          <div className="text-gray-500">Total Spent</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-700 p-1"
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-700 p-1"
                          onClick={() => handleDelete(customer)}
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined {formatDate(customer.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const stats = getCustomerStats(customer)
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              {customer.company && (
                                <div className="text-sm text-gray-500">{customer.company}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.city} {customer.postcode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stats.totalBookings}</div>
                          <div className="text-sm text-gray-500">{stats.completedBookings} completed</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(stats.totalSpent)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(customer.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-700"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleEdit(customer)}
                              title="Edit Customer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(customer)}
                              title="Delete Customer"
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Customer</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={editForm.company}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={editForm.address}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={editForm.city}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                    <input
                      type="text"
                      name="postcode"
                      value={editForm.postcode}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Delete Customer</h3>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{deletingCustomer.firstName} {deletingCustomer.lastName}</strong>? 
                  This action cannot be undone and will also remove all associated booking history.
                </p>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? 'Deleting...' : 'Delete Customer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}