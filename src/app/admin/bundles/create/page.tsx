'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  ArrowLeft,
  Plus,
  X,
  Calculator,
  Save,
  AlertCircle
} from 'lucide-react'

interface Course {
  id: string
  title: string
  category: string
  duration: number
  price: number
}

export default function CreateBundlePage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagline, setTagline] = useState('')
  const [tier, setTier] = useState<string>('FOUNDATION')
  const [discountPercentage, setDiscountPercentage] = useState(20)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [features, setFeatures] = useState<string[]>([''])
  const [benefits, setBenefits] = useState<string[]>([''])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (!response.ok) throw new Error('Failed to fetch courses')
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Failed to load courses')
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(selectedCourseIds.filter(id => id !== courseId))
    } else {
      setSelectedCourseIds([...selectedCourseIds, courseId])
    }
  }

  const addFeature = () => {
    setFeatures([...features, ''])
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const addBenefit = () => {
    setBenefits([...benefits, ''])
  }

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits]
    newBenefits[index] = value
    setBenefits(newBenefits)
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const calculatePricing = () => {
    const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id))
    const originalPrice = selectedCourses.reduce((sum, c) => sum + c.price, 0)
    const bundlePrice = originalPrice * (1 - discountPercentage / 100)
    const savings = originalPrice - bundlePrice

    return { originalPrice, bundlePrice, savings }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate
      if (!title.trim()) {
        throw new Error('Title is required')
      }
      if (!description.trim()) {
        throw new Error('Description is required')
      }
      if (selectedCourseIds.length === 0) {
        throw new Error('Please select at least one course')
      }

      const cleanFeatures = features.filter(f => f.trim() !== '')
      const cleanBenefits = benefits.filter(b => b.trim() !== '')

      const bundleData = {
        title,
        description,
        tagline: tagline || null,
        tier,
        courseIds: selectedCourseIds,
        discountPercentage,
        isPopular,
        isActive,
        features: cleanFeatures.length > 0 ? cleanFeatures : null,
        benefits: cleanBenefits.length > 0 ? cleanBenefits : null
      }

      const response = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bundle')
      }

      router.push('/admin/bundles')
    } catch (error: any) {
      console.error('Error creating bundle:', error)
      setError(error.message || 'Failed to create bundle')
    } finally {
      setIsLoading(false)
    }
  }

  const pricing = calculatePricing()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/bundles')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Bundles</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">Create Course Bundle</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundle Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Foundation Starter Bundle"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Perfect for Career Beginners"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what makes this bundle valuable..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier Level
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FOUNDATION">Foundation</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="SPECIALIST">Specialist</option>
                    <option value="MASTER">Master</option>
                    <option value="ELITE">Elite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Mark as Popular</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active (visible to students)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Course Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Courses * ({selectedCourseIds.length} selected)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courses.map((course) => (
                <label
                  key={course.id}
                  className={`flex items-start space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCourseIds.includes(course.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(course.id)}
                    onChange={() => toggleCourseSelection(course.id)}
                    className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{course.title}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-600">{course.duration} days</span>
                      <span className="text-xs font-medium text-blue-600">£{course.price}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing Calculation */}
          {selectedCourseIds.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calculator className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Pricing Calculation</h2>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Original Price</p>
                  <p className="text-2xl font-bold text-gray-700">£{pricing.originalPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Sum of all courses</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bundle Price</p>
                  <p className="text-3xl font-bold text-blue-600">£{pricing.bundlePrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">After {discountPercentage}% discount</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Student Saves</p>
                  <p className="text-2xl font-bold text-green-600">£{pricing.savings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">{discountPercentage}% off</p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Features (Optional)</h2>
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Feature</span>
              </button>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Industry-recognized certifications"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Benefits (Optional)</h2>
              <button
                type="button"
                onClick={addBenefit}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Benefit</span>
              </button>
            </div>

            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Career entry qualifications"
                  />
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/bundles')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedCourseIds.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{isLoading ? 'Creating...' : 'Create Bundle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
