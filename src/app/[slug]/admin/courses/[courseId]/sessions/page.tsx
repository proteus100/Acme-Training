'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  FileText,
  PoundSterling
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  category: string
  duration: number
  price: number
  maxStudents: number
}

interface CourseSession {
  id: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  availableSpots: number
  bookedSpots: number
  isActive: boolean
  isCompleted: boolean
  instructorNotes?: string
  _count: {
    bookings: number
  }
  bookings: Array<{
    id: string
    status: string
    customer: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
      company: string
    }
    payments: Array<{
      id: string
      amount: number
      status: string
      paidAt: string
    }>
  }>
}

export default function SessionsPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [sessions, setSessions] = useState<CourseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingSession, setViewingSession] = useState<CourseSession | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    availableSpots: '',
    instructorNotes: ''
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tenant/${params.slug}/courses/${params.courseId}/sessions`)
      
      if (response.ok) {
        const data = await response.json()
        setCourse(data.course)
        setSessions(data.sessions)
      } else {
        console.error('Failed to fetch sessions')
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses/${params.courseId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          availableSpots: '',
          instructorNotes: ''
        })
        fetchSessions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
    }
  }

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingSession) return

    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses/${params.courseId}/sessions/${editingSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingSession(null)
        fetchSessions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Failed to update session')
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/tenant/${params.slug}/courses/${params.courseId}/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSessions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session')
    }
  }

  const openEditModal = (session: CourseSession) => {
    setEditingSession(session)
    setFormData({
      startDate: session.startDate.split('T')[0],
      endDate: session.endDate.split('T')[0],
      startTime: session.startTime,
      endTime: session.endTime,
      availableSpots: session.availableSpots.toString(),
      instructorNotes: session.instructorNotes || ''
    })
    setShowEditModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (session: CourseSession) => {
    if (session.isCompleted) return 'bg-green-100 text-green-800'
    if (!session.isActive) return 'bg-red-100 text-red-800'
    if (session.bookedSpots >= session.availableSpots) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (session: CourseSession) => {
    if (session.isCompleted) return 'Completed'
    if (!session.isActive) return 'Cancelled'
    if (session.bookedSpots >= session.availableSpots) return 'Full'
    return 'Available'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href={`/${params.slug}/admin/courses`}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {course?.title} - Sessions
              </h1>
              <p className="text-gray-600 mt-1">
                Manage training sessions and bookings for this course
              </p>
              
              {course && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration} hours
                  </span>
                  <span className="flex items-center">
                    <PoundSterling className="w-4 h-4 mr-1" />
                    £{course.price}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Max {course.maxStudents} students
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </button>
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled</h3>
            <p className="text-gray-600 mb-4">Create your first training session to start accepting bookings.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(session.startDate)}
                        {session.startDate !== session.endDate && (
                          <span> - {formatDate(session.endDate)}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {session.startTime} - {session.endTime}
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session)}`}>
                        {getStatusText(session)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {session.bookedSpots} / {session.availableSpots} booked
                      </span>
                      
                      {session.instructorNotes && (
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          Has notes
                        </span>
                      )}
                    </div>
                    
                    {session.bookings.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Recent Bookings:</h4>
                        <div className="space-y-1">
                          {session.bookings.slice(0, 3).map((booking) => (
                            <div key={booking.id} className="text-sm text-gray-600">
                              {booking.customer.firstName} {booking.customer.lastName}
                              {booking.customer.company && ` - ${booking.customer.company}`}
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                          {session.bookings.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{session.bookings.length - 3} more bookings
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setViewingSession(session)
                        setShowViewModal(true)
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => openEditModal(session)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Session"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Session"
                      disabled={session._count.bookings > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Session</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Spots *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={course?.maxStudents || 50}
                    required
                    value={formData.availableSpots}
                    onChange={(e) => setFormData({...formData, availableSpots: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum {course?.maxStudents || 50} students per session
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.instructorNotes}
                    onChange={(e) => setFormData({...formData, instructorNotes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional notes for instructors..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Session Modal */}
        {showEditModal && editingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Session</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSession} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Spots *
                  </label>
                  <input
                    type="number"
                    min={editingSession.bookedSpots}
                    max={course?.maxStudents || 50}
                    required
                    value={formData.availableSpots}
                    onChange={(e) => setFormData({...formData, availableSpots: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum {editingSession.bookedSpots} (current bookings), Maximum {course?.maxStudents || 50}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.instructorNotes}
                    onChange={(e) => setFormData({...formData, instructorNotes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional notes for instructors..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Session Details Modal */}
        {showViewModal && viewingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Session Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Date:</span>
                      <p>{formatDate(viewingSession.startDate)} - {formatDate(viewingSession.endDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Time:</span>
                      <p>{viewingSession.startTime} - {viewingSession.endTime}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Capacity:</span>
                      <p>{viewingSession.bookedSpots} / {viewingSession.availableSpots} students</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingSession)}`}>
                        {getStatusText(viewingSession)}
                      </span>
                    </div>
                    {viewingSession.instructorNotes && (
                      <div>
                        <span className="text-sm text-gray-500">Instructor Notes:</span>
                        <p className="bg-gray-50 p-3 rounded mt-1">{viewingSession.instructorNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Bookings ({viewingSession.bookings.length})</h4>
                  {viewingSession.bookings.length === 0 ? (
                    <p className="text-gray-500">No bookings yet</p>
                  ) : (
                    <div className="space-y-3">
                      {viewingSession.bookings.map((booking) => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {booking.customer.firstName} {booking.customer.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{booking.customer.email}</p>
                              {booking.customer.company && (
                                <p className="text-sm text-gray-600">{booking.customer.company}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.payments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500">
                                Payment: £{booking.payments[0].amount} ({booking.payments[0].status})
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}