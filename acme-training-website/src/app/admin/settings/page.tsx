'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Settings,
  Mail,
  Server,
  CreditCard,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Users
} from 'lucide-react'

interface PlatformSettings {
  id: string
  companyName: string
  supportEmail: string
  stripePublishableKey: string | null
  stripeSecretKey: string | null
  stripeWebhookSecret: string | null
  trialDays: number
  defaultPlan: string
  maintenanceMode: boolean
}

interface TenantSettings {
  id: string
  minSessionAttendees: number
  bookingWindowDays: number
  cancellationHours: number
  depositPercentage: number
}

interface TenantProfile {
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  county: string | null
  postcode: string | null
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null)
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isTenantAdmin, setIsTenantAdmin] = useState(false)

  useEffect(() => {
    loadSettings()
    loadTenantSettings()
    loadTenantProfile()
    checkAdminType()
  }, [])

  const checkAdminType = async () => {
    try {
      const response = await fetch('/api/admin/me')
      if (response.ok) {
        const { admin } = await response.json()
        setIsTenantAdmin(admin.tenantId !== null)
      }
    } catch (error) {
      console.error('Error checking admin type:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const loadTenantSettings = async () => {
    try {
      const response = await fetch('/api/tenant/settings')
      if (response.ok) {
        const data = await response.json()
        setTenantSettings(data)
      }
    } catch (error) {
      console.error('Error loading tenant settings:', error)
    }
  }

  const loadTenantProfile = async () => {
    try {
      const response = await fetch('/api/admin/me')
      if (response.ok) {
        const data = await response.json()
        if (data.admin?.tenant) {
          setTenantProfile({
            name: data.admin.tenant.name,
            email: data.admin.tenant.email,
            phone: data.admin.tenant.phone,
            address: data.admin.tenant.address,
            city: data.admin.tenant.city,
            county: data.admin.tenant.county,
            postcode: data.admin.tenant.postcode
          })
        }
      }
    } catch (error) {
      console.error('Error loading tenant profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    setMessage(null)

    try {
      if (activeTab === 'profile' && tenantProfile) {
        // Save tenant profile
        const response = await fetch('/api/admin/tenant/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tenantProfile)
        })

        if (response.ok) {
          const updated = await response.json()
          setTenantProfile(updated)
          setMessage({ type: 'success', text: 'Profile updated successfully!' })
          setTimeout(() => setMessage(null), 3000)
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
        }
      } else if (activeTab === 'sessions' && tenantSettings) {
        // Save tenant settings
        const response = await fetch('/api/tenant/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tenantSettings)
        })

        if (response.ok) {
          const updatedSettings = await response.json()
          setTenantSettings(updatedSettings)
          setMessage({ type: 'success', text: 'Settings saved successfully!' })
          setTimeout(() => setMessage(null), 3000)
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.error || 'Failed to save settings' })
        }
      } else if (settings) {
        // Save platform settings
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings)
        })

        if (response.ok) {
          const updatedSettings = await response.json()
          setSettings(updatedSettings)
          setMessage({ type: 'success', text: 'Settings saved successfully!' })
          setTimeout(() => setMessage(null), 3000)
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.error || 'Failed to save settings' })
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const updateTenantSetting = (key: keyof TenantSettings, value: any) => {
    if (!tenantSettings) return
    setTenantSettings({ ...tenantSettings, [key]: value })
  }

  const updateTenantProfile = (key: keyof TenantProfile, value: any) => {
    if (!tenantProfile) return
    setTenantProfile({ ...tenantProfile, [key]: value })
  }

  const tabs = isTenantAdmin
    ? [
        { id: 'profile', label: 'Company Profile', icon: Building2 },
        { id: 'sessions', label: 'Session Settings', icon: Users },
      ]
    : [
        { id: 'platform', label: 'Platform Info', icon: Building2 },
        { id: 'billing', label: 'Billing & Stripe', icon: CreditCard },
        { id: 'system', label: 'System Settings', icon: Shield },
      ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load settings. Please try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your training center settings and preferences
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Company Profile Tab (Tenant Admins Only) */}
            {activeTab === 'profile' && tenantProfile && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Company Profile:</strong> Update your organization's contact information. This information is displayed to customers on your booking pages and in email communications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.name}
                      onChange={(e) => updateTenantProfile('name', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Training Company Ltd"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={tenantProfile.email}
                      onChange={(e) => updateTenantProfile('email', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="info@yourcompany.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Primary contact email for customer inquiries
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={tenantProfile.phone || ''}
                      onChange={(e) => updateTenantProfile('phone', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="01234 567890"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.address || ''}
                      onChange={(e) => updateTenantProfile('address', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 High Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.city || ''}
                      onChange={(e) => updateTenantProfile('city', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Exeter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      County
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.county || ''}
                      onChange={(e) => updateTenantProfile('county', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Devon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={tenantProfile.postcode || ''}
                      onChange={(e) => updateTenantProfile('postcode', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="EX1 1AA"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Platform Info Tab */}
            {activeTab === 'platform' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Name *
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Training Platform SaaS"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This is the name of your SaaS platform
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email *
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail || ''}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="support@yourplatform.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Where tenants can contact you for support
                  </p>
                </div>
              </div>
            )}

            {/* Billing & Stripe Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Stripe Configuration
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure Stripe to handle tenant subscriptions and billing.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={settings.stripePublishableKey || ''}
                      onChange={(e) => updateSetting('stripePublishableKey', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="pk_live_..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      value={settings.stripeSecretKey || ''}
                      onChange={(e) => updateSetting('stripeSecretKey', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="sk_live_..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Webhook Secret
                    </label>
                    <input
                      type="password"
                      value={settings.stripeWebhookSecret || ''}
                      onChange={(e) => updateSetting('stripeWebhookSecret', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="whsec_..."
                    />
                  </div>
                </div>
              </div>
            )}


            {/* System Settings Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Period (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={settings.trialDays}
                      onChange={(e) => updateSetting('trialDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">How many days new tenants get free trial</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Plan for New Tenants
                    </label>
                    <select
                      value={settings.defaultPlan}
                      onChange={(e) => updateSetting('defaultPlan', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="STARTER">Starter (£297/month)</option>
                      <option value="PROFESSIONAL">Professional (£497/month)</option>
                      <option value="ENTERPRISE">Enterprise (£797/month)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Plan assigned to new tenants after trial</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Temporarily disable new tenant signups and show maintenance message
                  </p>
                  {settings.maintenanceMode && (
                    <div className="ml-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ⚠️ Platform is in maintenance mode - new signups are disabled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Settings Tab (Tenant Admins Only) */}
            {activeTab === 'sessions' && tenantSettings && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Session Settings:</strong> Configure default values for your training sessions. These settings help you manage session viability and provide alerts when bookings don't meet your requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Session Attendees *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={tenantSettings.minSessionAttendees}
                      onChange={(e) => updateTenantSetting('minSessionAttendees', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Sessions with bookings below this number will show a low attendance alert
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking Window (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={tenantSettings.bookingWindowDays}
                      onChange={(e) => updateTenantSetting('bookingWindowDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      How far in advance students can book sessions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Notice (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={tenantSettings.cancellationHours}
                      onChange={(e) => updateTenantSetting('cancellationHours', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum hours before session start for cancellations
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deposit Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={tenantSettings.depositPercentage * 100}
                      onChange={(e) => updateTenantSetting('depositPercentage', parseInt(e.target.value) / 100)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Percentage of course price required as deposit (0-100%)
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Low Attendance Alerts</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Sessions with fewer than {tenantSettings.minSessionAttendees} attendees will be highlighted with a warning badge in the sessions list, helping you identify sessions that may need additional promotion or rescheduling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Save Button */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}