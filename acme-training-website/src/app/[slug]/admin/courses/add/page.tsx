'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  BookOpen, 
  Save, 
  X,
  Clock,
  Users,
  PoundSterling,
  AlertCircle,
  CheckCircle,
  Crown,
  Zap,
  ArrowRight
} from 'lucide-react'

const COURSE_CATEGORIES = [
  { value: 'GAS_SAFE', label: 'Gas Safe' },
  { value: 'HEAT_PUMP', label: 'Heat Pump' },
  { value: 'OFTEC', label: 'OFTEC' },
  { value: 'LPG', label: 'LPG' },
  { value: 'VAPORIZING', label: 'Vaporizing' },
  { value: 'WATER', label: 'Water Regulations' },
  { value: 'FGAS_AIR_CONDITIONING', label: 'F-Gas Air Conditioning' },
  { value: 'COMMERCIAL_CATERING', label: 'Commercial Catering' },
  { value: 'COMMERCIAL_LAUNDRY', label: 'Commercial Laundry' },
  { value: 'COMMERCIAL_GAS', label: 'Commercial Gas' },
  { value: 'COMMERCIAL_CORE', label: 'Commercial Core' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'REFRIGERATION', label: 'Refrigeration' }
]

export default function AddCoursePage() {
  const params = useParams()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'upgrade', text: string } | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '8',
    price: '450.00',
    maxStudents: '12'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.category) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          maxStudents: parseInt(formData.maxStudents)
        })
      })

      const data = await response.json()
      console.log('API Response:', data)

      if (data.success) {
        setMessage({ type: 'success', text: 'Course created successfully!' })
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/${params.slug}/admin/courses`)
        }, 1500)
      } else {
        console.log('Error detected:', data.error)
        console.log('Contains "Course limit reached"?', data.error?.includes('Course limit reached'))
        
        // Check if it's a plan limit error
        if (data.error && data.error.includes('Course limit reached')) {
          console.log('Setting upgrade modal to true')
          setMessage({ type: 'upgrade', text: data.error })
          setShowUpgradeModal(true)
          console.log('showUpgradeModal state should now be:', true)
        } else {
          console.log('Not a course limit error, showing regular error')
          setMessage({ type: 'error', text: data.error || 'Failed to create course' })
        }
      }
    } catch (error) {
      console.error('Error creating course:', error)
      setMessage({ type: 'error', text: 'Failed to create course. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${params.slug}/admin/courses`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          Add New Course
        </h1>
        <p className="text-gray-600 mt-2">
          Create a new training course for your students
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : message.type === 'upgrade'
            ? 'bg-orange-50 text-orange-800 border border-orange-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : message.type === 'upgrade' ? (
            <Crown className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {/* Course Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Gas Safe ACS Foundation Course"
            />
          </div>

          {/* Course Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what students will learn in this course..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Course Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {COURSE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (hours) *
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="1"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                <PoundSterling className="w-4 h-4 inline mr-1" />
                Price (£) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Max Students */}
            <div>
              <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Max Students *
              </label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleInputChange}
                required
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/${params.slug}/admin/courses`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>

      {/* Debug info */}
      <div className="fixed top-4 right-4 bg-yellow-100 p-2 text-xs z-[9999]">
        showUpgradeModal: {showUpgradeModal ? 'true' : 'false'}
        <br />
        <button 
          onClick={() => setShowUpgradeModal(!showUpgradeModal)}
          className="bg-blue-500 text-white px-2 py-1 text-xs mt-1"
        >
          Toggle Modal
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (() => {
        console.log('RENDERING UPGRADE MODAL - should be visible now');
        return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4" 
          style={{
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            console.log('Modal backdrop clicked');
            if (e.target === e.currentTarget) {
              console.log('Closing modal via backdrop click');
              setShowUpgradeModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl"
            style={{
              position: 'relative',
              backgroundColor: 'white',
              maxWidth: '32rem',
              width: '100%',
              borderRadius: '0.75rem',
              maxHeight: '100vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => {
              console.log('Modal content clicked');
              e.stopPropagation();
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Upgrade Your Plan
                </h2>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">Course Limit Reached</p>
                  </div>
                  <p className="text-orange-700 mt-1">
                    Your PROFESSIONAL plan allows 5 courses. Upgrade to add more courses and unlock additional features.
                  </p>
                </div>
              </div>

              {/* Plan Comparison */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Current Plan */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">PROFESSIONAL</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">Current</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Max Courses:</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Students:</span>
                      <span className="font-medium">150</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Price:</span>
                      <span className="font-medium">£49/month</span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Option */}
                <div className="border-2 border-blue-500 rounded-lg p-6 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">Recommended</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">ENTERPRISE</h3>
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Max Courses:</span>
                      <span className="font-medium text-green-600">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Students:</span>
                      <span className="font-medium text-green-600">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Price:</span>
                      <span className="font-medium">£149/month</span>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Advanced analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Custom branding
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  href={`/${params.slug}/admin/billing/upgrade`}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  Need help choosing? <span className="text-blue-600 hover:underline cursor-pointer">Contact our support team</span> for personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  )
}