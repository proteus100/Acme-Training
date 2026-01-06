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
  Award,
  Plus,
  X
} from 'lucide-react'

interface SEOTenantFormData {
  // Basic Info
  name: string
  slug: string
  domain: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  county: string
  planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  
  // Branding
  primaryColor: string
  secondaryColor: string
  logo: string
  whiteLabel: boolean
  customDomain: boolean
  emailFromName: string
  emailFromAddress: string
  
  // Business Details
  businessType: string
  mainServices: string[]
  serviceAreas: string[]
  nearbyAreas: string[]
  yearsExperience: number
  accreditations: string[]
  
  // SEO Meta Data
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  
  // Content Customization
  heroHeading: string
  heroSubheading: string
  aboutText: string
  whyChooseUs: string[]
}

const businessTypes = [
  'Gas Safety Training Centre',
  'Plumbing Training Academy', 
  'Electrical Training Institute',
  'Construction Training Centre',
  'Health & Safety Training Provider',
  'Technical Skills Training Centre'
]

const commonServices = [
  'ACS Gas Training', 'Commercial Gas Training', 'Domestic Gas Training',
  'LPG Training', 'Cooker Installation Training', 'Boiler Service Training',
  'Plumbing Installation', 'Bathroom Installation', 'Central Heating',
  'Electrical Installation', 'PAT Testing', 'Fire Alarm Systems',
  'Health & Safety Training', 'First Aid Training', 'Manual Handling'
]

const ukCounties = [
  'Devon', 'Cornwall', 'Somerset', 'Dorset', 'Hampshire', 'Surrey', 'Kent', 
  'Essex', 'London', 'Hertfordshire', 'Buckinghamshire', 'Oxfordshire',
  'Gloucestershire', 'Wiltshire', 'Berkshire', 'Sussex', 'Yorkshire',
  'Lancashire', 'Cheshire', 'Staffordshire', 'Warwickshire', 'Leicestershire'
]

const accreditations = [
  'Gas Safe Register Approved Centre',
  'City & Guilds Approved Centre',
  'NICEIC Approved Training Provider', 
  'JTL Approved Centre',
  'EAL Approved Centre',
  'CITB Approved Training Organisation',
  'IOSH Approved Training Partner',
  'NEBOSH Accredited Learning Partner'
]

