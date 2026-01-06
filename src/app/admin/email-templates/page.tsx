'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  category: string | null
  reminderType: string
  subject: string
  htmlContent: string
  textContent: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedReminderType, setSelectedReminderType] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    reminderType: 'ONE_MONTH',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  })

  const reminderTypes = [
    { value: 'SIX_MONTHS', label: '6 Months Before Expiry' },
    { value: 'THREE_MONTHS', label: '3 Months Before Expiry' },
    { value: 'ONE_MONTH', label: '1 Month Before Expiry' },
    { value: 'ONE_WEEK', label: '1 Week Before Expiry' },
    { value: 'EXPIRED', label: 'After Expiry' },
    { value: 'CUSTOM', label: 'Custom/Manual' }
  ]

  const categories = [
    'GAS_SAFE',
    'HEAT_PUMP', 
    'OFTEC',
    'LPG',
    'VAPORIZING',
    'WATER',
    'FGAS_AIR_CONDITIONING',
    'COMMERCIAL_CATERING',
    'COMMERCIAL_LAUNDRY',
    'COMMERCIAL_GAS',
    'COMMERCIAL_CORE',
    'ELECTRICAL',
    'REFRIGERATION'
  ]

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory, selectedReminderType])

  const loadTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedReminderType !== 'all') params.append('reminderType', selectedReminderType)
      
      const response = await fetch(`/api/admin/email-templates?${params}`)
      if (response.ok) {
        const text = await response.text()
        if (text) {
          try {
            const data = JSON.parse(text)
            setTemplates(data)
          } catch (parseError) {
            console.error('JSON parse error:', parseError)
            console.error('Response text:', text)
            setTemplates([])
          }
        } else {
          setTemplates([])
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category || '',
      reminderType: template.reminderType,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      isActive: template.isActive
    })
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      category: '',
      reminderType: 'ONE_MONTH',
      subject: '',
      htmlContent: '',
      textContent: '',
      isActive: true
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.reminderType || !formData.subject || !formData.htmlContent || !formData.textContent) {
        alert('Please fill in all required fields')
        return
      }

      const url = editingTemplate 
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : '/api/admin/email-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setEditingTemplate(null)
        await loadTemplates()
        alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!')
      } else {
        try {
          const errorText = await response.text()
          if (errorText) {
            const error = JSON.parse(errorText)
            alert(`Error: ${error.error || error.message || 'Unknown error occurred'}`)
          } else {
            alert(`Error: ${response.status} ${response.statusText}`)
          }
        } catch (parseError) {
          alert(`Error: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert(`Error saving template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTemplates()
        alert('Template deleted successfully!')
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template')
    }
  }

  const getDefaultTemplate = (reminderType: string) => {
    const baseSubject = 'Certification Renewal Reminder - {{courseTitle}}'
    const baseHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certification Renewal Reminder</title>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1>ACME Training Centre</h1>
      <p>Certification Renewal Notice</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
      <h2>Dear {{customerName}},</h2>
      
      <p>This is a reminder regarding your professional certification for {{courseTitle}}.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3>Certification Details</h3>
        <p><strong>Course:</strong> {{courseTitle}}</p>
        <p><strong>Category:</strong> {{courseCategory}}</p>
        <p><strong>Certification Date:</strong> {{certificationDate}}</p>
        <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <strong>Action Required:</strong> Please renew your certification before it expires.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="tel:01234567890" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Call Us: 01234 567890</a>
      </div>
      
      <p>Best regards,<br><strong>The ACME Training Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
      <p><small>ACME Training Centre | This is an automated reminder</small></p>
    </div>
  </div>
</body>
</html>
    `.trim()

    const baseText = `
ACME Training Centre - Certification Renewal Notice

Dear {{customerName}},

This is a reminder regarding your professional certification for {{courseTitle}}.

Certification Details:
- Course: {{courseTitle}}
- Category: {{courseCategory}}
- Certification Date: {{certificationDate}}
- Expiry Date: {{expiryDate}}

Action Required: Please renew your certification before it expires.

Contact us to book your renewal:
Phone: 01234 567890
Email: bookings@acmetraining.co.uk

Best regards,
The ACME Training Team

---
ACME Training Centre | This is an automated reminder
    `.trim()

    return { subject: baseSubject, html: baseHtml, text: baseText }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading email templates...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">
            Customize certification renewal notification templates
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedReminderType}
              onChange={(e) => setSelectedReminderType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Reminder Types</option>
              {reminderTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reminder Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{template.subject}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.category ? template.category.replace(/_/g, ' ') : 'All Categories'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reminderTypes.find(t => t.value === template.reminderType)?.label || template.reminderType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingTemplate(template)
                        setPreviewMode(true)
                        setShowModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No email templates found</p>
              <button
                onClick={handleCreate}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {previewMode ? 'Preview Template' : editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setPreviewMode(false)
                  setEditingTemplate(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {previewMode && editingTemplate ? (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded p-4">
                  <h4 className="font-semibold mb-2">Email Preview</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>Subject:</strong> {editingTemplate.subject}</p>
                  </div>
                  <div className="mt-4">
                    <div 
                      dangerouslySetInnerHTML={{ __html: editingTemplate.htmlContent }} 
                      style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #e5e7eb', padding: '16px' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Gas Safe 1 Month Reminder"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Type</label>
                    <select
                      value={formData.reminderType}
                      onChange={(e) => setFormData({ ...formData, reminderType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {reminderTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.isActive.toString()}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Certification Renewal Reminder - {{courseTitle}}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
                  <textarea
                    value={formData.htmlContent}
                    onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={12}
                    placeholder="HTML email template..."
                  />
                  {!formData.htmlContent && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const template = getDefaultTemplate(formData.reminderType)
                          console.log('Loading default template for:', formData.reminderType)
                          console.log('Template generated:', template)
                          setFormData({
                            ...formData,
                            htmlContent: template.html,
                            textContent: template.text,
                            subject: formData.subject || template.subject
                          })
                        } catch (error) {
                          console.error('Error loading default template:', error)
                          alert('Error loading default template: ' + error.message)
                        }
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Load default template
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
                  <textarea
                    value={formData.textContent}
                    onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="Plain text version..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Available Variables</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <div>{'{{customerName}}'} - Customer full name</div>
                    <div>{'{{courseTitle}}'} - Course title</div>
                    <div>{'{{courseCategory}}'} - Course category</div>
                    <div>{'{{certificationDate}}'} - Certification date</div>
                    <div>{'{{expiryDate}}'} - Expiry date</div>
                    <div>{'{{certificateNumber}}'} - Certificate number</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setEditingTemplate(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}