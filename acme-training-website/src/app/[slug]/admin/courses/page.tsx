'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  MoreVertical,
  Clock,
  Users,
  Calendar,
  PoundSterling,
  CheckCircle,
  XCircle,
  X,
  Save,
  BookTemplate,
  Zap,
  Trash2,
  Filter
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  category: string
  duration: number
  price: number
  maxStudents: number
  createdAt: string
  _count: {
    sessions: number
  }
}

interface CourseSession {
  id: string
  startDate: string
  endDate: string
  availableSpots: number
  bookedSpots: number
  isActive: boolean
  isCompleted: boolean
}

interface CourseTemplate {
  id: string
  title: string
  description: string
  category: string
  duration: number
  price: number
  maxStudents: number
  tags: string[]
  icon: string
}

const COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: 'gas-safe-basic',
    title: 'Gas Safe ACS Foundation',
    description: 'Essential Gas Safe training covering core safety principles, gas law, and combustion analysis for domestic installations.',
    category: 'GAS_SAFE',
    duration: 16,
    price: 485.00,
    maxStudents: 12,
    tags: ['Foundation', 'ACS', 'Domestic'],
    icon: '🔥'
  },
  {
    id: 'heat-pump-installation',
    title: 'Heat Pump Installation & Maintenance',
    description: 'Comprehensive training on air source heat pump installation, commissioning, and ongoing maintenance for residential properties.',
    category: 'HEAT_PUMP',
    duration: 24,
    price: 650.00,
    maxStudents: 10,
    tags: ['Installation', 'Renewable', 'Residential'],
    icon: '🌡️'
  },
  {
    id: 'oftec-oil-burner',
    title: 'OFTEC Oil Burner Service & Maintenance',
    description: 'OFTEC approved course covering oil burner servicing, fault diagnosis, and installation of oil-fired heating systems.',
    category: 'OFTEC',
    duration: 20,
    price: 575.00,
    maxStudents: 12,
    tags: ['OFTEC', 'Oil Systems', 'Service'],
    icon: '🛢️'
  },
  {
    id: 'lpg-commercial',
    title: 'Commercial LPG Systems',
    description: 'Advanced LPG training for commercial applications including bulk storage, distribution systems, and safety protocols.',
    category: 'LPG',
    duration: 18,
    price: 525.00,
    maxStudents: 8,
    tags: ['Commercial', 'LPG', 'Advanced'],
    icon: '⚡'
  },
  {
    id: 'water-regulations',
    title: 'Water Regulations & Backflow Prevention',
    description: 'Essential training on water supply regulations, backflow prevention devices, and cross-connection control systems.',
    category: 'WATER',
    duration: 8,
    price: 285.00,
    maxStudents: 16,
    tags: ['Regulations', 'Prevention', 'Compliance'],
    icon: '💧'
  },
  {
    id: 'fgas-air-con',
    title: 'F-Gas Air Conditioning Systems',
    description: 'F-Gas certified training for handling refrigerants in air conditioning and heat pump systems including leak detection.',
    category: 'FGAS_AIR_CONDITIONING',
    duration: 16,
    price: 445.00,
    maxStudents: 12,
    tags: ['F-Gas', 'Air Con', 'Refrigerants'],
    icon: '❄️'
  },
  {
    id: 'commercial-catering-gas',
    title: 'Commercial Catering Gas Appliances',
    description: 'Specialized training for commercial kitchen gas equipment installation, servicing, and safety in catering environments.',
    category: 'COMMERCIAL_CATERING',
    duration: 20,
    price: 595.00,
    maxStudents: 10,
    tags: ['Commercial', 'Catering', 'Kitchen'],
    icon: '👨‍🍳'
  },
  {
    id: 'electrical-safety',
    title: 'Electrical Safety for Gas Engineers',
    description: 'Essential electrical safety training for gas engineers working with electrical controls and ignition systems.',
    category: 'ELECTRICAL',
    duration: 12,
    price: 365.00,
    maxStudents: 14,
    tags: ['Electrical', 'Safety', 'Controls'],
    icon: '⚡'
  }
]