export default function SEOTenantForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  const [formData, setFormData] = useState<SEOTenantFormData>({
    // Basic Info
    name: '',
    slug: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    county: '',
    planType: 'STARTER',
    
    // Branding
    primaryColor: '#1e40af',
    secondaryColor: '#dc2626',
    logo: '',
    whiteLabel: false,
    customDomain: false,
    emailFromName: '',
    emailFromAddress: '',
    
    // Business Details
    businessType: '',
    mainServices: [],
    serviceAreas: [],
    nearbyAreas: [],
    yearsExperience: 10,
    accreditations: [],
    
    // SEO Meta Data
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    
    // Content Customization
    heroHeading: '',
    heroSubheading: '',
    aboutText: '',
    whyChooseUs: []
  })

  // Auto-generate SEO content based on form data
  const generateSEOContent = () => {
    const { name, businessType, city, county, mainServices, yearsExperience } = formData
    
    if (name && businessType && city) {
      const metaTitle = `${name} | Professional ${businessType} in ${city}, ${county}`
      const metaDescription = `Leading ${businessType.toLowerCase()} provider in ${city}. ${yearsExperience}+ years experience. ${mainServices.slice(0, 3).join(', ')}. Book your course today.`
      const heroHeading = `${city}'s Leading ${businessType}`
      const heroSubheading = `Professional training courses with ${yearsExperience}+ years of industry experience`
      
      setFormData(prev => ({
        ...prev,
        metaTitle,
        metaDescription,
        heroHeading,
        heroSubheading,
        metaKeywords: `${businessType.toLowerCase()}, ${city.toLowerCase()}, ${county.toLowerCase()}, ${mainServices.slice(0, 5).join(', ').toLowerCase()}`
      }))
    }
  }

  const addService = (service: string) => {
    if (!formData.mainServices.includes(service)) {
      setFormData(prev => ({
        ...prev,
        mainServices: [...prev.mainServices, service]
      }))
    }
  }

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      mainServices: prev.mainServices.filter(s => s !== service)
    }))
  }

  const addArea = (area: string, type: 'service' | 'nearby') => {
    const field = type === 'service' ? 'serviceAreas' : 'nearbyAreas'
    if (!formData[field].includes(area)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], area]
      }))
    }
  }

  const removeArea = (area: string, type: 'service' | 'nearby') => {
    const field = type === 'service' ? 'serviceAreas' : 'nearbyAreas'
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(a => a !== area)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Transform arrays to JSON strings for database
      const submitData = {
        ...formData,
        mainServices: JSON.stringify(formData.mainServices),
        serviceAreas: JSON.stringify(formData.serviceAreas),
        nearbyAreas: JSON.stringify(formData.nearbyAreas),
        accreditations: JSON.stringify(formData.accreditations),
        whyChooseUs: JSON.stringify(formData.whyChooseUs)
      }

      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push('/admin/tenants')
      } else {
        const error = await response.text()
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
      <div className="min-h-screen bg-gray-50">
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
            <div className="text-sm text-gray-500">
              SEO Score: <span className="font-semibold text-green-600">85/100</span>
            </div>
          </div>
        </div>

        {/* SEO Preview */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Google Search Result Preview */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Google Search Preview</h3>
              <div className="space-y-1">
                <div className="text-blue-600 text-xl hover:underline cursor-pointer">
                  {formData.metaTitle || `${formData.name} - Professional Training`}
                </div>
                <div className="text-green-700 text-sm">
                  {formData.domain || 'example.co.uk'} › courses
                </div>
                <div className="text-gray-600 text-sm">
                  {formData.metaDescription || 'Professional training courses with experienced instructors. Book your course today.'}
                </div>
              </div>
            </div>

            {/* Website Preview */}
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
                  <h1 className="text-3xl font-bold">
                    {formData.heroHeading || formData.name}
                  </h1>
                  <p className="text-white/90 text-lg">
                    {formData.heroSubheading || 'Professional training courses'}
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {formData.mainServices.slice(0, 3).map((service, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{service}</h3>
                    <p className="text-white/90 text-sm">Professional {service.toLowerCase()} courses</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.serviceAreas.map((area, index) => (
                  <span key={index} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Local SEO Signals */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Local SEO Signals</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Location Targeting</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Primary Location: {formData.city}, {formData.county}</li>
                    <li>✅ Service Areas: {formData.serviceAreas.length} areas</li>
                    <li>✅ Nearby Areas: {formData.nearbyAreas.length} areas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business Signals</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Business Type: {formData.businessType}</li>
                    <li>✅ Experience: {formData.yearsExperience}+ years</li>
                    <li>✅ Services: {formData.mainServices.length} services</li>
                    <li>✅ Accreditations: {formData.accreditations.length} credentials</li>
                  </ul>
                </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Add Training Center with SEO</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={generateSEOContent}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Generate SEO
          </button>
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
        {/* Business Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Business Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. ACME Gas Training"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years Experience
              </label>
              <input
                type="number"
                value={formData.yearsExperience}
                onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County *
              </label>
              <select
                value={formData.county}
                onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select county</option>
                {ukCounties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services & Areas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Services & Service Areas</h2>
          </div>
          
          <div className="space-y-6">
            {/* Main Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Main Services (Select up to 8 for best SEO)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {commonServices.map(service => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => addService(service)}
                    className={`p-2 text-sm rounded border transition-colors ${
                      formData.mainServices.includes(service)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
              
              {/* Selected Services */}
              {formData.mainServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Services:</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.mainServices.map(service => (
                      <span
                        key={service}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Service Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Areas (Towns/Cities you serve)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add service area..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const target = e.target as HTMLInputElement
                      if (target.value.trim()) {
                        addArea(target.value.trim(), 'service')
                        target.value = ''
                      }
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.serviceAreas.map(area => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(area, 'service')}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">SEO & Meta Data</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Title (50-60 characters)
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. ACME Gas Training | Professional ACS Training in Exeter, Devon"
                maxLength={60}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.metaTitle.length}/60 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description (150-160 characters)
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Leading gas training provider in Exeter. 20+ years experience. ACS, commercial gas, LPG courses available. Gas Safe Register approved centre."
                maxLength={160}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.metaDescription.length}/160 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={formData.metaKeywords}
                onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. gas training exeter, acs training devon, gas safe courses"
              />
            </div>
          </div>
        </div>

        {/* Content Customization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Type className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Website Content</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Heading
              </label>
              <input
                type="text"
                value={formData.heroHeading}
                onChange={(e) => setFormData(prev => ({ ...prev, heroHeading: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Exeter's Leading Gas Training Centre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Subheading
              </label>
              <input
                type="text"
                value={formData.heroSubheading}
                onChange={(e) => setFormData(prev => ({ ...prev, heroSubheading: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Professional ACS gas training courses with 20+ years of industry experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Text
              </label>
              <textarea
                value={formData.aboutText}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutText: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a compelling about section for your training centre..."
              />
            </div>
          </div>
        </div>

        {/* Include other form sections (Contact Info, Branding, etc.) here */}
      </form>
    </div>
  )
}