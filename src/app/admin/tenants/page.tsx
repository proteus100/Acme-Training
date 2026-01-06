'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Globe,
  Users,
  Settings,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
  Crown,
  Star,
  Zap,
  MapPin,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Mail
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  email: string
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  maxStudents: number
  active: boolean
  // SEO fields
  businessType?: string
  mainServices?: string
  serviceAreas?: string
  metaTitle?: string
  metaDescription?: string
  city?: string
  county?: string
  logo?: string
  _count: {
    customers: number
    courses: number
    bookings: number
  }
  createdAt: string
}

interface UpgradeActivity {
  id: string
  tenantId: string
  tenantName: string
  tenantSlug: string
  currentPlan: string
  maxCourses: number
  maxStudents: number
  currentCourses: number
  currentStudents: number
  upgradedAt: string
  type: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [upgradeActivities, setUpgradeActivities] = useState<UpgradeActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchTenants()
    fetchUpgradeActivities()
  }, [])

  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(null)
      }
    }
    
    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [dropdownOpen])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      const data = await response.json()
      setTenants(data.tenants || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUpgradeActivities = async () => {
    try {
      const response = await fetch('/api/admin/upgrades')
      const data = await response.json()
      if (data.success) {
        setUpgradeActivities(data.upgrades || [])
      }
    } catch (error) {
      console.error('Error fetching upgrade activities:', error)
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'STARTER': return <Users className="w-4 h-4 text-blue-500" />
      case 'PROFESSIONAL': return <Star className="w-4 h-4 text-purple-500" />
      case 'ENTERPRISE': return <Crown className="w-4 h-4 text-yellow-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'PROFESSIONAL': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'ENTERPRISE': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'STARTER': return '£297'
      case 'PROFESSIONAL': return '£497'
      case 'ENTERPRISE': return '£797'
      default: return '£0'
    }
  }

  const handleViewTenant = (tenant: Tenant) => {
    // Navigate to tenant's live website
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const url = tenant.domain ? `https://${tenant.domain}` : `${baseUrl}/${tenant.slug}`
    window.open(url, '_blank')
  }

  const handleEditTenant = (tenant: Tenant) => {
    router.push(`/admin/tenants/edit/${tenant.id}`)
  }

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenant.id,
          active: !tenant.active
        })
      })

      if (response.ok) {
        fetchTenants() // Refresh the list
      } else {
        alert('Failed to update tenant status')
      }
    } catch (error) {
      console.error('Error updating tenant status:', error)
      alert('Failed to update tenant status')
    }
  }

  const handleUpgradeTenant = (tenant: Tenant) => {
    // Navigate to upgrade page for this tenant
    router.push(`/admin/tenants/edit/${tenant.id}?tab=upgrade`)
  }

  const handleSendWelcomeEmail = async (tenant: Tenant) => {
    if (!confirm(`Send welcome email to ${tenant.email}? This will create/reset admin credentials.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/send-welcome`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
      } else {
        alert(`Failed to send welcome email: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      alert('Failed to send welcome email')
    }
  }

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTenants() // Refresh the list
      } else {
        alert('Failed to delete tenant')
      }
    } catch (error) {
      console.error('Error deleting tenant:', error)
      alert('Failed to delete tenant')
    }
  }

  const toggleDropdown = (tenantId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setDropdownOpen(dropdownOpen === tenantId ? null : tenantId)
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
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage your training center clients</p>
        </div>
        <Link
          href="/admin/tenants/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Tenant
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.reduce((sum, t) => sum + (t._count?.customers || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                £{tenants.reduce((sum, t) => {
                  const price = getPlanPrice(t.planType).replace('£', '')
                  return sum + parseInt(price)
                }, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Upgrade Activities */}
      {upgradeActivities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Upgrade Activities</h2>
              </div>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {upgradeActivities.length} recent upgrades
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {upgradeActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.tenantName}
                        </p>
                        <span className="text-xs text-gray-500">upgraded to</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPlanColor(activity.currentPlan)}`}>
                          {getPlanIcon(activity.currentPlan)}
                          <span className="ml-1">{activity.currentPlan}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-600">
                          Courses: {activity.currentCourses} of {activity.maxCourses === 999999 ? 'unlimited' : activity.maxCourses}
                        </p>
                        <p className="text-xs text-gray-600">
                          Students: {activity.currentStudents} of {activity.maxStudents === 999999 ? 'unlimited' : activity.maxStudents}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.upgradedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                        const adminUrl = `${baseUrl}/${activity.tenantSlug}/admin`
                        window.open(adminUrl, '_blank')
                      }}
                      className="text-blue-600 hover:text-blue-900 text-xs font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      View Admin
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {upgradeActivities.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                Showing 5 of {upgradeActivities.length} recent upgrade activities
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Training Centers</h2>
        </div>
        
        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first training center client.</p>
            <Link
              href="/admin/tenants/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Tenant
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan & Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & SEO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {tenant.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tenant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tenant.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPlanIcon(tenant.planType)}
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPlanColor(tenant.planType)}`}>
                            {tenant.planType}
                          </span>
                          <div className="text-sm text-gray-600 mt-1">
                            {getPlanPrice(tenant.planType)}/month
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{tenant._count?.customers || 0}</span>
                        <span className="text-xs text-gray-500">
                          of {tenant.maxStudents} max
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col space-y-1">
                        {tenant.city && tenant.county && (
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                            {tenant.city}, {tenant.county}
                          </div>
                        )}
                        {tenant.businessType && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {tenant.businessType}
                          </span>
                        )}
                        {tenant.mainServices && (
                          <span className="text-xs text-blue-600">
                            {JSON.parse(tenant.mainServices).length} services
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tenant.domain ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Globe className="w-4 h-4 mr-2 text-gray-400" />
                          {tenant.domain}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No custom domain</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tenant.active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewTenant(tenant)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                          title="View tenant website"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTenant(tenant)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50"
                          title="Edit tenant"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => toggleDropdown(tenant.id, e)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {dropdownOpen === tenant.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleToggleStatus(tenant)
                                    setDropdownOpen(null)
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {tenant.active ? (
                                    <ToggleRight className="w-4 h-4 mr-2 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 mr-2 text-gray-400" />
                                  )}
                                  {tenant.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => {
                                    // Use environment variable or current origin for flexibility
                                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                                    const adminUrl = `${baseUrl}/${tenant.slug}/admin`
                                    window.open(adminUrl, '_blank')
                                    setDropdownOpen(null)
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open Admin Portal
                                </button>
                                <button
                                  onClick={() => {
                                    handleUpgradeTenant(tenant)
                                    setDropdownOpen(null)
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                                  title="Upgrade tenant plan"
                                >
                                  <Zap className="w-4 h-4 mr-2" />
                                  Upgrade Plan
                                </button>
                                <button
                                  onClick={() => {
                                    handleSendWelcomeEmail(tenant)
                                    setDropdownOpen(null)
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                  title="Send welcome email with login credentials"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Welcome Email
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteTenant(tenant)
                                    setDropdownOpen(null)
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Tenant
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}