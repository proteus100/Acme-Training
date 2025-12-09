'use client'

import { useTenant } from '@/contexts/TenantContext'
import { MapPin, Award, Users, Clock, CheckCircle } from 'lucide-react'

// Dynamic Hero Section with Location-Specific Content
export function TenantHero() {
  const { tenant } = useTenant()
  
  if (!tenant) return null
  
  const mainServices = tenant.mainServices ? JSON.parse(tenant.mainServices) : []
  const serviceAreas = tenant.serviceAreas ? JSON.parse(tenant.serviceAreas) : []
  
  return (
    <section className="bg-gradient-to-br-tenant text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              {tenant.heroHeading || `${tenant.city}'s Leading ${tenant.businessType}`}
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-8">
              {tenant.heroSubheading || 
                `Professional training courses with ${tenant.yearsExperience}+ years of industry experience in ${tenant.county}`
              }
            </p>
            
            {/* Service Areas */}
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5" />
              <span className="text-white/90">
                Serving {serviceAreas.slice(0, 3).join(', ')} 
                {serviceAreas.length > 3 && ` and ${serviceAreas.length - 3} more areas`}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="btn-tenant-secondary px-6 py-3 rounded-lg font-semibold">
                Book Your Course
              </button>
              <button className="btn-tenant-outline px-6 py-3 rounded-lg font-semibold">
                View Courses
              </button>
            </div>
          </div>
          
          <div className="lg:text-right">
            {tenant.logo && (
              <img 
                src={tenant.logo} 
                alt={`${tenant.name} Logo`}
                className="w-32 h-32 lg:w-48 lg:h-48 object-contain mx-auto lg:ml-auto mb-6"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{tenant.yearsExperience}+</div>
                <div className="text-sm text-white/80">Years Experience</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{serviceAreas.length}</div>
                <div className="text-sm text-white/80">Service Areas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Services Section with Location Context
export function TenantServices() {
  const { tenant } = useTenant()
  
  if (!tenant) return null
  
  const mainServices = tenant.mainServices ? JSON.parse(tenant.mainServices) : []
  const accreditations = tenant.accreditations ? JSON.parse(tenant.accreditations) : []
  
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Professional Training in {tenant.city}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {tenant.aboutText || 
              `We're ${tenant.city}'s leading ${tenant.businessType?.toLowerCase()} provider, offering comprehensive courses 
              to help you advance your career in the industry.`
            }
          </p>
        </div>
        
        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {mainServices.slice(0, 6).map((service: string, index: number) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-tenant-primary-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-tenant-primary" />
                </div>
                <h3 className="font-semibold text-gray-900">{service}</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Professional {service.toLowerCase()} training available in {tenant.city} and surrounding areas.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Available in {tenant.city}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Accreditations */}
        {accreditations.length > 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-center gap-2">
              <Award className="w-5 h-5 text-tenant-primary" />
              Approved Training Centre
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {accreditations.map((acc: string, index: number) => (
                <span key={index} className="badge-tenant-primary px-4 py-2 rounded-full text-sm font-medium">
                  {acc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// Location-Specific About Section
export function TenantAbout() {
  const { tenant } = useTenant()
  
  if (!tenant) return null
  
  const whyChooseUs = tenant.whyChooseUs ? JSON.parse(tenant.whyChooseUs) : [
    'Experienced instructors',
    'Modern training facilities',
    'Flexible course scheduling',
    'Excellent pass rates'
  ]
  
  const nearbyAreas = tenant.nearbyAreas ? JSON.parse(tenant.nearbyAreas) : []
  
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Why Choose {tenant.name}?
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              As {tenant.city}'s premier {tenant.businessType?.toLowerCase()}, we've been helping professionals 
              advance their careers for over {tenant.yearsExperience} years. Our commitment to excellence 
              has made us the trusted choice across {tenant.county}.
            </p>
            
            <div className="space-y-4">
              {whyChooseUs.map((reason: string, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-tenant-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Location Info */}
            <div className="bg-tenant-primary-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-tenant-primary" />
                <h3 className="font-semibold text-gray-900">Training Location</h3>
              </div>
              <p className="text-gray-700">
                {tenant.address}<br />
                {tenant.city}, {tenant.postcode}
              </p>
              {nearbyAreas.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Also serving:</span> {nearbyAreas.slice(0, 4).join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Get In Touch</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium">📞</span>
                  </div>
                  <span className="text-gray-700">{tenant.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium">✉️</span>
                  </div>
                  <span className="text-gray-700">{tenant.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Service Areas Section for Local SEO
export function TenantServiceAreas() {
  const { tenant } = useTenant()
  
  if (!tenant) return null
  
  const serviceAreas = tenant.serviceAreas ? JSON.parse(tenant.serviceAreas) : []
  const nearbyAreas = tenant.nearbyAreas ? JSON.parse(tenant.nearbyAreas) : []
  const allAreas = [...serviceAreas, ...nearbyAreas]
  
  if (allAreas.length === 0) return null
  
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Training Courses Across {tenant.county}
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            We provide professional {tenant.businessType?.toLowerCase()} throughout {tenant.county} and surrounding areas. 
            Our mobile training options mean we can bring our expertise directly to your location.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allAreas.map((area: string, index: number) => (
            <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
              <MapPin className="w-5 h-5 text-tenant-primary mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">{area}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {tenant.businessType} Available
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Don't see your area listed? We often provide training to additional locations across {tenant.county}.
          </p>
          <button className="btn-tenant-primary px-6 py-3 rounded-lg font-semibold">
            Contact Us About Your Area
          </button>
        </div>
      </div>
    </section>
  )
}

// Breadcrumbs for Local SEO
export function TenantBreadcrumbs({ 
  items 
}: { 
  items: Array<{ name: string; href?: string }> 
}) {
  const { tenant } = useTenant()
  
  if (!tenant) return null
  
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: tenant.city, href: `/${tenant.city?.toLowerCase()}` },
    ...items
  ]
  
  return (
    <nav className="bg-gray-50 px-6 py-3">
      <div className="max-w-6xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <span className="text-gray-400 mx-2">/</span>}
              {item.href ? (
                <a href={item.href} className="text-tenant-primary hover:text-tenant-primary-700">
                  {item.name}
                </a>
              ) : (
                <span className="text-gray-600">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}