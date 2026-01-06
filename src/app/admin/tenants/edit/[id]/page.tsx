'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

interface TenantFormData {
  id: string
  name: string
  slug: string
  email: string
  domain?: string
  phone?: string
  address?: string
  city?: string
  postcode?: string
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  maxStudents: number
  primaryColor: string
  secondaryColor: string
  active: boolean
  // SEO fields
  businessType?: string
  county?: string
  metaTitle?: string
  metaDescription?: string
  heroHeading?: string
  heroSubheading?: string
}

export default function EditTenantPage() {
  const [formData, setFormData] = useState<TenantFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string

  useEffect(() => {
    fetchTenant()
  }, [tenantId])

  const fetchTenant = async () => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data.tenant)
      } else {
        alert('Failed to load tenant data')
        router.push('/admin/tenants')
      }
    } catch (error) {
      console.error('Error fetching tenant:', error)
      alert('Failed to load tenant data')
      router.push('/admin/tenants')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/tenants')
      } else {
        const error = await response.text()
        alert(`Error: ${error}`)
      }
    } catch (error) {
      console.error('Error updating tenant:', error)
      alert('Failed to update tenant')
    } finally {
      setIsSaving(false)
    }
  }

  const getMaxStudentsForPlan = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 50
      case 'PROFESSIONAL': return 150
      case 'ENTERPRISE': return 999999 // Unlimited
      default: return 50
    }
  }

  const handleInputChange = (field: keyof TenantFormData, value: string | boolean | number) => {
    if (!formData) return
    
    if (field === 'planType') {
      // Auto-update maxStudents when plan changes
      const maxStudents = getMaxStudentsForPlan(value as string)
      setFormData({ ...formData, [field]: value, maxStudents })
    } else {
      setFormData({ ...formData, [field]: value })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenant not found</h1>
        <button
          onClick={() => router.push('/admin/tenants')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Tenants
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/tenants')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tenants
          </button>
          <div className="h-6 border-l border-gray-300" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
            <p className="text-gray-600 mt-1">Update tenant information</p>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Center Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in URL: trainkit.co.uk/{formData.slug}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type
              </label>
              <select
                value={formData.planType}
                onChange={(e) => handleInputChange('planType', e.target.value as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STARTER">Starter (£297/month - 50 students)</option>
                <option value="PROFESSIONAL">Professional (£497/month - 150 students)</option>
                <option value="ENTERPRISE">Enterprise (£797/month - Unlimited students)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.planType === 'ENTERPRISE' ? 'Unlimited' : formData.maxStudents}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically set based on plan type
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">SEO & Business Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                value={formData.businessType || ''}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select business type</option>
                <option value="Gas Safety Training Centre">Gas Safety Training Centre</option>
                <option value="Electrical Training Academy">Electrical Training Academy</option>
                <option value="Plumbing Training Academy">Plumbing Training Academy</option>
                <option value="Construction Training Provider">Construction Training Provider</option>
                <option value="Health & Safety Training">Health & Safety Training</option>
                <option value="Professional Development Centre">Professional Development Centre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County / Region
              </label>
              <input
                type="text"
                value={formData.county || ''}
                onChange={(e) => handleInputChange('county', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Devon, Cornwall, Wales, Scotland"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter any UK county, region, or country (England, Wales, Scotland, Northern Ireland)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO title for search engines"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.metaTitle || '').length}/60 characters
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription || ''}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="SEO description for search engines"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.metaDescription || '').length}/160 characters
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Status</h2>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange('active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Active (tenant can access their admin portal and accept bookings)
            </label>
          </div>
        </div>
      </form>
    </div>
  )
}