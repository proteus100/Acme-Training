'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Award,
  Bell
} from 'lucide-react'

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
  isCompleted: boolean
  completedAt?: string
  _count: {
    bookings: number
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all')
  const [minAttendees, setMinAttendees] = useState(4)
  const [alertingSession, setAlertingSession] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSessions()
    loadTenantSettings()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTenantSettings = async () => {
    try {
      const response = await fetch('/api/tenant/settings')
      if (response.ok) {
        const data = await response.json()
        setMinAttendees(data.minSessionAttendees || 4)
      }
    } catch (error) {
      console.error('Error loading tenant settings:', error)
    }
  }

  const handleAlertStudents = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Send low attendance alert to all enrolled students for "${sessionTitle}"?\n\nThis will notify them that the session may be postponed or rescheduled.`)) {
      return
    }

    setAlertingSession(sessionId)
    setAlertMessage(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/alert-students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        setAlertMessage({
          type: 'success',
          text: `Alert sent to ${data.notifiedCount} student(s) successfully!`
        })
        setTimeout(() => setAlertMessage(null), 5000)
      } else {
        setAlertMessage({
          type: 'error',
          text: data.error || 'Failed to send alerts'
        })
      }
    } catch (error) {
      console.error('Error sending alerts:', error)
      setAlertMessage({
        type: 'error',
        text: 'Failed to send alerts to students'
      })
    } finally {
      setAlertingSession(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getSessionStatus = (session: Session) => {
    const now = new Date()
    const startDate = new Date(session.startDate)
    const endDate = new Date(session.endDate)

    if (session.isCompleted) {
      return { status: 'completed', label: 'Completed', color: 'green' }
    } else if (now >= startDate && now <= endDate) {
      return { status: 'active', label: 'Active', color: 'blue' }
    } else if (now < startDate) {
      return { status: 'upcoming', label: 'Upcoming', color: 'yellow' }
    } else {
      return { status: 'overdue', label: 'Overdue', color: 'red' }
    }
  }

  const getSessionProximity = (session: Session) => {
    if (session.isCompleted) {
      return null
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0) // Start of today
    const startDate = new Date(session.startDate)
    startDate.setHours(0, 0, 0, 0)

    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilStart < 0) {
      // Session has started or passed
      return null
    } else if (daysUntilStart <= 7) {
      // Next 7 days - Imminent (Green)
      return {
        level: 'imminent',
        color: 'green',
        label: daysUntilStart === 0 ? 'Today!' : daysUntilStart === 1 ? 'Tomorrow' : `${daysUntilStart} days`,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        dotColor: 'bg-green-500'
      }
    } else if (daysUntilStart <= 14) {
      // 8-14 days - Soon (Amber)
      return {
        level: 'soon',
        color: 'amber',
        label: `${daysUntilStart} days`,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-300',
        dotColor: 'bg-amber-500'
      }
    } else if (daysUntilStart <= 21) {
      // 15-21 days - Approaching (Blue)
      return {
        level: 'approaching',
        color: 'blue',
        label: `${daysUntilStart} days`,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        dotColor: 'bg-blue-500'
      }
    } else {
      // 22+ days - Future (Gray)
      return {
        level: 'future',
        color: 'gray',
        label: `${daysUntilStart} days`,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        dotColor: 'bg-gray-500'
      }
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    const { status } = getSessionStatus(session)
    return status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading sessions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Sessions</h1>
          <p className="text-gray-600 mt-2">
            Manage training sessions and track completion status
          </p>
        </div>
        <Link
          href="/admin/sessions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Session
        </Link>
      </div>

      {/* Alert Message */}
      {alertMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          alertMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {alertMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {alertMessage.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.isCompleted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => {
                  const now = new Date()
                  const start = new Date(s.startDate)
                  const end = new Date(s.endDate)
                  return !s.isCompleted && now >= start && now <= end
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => !s.isCompleted && s._count.bookings < minAttendees).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Below {minAttendees} students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-4">
          {[
            { key: 'all', label: 'All Sessions' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => {
                const { status, label, color } = getSessionStatus(session)
                const proximity = getSessionProximity(session)

                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {session.course.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.course.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(session.startDate)} - {formatDate(session.endDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.startTime} - {session.endTime}
                      </div>
                      {proximity && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${proximity.dotColor}`}></span>
                          <span className={`text-xs font-medium ${proximity.textColor}`}>
                            {proximity.label}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {session._count.bookings} / {session.availableSpots}
                        </span>
                        {!session.isCompleted && session._count.bookings < minAttendees && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title={`Below minimum of ${minAttendees} attendees`}>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        color === 'green' ? 'bg-green-100 text-green-800' :
                        color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {color === 'green' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {color === 'blue' && <Clock className="w-3 h-3 mr-1" />}
                        {color === 'yellow' && <Calendar className="w-3 h-3 mr-1" />}
                        {color === 'red' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/admin/sessions/${session.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit session"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {!session.isCompleted && session._count.bookings < minAttendees && session._count.bookings > 0 && (
                        <button
                          onClick={() => handleAlertStudents(session.id, session.course.title)}
                          disabled={alertingSession === session.id}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Notify students of possible postponement"
                        >
                          {alertingSession === session.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Bell className="w-4 h-4 mr-1" />
                              Alert Students
                            </>
                          )}
                        </button>
                      )}

                      {!session.isCompleted && (
                        <Link
                          href={`/admin/sessions/${session.id}/complete`}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                          title="Complete session & issue certificates"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Complete
                        </Link>
                      )}

                      {session.isCompleted && (
                        <Link
                          href={`/admin/sessions/${session.id}/complete`}
                          className="text-green-600 hover:text-green-900"
                          title="View completion"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sessions found</p>
              <Link
                href="/admin/sessions/new"
                className="text-blue-600 hover:text-blue-500 mt-2 inline-block"
              >
                Schedule your first session
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}