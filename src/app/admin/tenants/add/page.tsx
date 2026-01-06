'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Palette, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Upload,
  Eye,
  Save,
  ArrowLeft,
  Search,
  Target,
  Type,
  Award
} from 'lucide-react'

interface TenantFormData {
  name: string
  slug: string
  domain: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  primaryColor: string
  secondaryColor: string
  logo: string
  whiteLabel: boolean
  customDomain: boolean
  emailFromName: string
  emailFromAddress: string
  
  // SEO & Content Fields
  businessType: string
  mainServices: string[]
  serviceAreas: string[]
  yearsExperience: number
  accreditations: string[]
  county: string
  nearbyAreas: string[]
  
  // Meta Data
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  
  // Content Customization
  heroHeading: string
  heroSubheading: string
  aboutText: string
  whyChooseUs: string[]
}

const planOptions = [
  { value: 'STARTER', label: 'Starter Plan', price: '£297/month', students: '50 students' },
  { value: 'PROFESSIONAL', label: 'Professional Plan', price: '£497/month', students: '200 students' },
  { value: 'ENTERPRISE', label: 'Enterprise Plan', price: '£797/month', students: 'Unlimited students' }
]

const colorPresets = [
  { primary: '#1e40af', secondary: '#dc2626', name: 'Blue & Red' },
  { primary: '#059669', secondary: '#d97706', name: 'Green & Orange' },
  { primary: '#7c3aed', secondary: '#e11d48', name: 'Purple & Pink' },
  { primary: '#0f766e', secondary: '#b91c1c', name: 'Teal & Red' },
  { primary: '#1f2937', secondary: '#f59e0b', name: 'Dark & Amber' },
]

const businessTypes = [
  'Gas Safety Training',
  'Plumbing Training',
  'Electrical Training',
  'Construction Training',
  'Health & Safety Training',
  'Technical Training'
]

const commonServices = [
  'Gas Safe Register Training',
  'ACS Gas Training',
  'Commercial Gas Training',
  'Domestic Gas Training',
  'LPG Training',
  'Cooker Installation',
  'Boiler Training',
  'Plumbing Courses',
  'Electrical Training',
  'Health & Safety',
  'City & Guilds Courses'
]

const ukCounties = [
  'Devon', 'Cornwall', 'Somerset', 'Dorset', 'Hampshire', 'Surrey', 'Kent', 
  'Essex', 'London', 'Hertfordshire', 'Buckinghamshire', 'Oxfordshire',
  'Gloucestershire', 'Wiltshire', 'Berkshire', 'Sussex', 'Yorkshire',
  'Lancashire', 'Cheshire', 'Staffordshire', 'Warwickshire', 'Leicestershire'
]

const commonAccreditations = [
  'Gas Safe Register Approved',
  'City & Guilds Approved',
  'NICEIC Approved', 
  'JTL Approved',
  'EAL Approved',
  'CITB Approved',
  'IOSH Approved',
  'NEBOSH Approved'
]

