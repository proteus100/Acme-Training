'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Save, X, AlertCircle } from 'lucide-react'

interface Session {
  id: string
  course: {
    id: string
    title: string
    category: string
  }
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  availableSpots: number
  bookedSpots: number
  isActive: boolean
  bookings: any[]
}

export default function EditSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    availableSpots: 0,
    isActive: true
  })

  useEffect(() => {
    loadSession()
  }, [sessionId])

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data)

        // Format dates for input fields (YYYY-MM-DD)
        const startDate = new Date(data.startDate).toISOString().split('T')[0]
        const endDate = new Date(data.endDate).toISOString().split('T')[0]

        setFormData({
          startDate,
          endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          availableSpots: data.availableSpots,
          isActive: data.isActive
        })
      } else {
        setError('Failed to load session')
      }
    } catch (error) {
      console.error('Error loading session:', error)
      setError('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin/sessions')
        router.refresh()
      } else {
        setError(data.error || 'Failed to update session')
      }
    } catch (error) {
      console.error('Error updating session:', error)
      setError('Failed to update session')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading session...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Session not found</p>
        <Link
          href="/admin/sessions"
          className="text-blue-600 hover:text-blue-500 mt-2 inline-block"
        >
          Back to sessions
        </Link>
      </div>
    )
  }

  const hasActiveBookings = session.bookings && session.bookings.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Training Session</h1>
          <p className="text-gray-600 mt-1">
            Modify session schedule and details
          </p>
        </div>
        <Link
          href="/admin/sessions"
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </Link>
      </div>

      {/* Session Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{session.course.title}</h3>
            <p className="text-sm text-gray-600">{session.course.category}</p>
            {hasActiveBookings && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span>
                  This session has {session.bookings.length} active booking(s).
                  Please notify students if you change dates.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {hasActiveBookings && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {session.bookings.length} student(s) are booked
              </p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {hasActiveBookings && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {session.bookings.length} student(s) are booked
              </p>
            )}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Available Spots */}
        <div>
          <label htmlFor="availableSpots" className="block text-sm font-medium text-gray-700 mb-2">
            Available Spots *
          </label>
          <input
            type="number"
            id="availableSpots"
            name="availableSpots"
            value={formData.availableSpots}
            onChange={handleChange}
            min={session.bookedSpots}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Currently booked: {session.bookedSpots} / Minimum: {session.bookedSpots}
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Session is active (visible for booking)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/admin/sessions"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
