'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  PoundSterling,
  Clock,
  X,
  Save,
  BookTemplate,
  Zap,
  CheckCircle
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  category: string
  customCategoryName?: string | null
  duration: number
  price: number
  maxStudents: number
  sessions: any[]
  createdAt: string
  updatedAt: string
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

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  // Modal states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit form data
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    price: '',
    maxStudents: ''
  })

  useEffect(() => {
    fetchCourses()
    fetchTenants()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      if (response.ok) {
        const data = await response.json()
        const tenantsArray = data.tenants || []
        setTenants(tenantsArray)
        // Set first tenant as default selection
        if (tenantsArray.length > 0) {
          setSelectedTenantId(tenantsArray[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  // Handler functions
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
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
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
          course.id === editingCourse.id ? updatedCourse : course
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
      const response = await fetch(`/api/courses/${deletingCourse.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove course from local state
        setCourses(courses.filter(course => course.id !== deletingCourse.id))
        
        setShowDeleteModal(false)
        setDeletingCourse(null)
      } else {
        const error = await response.json()
        console.error('Failed to delete course:', error.error)
        alert('Failed to delete course: ' + error.error)
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

  const handleCreateFromTemplate = async (template: CourseTemplate) => {
    if (!selectedTenantId) {
      alert('Please select a tenant first')
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
          title: template.title,
          description: template.description,
          category: template.category,
          duration: template.duration,
          price: template.price,
          maxStudents: template.maxStudents,
          tenantId: selectedTenantId
        })
      })

      if (response.ok) {
        const newCourse = await response.json()
        setCourses([...courses, newCourse])
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(courses.map(course => course.category))]

  // Category display names for better UX
  const categoryLabels: Record<string, string> = {
    'GAS_SAFE': 'Gas Safe',
    'HEAT_PUMP': 'Heat Pump',
    'OFTEC': 'OFTEC Oil',
    'LPG': 'LPG',
    'WATER': 'Water Regulations',
    'FGAS_AIR_CONDITIONING': 'F-Gas / Air Conditioning',
    'COMMERCIAL_CATERING': 'Commercial Catering',
    'ELECTRICAL': 'Electrical Safety',
    'CUSTOM': 'Custom',
    'gas_safe': 'Gas Safe',
    'heat_pump': 'Heat Pump',
    'oftec': 'OFTEC Oil',
    'lpg': 'LPG',
    'other': 'Other'
  }

  const getCategoryLabel = (category: string, customCategoryName?: string | null) => {
    if (category === 'CUSTOM' && customCategoryName) {
      return customCategoryName
    }
    return categoryLabels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm -mx-6 px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600">Manage your training courses and sessions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <BookTemplate className="w-4 h-4 mr-2" />
                Course Templates
              </button>
              <Link 
                href="/admin/courses/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.sort().map(category => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto pb-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No courses found</p>
            <Link 
              href="/admin/courses/new"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <PoundSterling className="w-4 h-4 mr-2" />
                          {formatCurrency(course.price)}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2" />
                          {course.duration} hours
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-2" />
                          Max {course.maxStudents} students
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {course.sessions.length} upcoming sessions
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryLabel(course.category, course.customCategoryName)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-700 p-1"
                        onClick={() => handleEdit(course)}
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-700 p-1"
                        onClick={() => handleDelete(course)}
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>
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
                    <option value="GAS_SAFE">Gas Safe</option>
                    <option value="HEAT_PUMP">Heat Pump</option>
                    <option value="OFTEC">OFTEC Oil</option>
                    <option value="LPG">LPG</option>
                    <option value="VAPORIZING">Vaporizing Appliances</option>
                    <option value="WATER">Water Regulations</option>
                    <option value="FGAS_AIR_CONDITIONING">F-Gas / Air Conditioning</option>
                    <option value="COMMERCIAL_CATERING">Commercial Catering</option>
                    <option value="COMMERCIAL_LAUNDRY">Commercial Laundry</option>
                    <option value="COMMERCIAL_GAS">Commercial Gas</option>
                    <option value="COMMERCIAL_CORE">Commercial Core</option>
                    <option value="ELECTRICAL">Electrical Safety</option>
                    <option value="REFRIGERATION">Refrigeration</option>
                    <option value="CUSTOM">Custom</option>
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

            {/* Tenant Selector */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Training Center (Tenant)
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select a tenant --</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-2">
                Course templates will be added to the selected training center
              </p>
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
                      <span className="font-medium">{getCategoryLabel(template.category)}</span>
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
    </>
  )
}