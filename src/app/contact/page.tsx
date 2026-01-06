'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Building2, Users, CheckCircle } from 'lucide-react'

interface ContactForm {
  // Lead Qualification
  organizationType: string
  organizationName: string
  currentStudentCount: string
  
  // Contact Details
  contactName: string
  jobTitle: string
  email: string
  phone: string
  website: string
  
  // Business Requirements
  specificRequirements: string
  timeframe: string
  currentChallenges: string
  
  // Spam Protection
  honeypot: string
  timestamp: number
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    organizationType: '',
    organizationName: '',
    currentStudentCount: '',
    contactName: '',
    jobTitle: '',
    email: '',
    phone: '',
    website: '',
    specificRequirements: '',
    timeframe: '',
    currentChallenges: '',
    honeypot: '',
    timestamp: Date.now()
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Basic spam protection
    if (formData.honeypot !== '') {
      setError('Invalid submission')
      setIsSubmitting(false)
      return
    }

    // Time-based spam protection (must spend at least 5 seconds)
    if (Date.now() - formData.timestamp < 5000) {
      setError('Please take your time filling out the form')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/contact-training-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-900 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold">ACME Training Centre</Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="hover:text-blue-200">Home</Link>
                <Link href="/courses" className="hover:text-blue-200">Courses</Link>
                <Link href="/booking" className="hover:text-blue-200">Book Now</Link>
                <Link href="/contact" className="text-blue-200">Contact</Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-lg text-gray-600 mb-6">
              We've received your inquiry and will get back to you within 24 hours to discuss your training center's requirements.
            </p>
            <p className="text-gray-600 mb-8">
              Our team will review your specific needs and prepare a customized demonstration of our comprehensive training management platform.
            </p>
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">ACME Training Centre</Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-blue-200">Home</Link>
              <Link href="/courses" className="hover:text-blue-200">Courses</Link>
              <Link href="/booking" className="hover:text-blue-200">Book Now</Link>
              <Link href="/contact" className="text-blue-200">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Partner With Us</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform your training center with our comprehensive management platform? 
              Let's discuss how we can help you deliver complete training solutions from installation through to compliance.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Started Today</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Organization Details */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Type *
                        </label>
                        <select
                          name="organizationType"
                          value={formData.organizationType}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select type...</option>
                          <option value="training-center">Training Center</option>
                          <option value="college">College/University</option>
                          <option value="corporate">Corporate Training</option>
                          <option value="apprenticeship">Apprenticeship Provider</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Student Count *
                        </label>
                        <select
                          name="currentStudentCount"
                          value={formData.currentStudentCount}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select range...</option>
                          <option value="1-50">1-50 students</option>
                          <option value="51-100">51-100 students</option>
                          <option value="101-250">101-250 students</option>
                          <option value="251-500">251-500 students</option>
                          <option value="500+">500+ students</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your training center name"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Training Manager, Director"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="your.email@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="01234 567890"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website (Optional)
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://yourtrainingcenter.com"
                      />
                    </div>
                  </div>

                  {/* Business Requirements */}
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Requirements</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Implementation Timeframe *
                      </label>
                      <select
                        name="timeframe"
                        value={formData.timeframe}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select timeframe...</option>
                        <option value="immediate">Immediate (within 1 month)</option>
                        <option value="short-term">Short-term (1-3 months)</option>
                        <option value="medium-term">Medium-term (3-6 months)</option>
                        <option value="long-term">Long-term (6+ months)</option>
                        <option value="exploring">Just exploring options</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Requirements *
                      </label>
                      <textarea
                        name="specificRequirements"
                        value={formData.specificRequirements}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about your specific needs: course management, booking systems, student tracking, compliance reporting, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Challenges (Optional)
                      </label>
                      <textarea
                        name="currentChallenges"
                        value={formData.currentChallenges}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What challenges are you currently facing with your training management?"
                      />
                    </div>
                  </div>

                  {/* Honeypot (hidden spam protection) */}
                  <div style={{ display: 'none' }}>
                    <input
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={handleChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-md font-semibold transition-colors"
                  >
                    {isSubmitting ? 'Sending...' : 'Request Demo & Information'}
                  </button>

                  <p className="text-sm text-gray-600 text-center">
                    We'll respond within 24 hours with a customized demonstration of our platform.
                  </p>
                </form>
              </div>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Partner With Us?</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    Complete training management from installation through compliance
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    47+ comprehensive courses across all major qualifications
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    Advanced booking and student management system
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    Automated compliance tracking and reporting
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    One-stop software house for all your training needs
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Direct Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-gray-600">partnerships@acme-training.co.uk</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-gray-600">07429 591055</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-gray-600">Stoke Canon, Exeter</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900 text-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Ready to Get Started?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Join the growing number of training centers using our comprehensive management platform.
                </p>
                <div className="text-sm text-blue-200">
                  <p>✓ Free consultation</p>
                  <p>✓ Custom demonstration</p>
                  <p>✓ Implementation support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}