export default function TenantCoursesPage() {
  const params = useParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  
  // Template modal states
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit and delete modal states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Edit form data
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    price: '',
    maxStudents: ''
  })

  const categories = [
    'GAS_SAFE',
    'HEAT_PUMP',
    'OFTEC',
    'LPG',
    'WATER',
    'ELECTRICAL',
    'REFRIGERATION'
  ]

  useEffect(() => {
    fetchCourses()
  }, [params.slug])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, filterCategory])

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses`)
      const data = await response.json()
      if (data.success) {
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(c => c.category === filterCategory)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term)
      )
    }

    setFilteredCourses(filtered)
  }

  // Handler functions for templates
  const handleCreateFromTemplate = async (template: CourseTemplate) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          category: template.category,
          duration: template.duration,
          price: template.price,
          maxStudents: template.maxStudents
        })
      })

      if (response.ok) {
        const newCourse = await response.json()
        setCourses([...courses, newCourse.course])
        setShowTemplatesModal(false)
        
        // Show success message
        alert(`Course "${template.title}" created successfully!`)
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

  // Handler functions for edit/delete
  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setEditForm({
      title: course.title,
      description: course.description,
      category: course.category,
      duration: course.duration.toString(),
      price: course.price.toString(),
      maxStudents: course.maxStudents.toString()
    })
    setShowEditModal(true)
  }

  const handleDelete = (course: Course) => {
    setDeletingCourse(course)
    setShowDeleteModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCourse) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          duration: parseInt(editForm.duration),
          price: parseFloat(editForm.price),
          maxStudents: parseInt(editForm.maxStudents)
        })
      })

      if (response.ok) {
        const updatedCourse = await response.json()
        
        // Update local state
        setCourses(courses.map(course => 
          course.id === editingCourse.id ? updatedCourse.course : course
        ))
        
        setShowEditModal(false)
        setEditingCourse(null)
      } else {
        const error = await response.json()
        console.error('Failed to update course:', error.error)
        alert('Failed to update course: ' + error.error)
      }
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error saving course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses/${deletingCourse.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Parse success response
        const result = await response.json()
        
        // Remove course from local state
        setCourses(courses.filter(course => course.id !== deletingCourse.id))
        
        setShowDeleteModal(false)
        setDeletingCourse(null)
      } else {
        const error = await response.json()
        console.error('Failed to delete course:', error.error || error.message)
        alert('Failed to delete course: ' + (error.error || error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Error deleting course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'GAS_SAFE': 'bg-blue-100 text-blue-800',
      'HEAT_PUMP': 'bg-green-100 text-green-800',
      'OFTEC': 'bg-purple-100 text-purple-800',
      'LPG': 'bg-orange-100 text-orange-800',
      'WATER': 'bg-cyan-100 text-cyan-800',
      'ELECTRICAL': 'bg-yellow-100 text-yellow-800',
      'REFRIGERATION': 'bg-indigo-100 text-indigo-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Manage your training courses and sessions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BookTemplate className="w-4 h-4 mr-2" />
            Course Templates
          </button>
          <Link
            href={`/${params.slug}/admin/courses/add`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, c) => sum + (c._count?.sessions || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <PoundSterling className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Course Price</p>
              <p className="text-2xl font-bold text-gray-900">
                £{courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.price, 0) / courses.length) : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, c) => sum + c.maxStudents, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Courses ({filteredCourses.length})
          </h2>
        </div>
        
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterCategory !== 'all' ? 'No matching courses' : 'No courses yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by adding your first course.'}
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <Link
                href={`/${params.slug}/admin/courses/add`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Course
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                    {getCategoryDisplayName(course.category)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900 p-1"
                      onClick={() => handleEdit(course)}
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 p-1"
                      onClick={() => handleDelete(course)}
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration} hours
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      Max {course.maxStudents}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {course._count?.sessions || 0} sessions
                    </div>
                    <div className="font-semibold text-gray-900">
                      £{course.price}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`/${params.slug}/admin/courses/${course.id}/sessions`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Manage Sessions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Course</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryDisplayName(category)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={editForm.duration}
                    onChange={handleEditFormChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Hours"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students *
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={editForm.maxStudents}
                    onChange={handleEditFormChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Maximum number of students"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete the course <strong>"{deletingCourse.title}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone. All associated sessions and bookings will be affected.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                {saving ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Course Templates</h3>
                <p className="text-gray-600 mt-1">Choose from our pre-built course templates to get started quickly</p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COURSE_TEMPLATES.map((template) => (
                <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{template.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium">{getCategoryDisplayName(template.category)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{template.duration} hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium">{formatCurrency(template.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Students:</span>
                      <span className="font-medium">{template.maxStudents}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCreateFromTemplate(template)}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {saving ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-gray-600 text-sm">
                These templates provide a starting point for your courses. You can customize them after creation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}