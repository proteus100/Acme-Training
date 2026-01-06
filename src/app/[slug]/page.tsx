'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  city?: string
  postcode?: string
  planType: string
  maxStudents: number
  maxCourses: number
  logo?: string
}

export default function TenantPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTenant() {
      try {
        const response = await fetch(`/api/tenant/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/tenant-not-found')
            return
          }
          throw new Error('Failed to fetch tenant')
        }
        const data = await response.json()
        setTenant(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchTenant()
    }
  }, [slug, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading tenant information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            {tenant.logo && (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="h-20 mx-auto mb-6"
              />
            )}
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {tenant.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Professional Training Management Platform
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome to {tenant.name}
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Email:</strong> {tenant.email}
              </p>
              {tenant.phone && (
                <p>
                  <strong>Phone:</strong> {tenant.phone}
                </p>
              )}
              {tenant.address && (
                <div>
                  <strong>Address:</strong>
                  <p className="mt-1">
                    {tenant.address}
                    {tenant.city && `, ${tenant.city}`}
                    {tenant.postcode && ` ${tenant.postcode}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Plan Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Current Plan: {tenant.planType}
                </h3>
                <p className="text-blue-800">
                  Max Students: {tenant.maxStudents === 999999 ? 'Unlimited' : tenant.maxStudents}
                  {' • '}
                  Max Courses: {tenant.maxCourses === 999999 ? 'Unlimited' : tenant.maxCourses}
                </p>
              </div>
              <a
                href={`/${slug}/admin`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Admin Portal
              </a>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mt-12 text-center text-gray-600">
            <p className="text-lg">
              Public course catalog coming soon...
            </p>
            <p className="text-sm mt-2">
              For now, please use the admin portal to manage your training center.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