export default function AddTenantPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    planType: 'STARTER',
    primaryColor: '#1e40af',
    secondaryColor: '#dc2626',
    logo: '',
    whiteLabel: false,
    customDomain: false,
    emailFromName: '',
    emailFromAddress: '',
    
    // SEO & Content Fields
    businessType: '',
    mainServices: [],
    serviceAreas: [],
    yearsExperience: 5,
    accreditations: [],
    county: '',
    nearbyAreas: [],
    
    // Meta Data
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    businessHours: '',
    socialLinks: '',
    latitude: 0,
    longitude: 0,
    heroHeading: '',
    heroSubheading: '',
    aboutText: '',
    whyChooseUs: '',
    testimonialText: ''
  })

  const handleInputChange = (field: keyof TenantFormData, value: string | boolean | string[] | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }

    // Auto-generate email settings from company name
    if (field === 'name' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        emailFromName: value,
        emailFromAddress: prev.email || `info@${prev.domain}`
      }))
    }
  }

  const handleColorPreset = (preset: { primary: string; secondary: string }) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/admin/tenants/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          logo: result.logoUrl
        }))
      } else {
        alert(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = JSON.stringify(formData)
      
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      if (response.ok) {
        const responseData = await response.json()
        router.push('/admin/tenants')
      } else {
        const error = await response.text()
        console.error('API Error:', error)
        alert(`Error: ${error}`)
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      alert('Failed to create tenant')
    } finally {
      setIsLoading(false)
    }
  }

  if (previewMode) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
        {/* Preview Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Form
              </button>
              <div className="h-6 border-l border-gray-300" />
              <h1 className="text-lg font-semibold">Preview: {formData.name}</h1>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Simulated website header */}
            <div 
              className="rounded-lg p-8 text-white"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <div className="flex items-center gap-4 mb-6">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-12 h-12 rounded" />
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{formData.name}</h1>
                  <p className="text-white/90">{formData.email}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Professional Training</h3>
                  <p className="text-white/90 text-sm">Industry-leading gas safety certification courses</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Expert Instructors</h3>
                  <p className="text-white/90 text-sm">Learn from qualified professionals</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Flexible Booking</h3>
                  <p className="text-white/90 text-sm">Book courses that fit your schedule</p>
                </div>
              </div>
            </div>

            {/* Simulated CTA section */}
            <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Ready to Get Certified?</h2>
                  <p className="text-gray-600">Join thousands of professionals who trust our training</p>
                </div>
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-6 border-l border-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900">Add New Training Center</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Company Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. ACME Gas Training"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="acme-gas-training"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in URL: trainkit.co.uk/{formData.slug}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="acmetraining.co.uk"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type *
              </label>
              <select
                value={formData.planType}
                onChange={(e) => handleInputChange('planType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {planOptions.map(plan => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label} - {plan.price} ({plan.students})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Contact Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@acmetraining.co.uk"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="01392 123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Training Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Exeter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EX1 2AB"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding & Customization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Branding & Customization</h2>
          </div>
          
          {/* Color Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Presets
            </label>
            <div className="flex flex-wrap gap-3">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleColorPreset(preset)}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#1e40af"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#dc2626"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="space-y-4">
                {/* Logo Preview */}
                {formData.logo && (
                  <div className="flex items-center gap-4">
                    <img 
                      src={formData.logo} 
                      alt="Logo preview" 
                      className="w-16 h-16 rounded-lg border border-gray-200 object-contain bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('logo', '')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex items-center gap-4">
                  <label className={`
                    inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer
                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}
                  `}>
                    <Upload className="w-4 h-4" />
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="sr-only"
                    />
                  </label>
                  
                  {/* Manual URL Option */}
                  <span className="text-gray-500">or</span>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <p className="text-xs text-gray-500">
                  Upload an image file or paste a URL. Supported formats: JPG, PNG, WebP, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="whiteLabel"
                checked={formData.whiteLabel}
                onChange={(e) => handleInputChange('whiteLabel', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="whiteLabel" className="ml-2 text-sm text-gray-700">
                Enable white-label mode (hide platform branding)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="customDomain"
                checked={formData.customDomain}
                onChange={(e) => handleInputChange('customDomain', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="customDomain" className="ml-2 text-sm text-gray-700">
                Enable custom domain support
              </label>
            </div>
          </div>
        </div>

        {/* SEO & Business Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">SEO & Business Information</h2>
            <button
              type="button"
              onClick={() => {
                // Auto-generate SEO fields based on business type and location
                if (formData.businessType && (formData.city || formData.county)) {
                  const businessName = formData.name || 'Training Center'

                  // Build location string - use city and county for best local SEO
                  let location = ''
                  let locationShort = ''

                  if (formData.city && formData.county) {
                    location = `${formData.city}, ${formData.county}`
                    locationShort = formData.city
                  } else if (formData.city) {
                    location = formData.city
                    locationShort = formData.city
                  } else {
                    location = formData.county
                    locationShort = formData.county
                  }

                  const type = formData.businessType.toLowerCase().replace(' training centre', '').replace(' training academy', '').replace(' training institute', '').replace(' training center', '')
                  const serviceArea = formData.county || 'the UK'

                  // Generate SEO-optimized content
                  handleInputChange('metaTitle', `${businessName} | ${formData.businessType} in ${locationShort}`)
                  handleInputChange('metaDescription', `Leading ${type} training courses in ${location}. Gas Safe approved, expert instructors, flexible booking. Serving ${serviceArea}. Book your course today!`)
                  handleInputChange('heroHeading', `Professional ${formData.businessType} in ${locationShort}`)
                  handleInputChange('heroSubheading', `Expert training courses with flexible booking, industry certification and experienced instructors serving ${serviceArea}`)
                }
              }}
              className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors"
            >
              <Search className="w-3 h-3 inline mr-1" />
              Generate SEO
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Business Type */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select business type...</option>
                  <option value="Gas Safety Training Centre">Gas Safety Training Centre</option>
                  <option value="Plumbing Training Academy">Plumbing Training Academy</option>
                  <option value="Electrical Training Institute">Electrical Training Institute</option>
                  <option value="HVAC Training Center">HVAC Training Center</option>
                  <option value="Multi-Trade Training Centre">Multi-Trade Training Centre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County / Region
                </label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Devon, Cornwall, Wales, Scotland"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter any UK county, region, or country (England, Wales, Scotland, Northern Ireland)
                </p>
              </div>
            </div>

            {/* SEO Meta Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Professional Gas Training in Exeter - ACME Training"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaTitle?.length || 0}/60 characters (optimal for search engines)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Professional gas safety training courses in Exeter. Expert instructors, flexible booking, industry certification. Book your course today."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.metaDescription?.length || 0}/160 characters
                </p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Heading
                </label>
                <input
                  type="text"
                  value={formData.heroHeading}
                  onChange={(e) => handleInputChange('heroHeading', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Professional Gas Safety Training in Exeter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Subheading
                </label>
                <input
                  type="text"
                  value={formData.heroSubheading}
                  onChange={(e) => handleInputChange('heroSubheading', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expert training with flexible booking and certification"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Email Settings</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                value={formData.emailFromName}
                onChange={(e) => handleInputChange('emailFromName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ACME Gas Training"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Address
              </label>
              <input
                type="email"
                value={formData.emailFromAddress}
                onChange={(e) => handleInputChange('emailFromAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@acmetraining.co.uk"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}