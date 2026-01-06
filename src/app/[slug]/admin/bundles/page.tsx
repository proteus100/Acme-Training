'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Crown,
  Award,
  Calendar,
  DollarSign,
  Percent,
  Users
} from 'lucide-react'

interface Bundle {
  id: string
  title: string
  description: string
  tagline: string | null
  tier: string
  originalPrice: number
  bundlePrice: number
  savings: number
  discountPercentage: number
  isActive: boolean
  isPopular: boolean
  displayOrder: number
  features: string[]
  benefits: string[]
  courses: {
    id: string
    title: string
    category: string
    duration: number
    price: number
  }[]
  createdAt: string
  updatedAt: string
}

export default function TenantAdminBundlesPage() {
  const router = useRouter()
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string>('')

  useEffect(() => {
    // Get tenant slug from URL
    const path = window.location.pathname
    const match = path.match(/^\/([^\/]+)\/admin/)
    if (match) {
      setSlug(match[1])
    }
  }, [])

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bundles')
      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }
      const data = await response.json()
      setBundles(data)
    } catch (error) {
      console.error('Error fetching bundles:', error)
      setError('Failed to load bundles')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBundleStatus = async (bundleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update bundle')
      }

      fetchBundles()
    } catch (error) {
      console.error('Error updating bundle:', error)
      alert('Failed to update bundle status')
    }
  }

  const deleteBundle = async (bundleId: string, bundleTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bundleTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/bundles/${bundleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete bundle')
      }

      fetchBundles()
    } catch (error) {
      console.error('Error deleting bundle:', error)
      alert('Failed to delete bundle')
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FOUNDATION':
        return 'bg-blue-100 text-blue-800'
      case 'PROFESSIONAL':
        return 'bg-purple-100 text-purple-800'
      case 'SPECIALIST':
        return 'bg-orange-100 text-orange-800'
      case 'MASTER':
        return 'bg-green-100 text-green-800'
      case 'ELITE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'FOUNDATION':
        return <Award className="w-4 h-4" />
      case 'PROFESSIONAL':
        return <Star className="w-4 h-4" />
      case 'SPECIALIST':
        return <TrendingUp className="w-4 h-4" />
      case 'MASTER':
        return <Crown className="w-4 h-4" />
      case 'ELITE':
        return <Crown className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading bundles...</span>
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
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Course Bundles</h1>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {bundles.length} {bundles.length === 1 ? 'Bundle' : 'Bundles'}
              </span>
            </div>

            <button
              onClick={() => router.push(`/${slug}/admin/bundles/create`)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Bundle</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {bundles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bundles yet</h3>
            <p className="text-gray-600 mb-6">Create your first course bundle to offer discounted packages to students.</p>
            <button
              onClick={() => router.push(`/${slug}/admin/bundles/create`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Bundle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className={`bg-white rounded-lg border-2 transition-all ${
                  bundle.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(bundle.tier)}`}>
                          {getTierIcon(bundle.tier)}
                          <span className="ml-1">{bundle.tier}</span>
                        </span>
                        {bundle.isPopular && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </span>
                        )}
                        {!bundle.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{bundle.title}</h3>
                      {bundle.tagline && (
                        <p className="text-sm text-gray-600 mt-1">{bundle.tagline}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Original Price</p>
                      <p className="text-sm font-medium text-gray-500 line-through">
                        £{bundle.originalPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bundle Price</p>
                      <p className="text-lg font-bold text-blue-600">
                        £{bundle.bundlePrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Savings</p>
                      <p className="text-sm font-medium text-green-600">
                        £{bundle.savings.toFixed(2)} ({bundle.discountPercentage}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Courses */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    {bundle.courses.length} Course{bundle.courses.length !== 1 ? 's' : ''} Included
                  </p>
                  <div className="space-y-2">
                    {bundle.courses.slice(0, 3).map((course) => (
                      <div key={course.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{course.title}</span>
                        <span className="text-gray-500">{course.duration}d</span>
                      </div>
                    ))}
                    {bundle.courses.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{bundle.courses.length - 3} more course{bundle.courses.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => toggleBundleStatus(bundle.id, bundle.isActive)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      bundle.isActive
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {bundle.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span className="text-sm">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Show</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/${slug}/admin/bundles/edit/${bundle.id}`)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </button>

                    <button
                      onClick={() => deleteBundle(bundle.id, bundle.title)}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
