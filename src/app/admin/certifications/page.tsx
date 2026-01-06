'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Mail,
  Eye,
  Edit,
  Download,
  Upload,
  FileText,
  Send,
  X
} from 'lucide-react'

interface Certification {
  id: string
  customer: {
    firstName: string
    lastName: string
    email: string
  }
  course: {
    title: string
    category: string
  }
  certificationDate: string
  expiryDate: string | null
  isExpired: boolean
  remindersSent: number
  nextReminderDate: string | null
  certificateNumber: string | null
}

interface CertificateInfo {
  filePath?: string
  fileName?: string
  fileSize?: number
  uploadedAt?: string
  certificateNumber?: string
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [certificateNumber, setCertificateNumber] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadCertifications()
  }, [filterStatus, selectedCategory])

  const loadCertifications = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      
      const response = await fetch(`/api/admin/certifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCertifications(data)
      }
    } catch (error) {
      console.error('Error loading certifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReminder = async (certificationId: string) => {
    try {
      const response = await fetch(`/api/admin/certifications/${certificationId}/remind`, {
        method: 'POST'
      })
      if (response.ok) {
        await loadCertifications() // Refresh data
        alert('Reminder sent successfully!')
      } else {
        alert('Failed to send reminder')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Error sending reminder')
    }
  }

  const openUploadModal = (certification: Certification) => {
    setSelectedCertification(certification)
    setShowUploadModal(true)
    setUploadFile(null)
    setCertificateNumber('')
  }

  const openEmailModal = (certification: Certification) => {
    setSelectedCertification(certification)
    setEmailSubject(`Your ${certification.course.title} Certificate`)
    setEmailMessage(`Dear ${certification.customer.firstName},\n\nPlease find attached your certificate for the ${certification.course.title} course.\n\nCongratulations on completing the training!\n\nBest regards,\nACME Training Centre`)
    setShowEmailModal(true)
  }

  const handleUploadCertificate = async () => {
    if (!uploadFile || !selectedCertification) return

    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('certificate', uploadFile)
      formData.append('certificateNumber', certificateNumber)

      const response = await fetch(`/api/admin/certifications/${selectedCertification.id}/attach-certificate`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await loadCertifications()
        setShowUploadModal(false)
        alert('Certificate uploaded successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload certificate')
      }
    } catch (error) {
      console.error('Error uploading certificate:', error)
      alert('Error uploading certificate')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEmailCertificate = async () => {
    if (!selectedCertification) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/certifications/${selectedCertification.id}/email-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage
        })
      })

      if (response.ok) {
        setShowEmailModal(false)
        alert('Certificate emailed successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to email certificate')
      }
    } catch (error) {
      console.error('Error emailing certificate:', error)
      alert('Error emailing certificate')
    } finally {
      setActionLoading(false)
    }
  }

  const getCertificateInfo = (cert: Certification): CertificateInfo | null => {
    if (!cert.certificateNumber) return null

    try {
      if (cert.certificateNumber.startsWith('{')) {
        return JSON.parse(cert.certificateNumber)
      }
    } catch (e) {
      // If it's not JSON, it's probably just a certificate number
    }

    return { certificateNumber: cert.certificateNumber }
  }

  const getStatusBadge = (cert: Certification) => {
    if (cert.isExpired) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>
    }
    
    if (cert.expiryDate) {
      const expiryDate = new Date(cert.expiryDate)
      const now = new Date()
      const monthsUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
      
      if (monthsUntilExpiry <= 1) {
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expiring Soon</span>
      } else if (monthsUntilExpiry <= 3) {
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Expiring</span>
      } else if (monthsUntilExpiry <= 6) {
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Watch</span>
      }
    }
    
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null
    
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = `${cert.customer.firstName} ${cert.customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading certifications...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certification Management</h1>
        <p className="text-gray-600 mt-2">
          Track student certifications and manage renewal reminders
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Certifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {certifications.filter(c => !c.isExpired).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {certifications.filter(c => {
                  if (!c.expiryDate || c.isExpired) return false
                  const days = getDaysUntilExpiry(c.expiryDate)
                  return days !== null && days <= 90
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">
                {certifications.filter(c => c.isExpired).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reminders Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {certifications.reduce((sum, c) => sum + c.remindersSent, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="GAS_SAFE">Gas Safe</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="OFTEC">OFTEC</option>
              <option value="HEAT_PUMP">Heat Pump</option>
              <option value="REFRIGERATION">Refrigeration</option>
              <option value="LPG">LPG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certifications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reminders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCertifications.map((cert) => {
                const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate)
                return (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cert.customer.firstName} {cert.customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{cert.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cert.course.title}</div>
                      <div className="text-sm text-gray-500">{cert.course.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(cert.certificationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.expiryDate ? (
                        <div>
                          <div className="text-sm text-gray-900">{formatDate(cert.expiryDate)}</div>
                          {daysUntilExpiry !== null && (
                            <div className={`text-sm ${
                              daysUntilExpiry < 0 ? 'text-red-600' :
                              daysUntilExpiry <= 30 ? 'text-orange-600' :
                              daysUntilExpiry <= 90 ? 'text-yellow-600' :
                              'text-gray-500'
                            }`}>
                              {daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)} days overdue` :
                               daysUntilExpiry === 0 ? 'Expires today' :
                               `${daysUntilExpiry} days left`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No expiry set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cert)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cert.remindersSent} sent</div>
                      {cert.nextReminderDate && (
                        <div className="text-sm text-gray-500">
                          Next: {formatDate(cert.nextReminderDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => sendReminder(cert.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Send reminder"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openUploadModal(cert)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Upload certificate"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEmailModal(cert)}
                          className="text-green-600 hover:text-green-900"
                          title="Email certificate"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {getCertificateInfo(cert)?.filePath && (
                          <a
                            href={getCertificateInfo(cert)!.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900"
                            title="View certificate"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredCertifications.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No certifications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Certificate Modal */}
      {showUploadModal && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Certificate</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Student: {selectedCertification.customer.firstName} {selectedCertification.customer.lastName}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Course: {selectedCertification.course.title}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number (Optional)
                </label>
                <input
                  type="text"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CERT-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate File
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, JPG, PNG. Max size: 10MB
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCertificate}
                disabled={!uploadFile || actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Certificate Modal */}
      {showEmailModal && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Email Certificate</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                To: {selectedCertification.customer.firstName} {selectedCertification.customer.lastName} ({selectedCertification.customer.email})
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Course: {selectedCertification.course.title}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {getCertificateInfo(selectedCertification)?.filePath && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      Certificate file will be attached to the email
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailCertificate}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}