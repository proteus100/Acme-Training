'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewCourse() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    customCategoryName: '',
    duration: '',
    price: '',
    maxStudents: '12'
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.category || !formData.duration || !formData.price) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.category === 'CUSTOM' && !formData.customCategoryName) {
      alert('Please enter a custom category name')
      return
    }

    if (parseFloat(formData.price) <= 0) {
      alert('Price must be greater than 0')
      return
    }

    if (parseInt(formData.duration) <= 0) {
      alert('Duration must be greater than 0 hours')
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          customCategoryName: formData.category === 'CUSTOM' ? formData.customCategoryName : undefined,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          maxStudents: parseInt(formData.maxStudents)
        })
      })

      if (response.ok) {
        const course = await response.json()
        alert('Course created successfully!')
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          customCategoryName: '',
          duration: '',
          price: '',
          maxStudents: '12'
        })
      } else {
        const error = await response.json()
        console.error('Failed to create course:', error.error)
        alert('Failed to create course: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Error creating course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/admin/courses" className="mr-4 p-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600">Add a new training course to your catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Inspection & Testing 2391-52"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Initial verification and periodic inspection and testing of electrical installations covering 18th Edition requirements..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="GAS_SAFE">Gas Safe</option>
                  <option value="HEAT_PUMP">Heat Pump</option>
                  <option value="OFTEC">OFTEC</option>
                  <option value="LPG">LPG</option>
                  <option value="VAPORIZING">Vaporizing</option>
                  <option value="WATER">Water</option>
                  <option value="FGAS_AIR_CONDITIONING">F-Gas Air Conditioning</option>
                  <option value="COMMERCIAL_CATERING">Commercial Catering</option>
                  <option value="COMMERCIAL_LAUNDRY">Commercial Laundry</option>
                  <option value="COMMERCIAL_GAS">Commercial Gas</option>
                  <option value="COMMERCIAL_CORE">Commercial Core</option>
                  <option value="ELECTRICAL">Electrical (NIC EIC Testing & Inspection)</option>
                  <option value="REFRIGERATION">Refrigeration</option>
                  <option value="CUSTOM">Custom Category</option>
                </select>
              </div>

              {formData.category === 'CUSTOM' && (
                <div>
                  <label htmlFor="customCategoryName" className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Category Name *
                  </label>
                  <input
                    type="text"
                    id="customCategoryName"
                    name="customCategoryName"
                    value={formData.customCategoryName}
                    onChange={handleChange}
                    required={formData.category === 'CUSTOM'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Solar Panel Installation"
                  />
                </div>
              )}

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 16"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (£) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 650.00"
                />
              </div>

              <div>
                <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Students
                </label>
                <input
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/admin/courses"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}