'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar } from 'lucide-react'

interface Course {
  id: string
  title: string
  maxStudents: number
  description: string
  category: string
  price: number
}

export default function NewSession() {
  const [formData, setFormData] = useState({
    courseId: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    availableSpots: '12'
  })

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
        console.log('Loaded courses:', data.length)
      } else {
        console.error('Failed to fetch courses:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.courseId || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields')
      return
    }

    // Validate end date is after start date
    if (formData.endDate < formData.startDate) {
      alert('End date must be after start date')
      return
    }

    // Validate end time is after start time if same day
    if (formData.startDate === formData.endDate && formData.endTime <= formData.startTime) {
      alert('End time must be after start time for same-day sessions')
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: formData.courseId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          availableSpots: parseInt(formData.availableSpots)
        })
      })

      if (response.ok) {
        const session = await response.json()
        alert('Session created successfully!')
        
        // Reset form
        setFormData({
          courseId: '',
          startDate: '',
          endDate: '',
          startTime: '09:00',
          endTime: '17:00',
          availableSpots: '12'
        })
      } else {
        const error = await response.json()
        console.error('Failed to create session:', error.error)
        alert('Failed to create session: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Error creating session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value
    const course = courses.find(c => c.id === courseId)
    setFormData({ 
      ...formData, 
      courseId,
      availableSpots: course ? course.maxStudents.toString() : '12'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/admin" className="mr-4 p-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule New Session</h1>
              <p className="text-gray-600">Create a new training session for a course</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Course *
              </label>
              <select
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleCourseChange}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">{loading ? 'Loading courses...' : 'Choose a course...'}</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title} (Max: {course.maxStudents} students)
                  </option>
                ))}
              </select>
            </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="availableSpots" className="block text-sm font-medium text-gray-700 mb-2">
                Available Spots
              </label>
              <input
                type="number"
                id="availableSpots"
                name="availableSpots"
                value={formData.availableSpots}
                onChange={handleChange}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of students for this session
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Session Scheduling Tips</h3>
                  <div className="text-sm text-blue-700 mt-1">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Consider course duration when setting dates</li>
                      <li>Allow time for breaks and practical exercises</li>
                      <li>Check for conflicts with existing sessions</li>
                      <li>Consider weekend and evening options for working professionals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}