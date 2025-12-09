'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  User,
  Calendar,
  BookOpen
} from 'lucide-react'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
}

interface AttendanceRecord {
  customerId: string
  customer: Customer
  bookingId: string
  attendance: {
    status: string
    attendedDays: number
    totalDays: number
    passed: boolean
    grade?: string
    notes?: string
    certificateIssued: boolean
  }
}

interface SessionData {
  session: {
    id: string
    course: {
      id: string
      title: string
      category: string
      duration: number
    }
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    isCompleted: boolean
    completedAt?: string
    instructorNotes?: string
  }
  totalDays: number
  attendanceData: AttendanceRecord[]
}

export default function CompleteSession({ params }: { params: Promise<{ sessionId: string }> }) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instructorNotes, setInstructorNotes] = useState('')
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const initializeSession = async () => {
      const resolvedParams = await params
      setSessionId(resolvedParams.sessionId)
    }
    initializeSession()
  }, [params])

  useEffect(() => {
    if (sessionId) {
      loadSessionData()
    }
  }, [sessionId])

  const loadSessionData = async () => {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/attendance`)
      if (response.ok) {
        const data = await response.json()
        setSessionData(data)
        setInstructorNotes(data.session.instructorNotes || '')
        
        // Initialize attendance form data
        const formData = data.attendanceData.map((record: AttendanceRecord) => ({
          customerId: record.customerId,
          customer: record.customer,
          status: record.attendance.status,
          attendedDays: record.attendance.attendedDays,
          totalDays: record.attendance.totalDays,
          passed: record.attendance.passed,
          grade: record.attendance.grade || '',
          notes: record.attendance.notes || ''
        }))
        setAttendanceData(formData)
      }
    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = (customerId: string, field: string, value: any) => {
    setAttendanceData(prev => prev.map(record => {
      if (record.customerId === customerId) {
        const updatedRecord = { ...record, [field]: value }
        
        // Auto-update logic based on field changes
        if (field === 'status') {
          // Auto-set days attended based on status
          if (value === 'ATTENDED') {
            updatedRecord.attendedDays = sessionData?.totalDays || 1
          } else if (value === 'ABSENT') {
            updatedRecord.attendedDays = 0
            updatedRecord.passed = false
          } else if (value === 'PARTIAL') {
            // Keep current attendedDays if valid, otherwise suggest half
            if (updatedRecord.attendedDays === sessionData?.totalDays) {
              updatedRecord.attendedDays = Math.floor((sessionData?.totalDays || 1) / 2)
            }
          }
        }
        
        // Auto-suggest pass/fail based on attendance
        if (field === 'attendedDays') {
          const totalDays = sessionData?.totalDays || 1
          const attendanceRate = value / totalDays
          
          // Suggest pass if attendance is 80% or higher
          if (attendanceRate >= 0.8 && updatedRecord.passed === undefined) {
            updatedRecord.passed = true
          } else if (attendanceRate < 0.5) {
            updatedRecord.passed = false
          }
        }
        
        return updatedRecord
      }
      return record
    }))
  }

  const handleCompleteSession = async () => {
    if (!sessionId) return
    
    // Validate attendance data before submission
    const validationErrors = validateAttendance()
    if (validationErrors.length > 0) {
      alert('Please fix the following issues before completing the session:\n\n' + validationErrors.join('\n'))
      return
    }
    
    // Confirm action with summary
    const passingStudents = attendanceData.filter(record => record.passed).length
    const failingStudents = attendanceData.filter(record => record.passed === false).length
    
    const confirmMessage = `Complete session and issue certificates?\n\n` +
      `• ${passingStudents} students passing (will receive certificates)\n` +
      `• ${failingStudents} students failing (no certificates)\n` +
      `• Total students: ${attendanceData.length}\n\n` +
      `This action cannot be undone.`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceData,
          instructorNotes
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Session completed successfully!\n\n` +
          `📊 Summary:\n` +
          `• ${result.data.attendanceRecords.length} attendance records created\n` +
          `• ${result.data.certificatesIssued} certificates issued\n` +
          `• Certificates will appear in student portfolios immediately`)
        
        // Reload data to show completion status
        await loadSessionData()
      } else {
        const error = await response.json()
        alert('Failed to complete session: ' + error.error)
      }
    } catch (error) {
      console.error('Error completing session:', error)
      alert('Error completing session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const validateAttendance = () => {
    const errors: string[] = []
    
    attendanceData.forEach((record, index) => {
      const studentName = `${record.customer.firstName} ${record.customer.lastName}`
      
      // Check if pass/fail is set
      if (record.passed === undefined) {
        errors.push(`${studentName}: Please set Pass/Fail result`)
      }
      
      // Check if attendance days makes sense with status
      if (record.status === 'ATTENDED' && record.attendedDays < (sessionData?.totalDays || 1)) {
        errors.push(`${studentName}: Marked as 'Attended' but not all days completed`)
      }
      
      if (record.status === 'ABSENT' && record.attendedDays > 0) {
        errors.push(`${studentName}: Marked as 'Absent' but has attended days`)
      }
      
      // Check if passed student has minimal attendance
      if (record.passed && record.attendedDays < Math.ceil((sessionData?.totalDays || 1) * 0.5)) {
        errors.push(`${studentName}: Marked as 'Pass' but attended less than 50% of sessions`)
      }
    })
    
    return errors
  }

  const saveAttendance = async () => {
    if (!sessionId) return
    
    const validationErrors = validateAttendance()
    if (validationErrors.length > 0) {
      alert('Please fix the following issues:\n\n' + validationErrors.join('\n'))
      return
    }
    
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendance: attendanceData
        })
      })

      if (response.ok) {
        alert('Attendance saved successfully!')
      } else {
        alert('Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance')
    }
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

  if (!sessionData) {
    return <div className="text-center py-12">Session not found</div>
  }

  const { session } = sessionData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/admin" className="mr-4 p-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {session.isCompleted ? 'Session Completed' : 'Complete Session'}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <BookOpen className="w-4 h-4 mr-2" />
                {session.course.title}
              </p>
            </div>
            {session.isCompleted && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900">Duration</div>
                <div className="text-sm text-gray-600">
                  {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900">Time</div>
                <div className="text-sm text-gray-600">
                  {session.startTime} - {session.endTime}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm font-medium text-gray-900">Category</div>
                <div className="text-sm text-gray-600">{session.course.category}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Progress Summary */}
        {attendanceData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{attendanceData.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceData.filter(record => record.passed === true).length}
                </div>
                <div className="text-sm text-gray-600">Passing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceData.filter(record => record.passed === false).length}
                </div>
                <div className="text-sm text-gray-600">Failing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {attendanceData.filter(record => record.passed === undefined).length}
                </div>
                <div className="text-sm text-gray-600">Pending Assessment</div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Attendance & Assessment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mark attendance and pass/fail status. Certificates will be automatically generated for passing students.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border-l-2 border-green-400 rounded-sm mr-2"></div>
                <span>Passing Student</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-100 border-l-2 border-yellow-400 rounded-sm mr-2"></div>
                <span>Failing Student</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 border-l-2 border-red-400 rounded-sm mr-2"></div>
                <span>Needs Attention</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Attended
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record) => {
                  // Calculate row styling based on assessment status
                  const isComplete = record.passed !== undefined && record.status !== 'REGISTERED'
                  const hasIssues = (record.status === 'ATTENDED' && record.attendedDays < (sessionData?.totalDays || 1)) ||
                                   (record.status === 'ABSENT' && record.attendedDays > 0) ||
                                   (record.passed && record.attendedDays < Math.ceil((sessionData?.totalDays || 1) * 0.5))
                  
                  let rowClass = "hover:bg-gray-50"
                  if (hasIssues) {
                    rowClass += " bg-red-50 border-l-4 border-red-400"
                  } else if (isComplete && record.passed) {
                    rowClass += " bg-green-50 border-l-4 border-green-400"
                  } else if (isComplete && !record.passed) {
                    rowClass += " bg-yellow-50 border-l-4 border-yellow-400"
                  }
                  
                  return (
                  <tr key={record.customerId} className={rowClass}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.customer.firstName} {record.customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{record.customer.email}</div>
                          {record.customer.company && (
                            <div className="text-sm text-gray-500">{record.customer.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={record.status}
                        onChange={(e) => updateAttendance(record.customerId, 'status', e.target.value)}
                        disabled={session.isCompleted}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="REGISTERED">Registered</option>
                        <option value="ATTENDED">Attended</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max={sessionData.totalDays}
                        value={record.attendedDays}
                        onChange={(e) => updateAttendance(record.customerId, 'attendedDays', parseInt(e.target.value) || 0)}
                        disabled={session.isCompleted}
                        className="w-20 text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-500">/ {sessionData.totalDays}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`result_${record.customerId}`}
                            value="passed"
                            checked={record.passed === true}
                            onChange={() => updateAttendance(record.customerId, 'passed', true)}
                            disabled={session.isCompleted}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-green-700">Pass</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`result_${record.customerId}`}
                            value="failed"
                            checked={record.passed === false}
                            onChange={() => updateAttendance(record.customerId, 'passed', false)}
                            disabled={session.isCompleted}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-red-700">Fail</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={record.grade}
                        onChange={(e) => updateAttendance(record.customerId, 'grade', e.target.value)}
                        disabled={session.isCompleted}
                        placeholder="A, B, C..."
                        className="w-20 text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={record.notes}
                        onChange={(e) => updateAttendance(record.customerId, 'notes', e.target.value)}
                        disabled={session.isCompleted}
                        placeholder="Additional notes..."
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructor Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructor Notes</h2>
          <textarea
            value={instructorNotes}
            onChange={(e) => setInstructorNotes(e.target.value)}
            disabled={session.isCompleted}
            placeholder="Add any additional notes about this session..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Action Buttons */}
        {!session.isCompleted ? (
          <div className="flex justify-end space-x-4">
            <button
              onClick={saveAttendance}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Save Draft
            </button>
            <button
              onClick={handleCompleteSession}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Completing...' : 'Complete Session & Issue Certificates'}
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-green-800 font-medium">Session Completed</p>
                <p className="text-green-700 text-sm mt-1">
                  This session was completed on {new Date(session.completedAt!).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}