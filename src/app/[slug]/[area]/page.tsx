import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { checkTenantStatus } from '@/lib/tenant'
import TierProgressionShowcase from '@/components/TierProgressionShowcase'
import BundleOffers from '@/components/BundleOffers'
import { LiveAchievementFeed } from '@/components/LiveAchievementFeed'
import { BookingCalendarPreview } from '@/components/BookingCalendarPreview'
import { StarRating } from '@/components/StarRating'
import AccountSuspended from '@/components/AccountSuspended'

// Valid areas for training centers
const VALID_AREAS = [
  'devon', 'cornwall', 'somerset', 'dorset', 'bristol', 'london',
  'surrey', 'kent', 'essex', 'hampshire', 'birmingham', 'manchester',
  'leeds', 'plymouth', 'exeter', 'torquay', 'truro', 'taunton',
  'bath', 'brighton', 'barnstaple'
]

// Area display names
const AREA_NAMES = {
  'devon': 'Devon',
  'cornwall': 'Cornwall', 
  'somerset': 'Somerset',
  'dorset': 'Dorset',
  'bristol': 'Bristol',
  'london': 'London',
  'surrey': 'Surrey',
  'kent': 'Kent',
  'essex': 'Essex',
  'hampshire': 'Hampshire',
  'birmingham': 'Birmingham',
  'manchester': 'Manchester',
  'leeds': 'Leeds',
  'plymouth': 'Plymouth',
  'exeter': 'Exeter',
  'torquay': 'Torquay',
  'truro': 'Truro',
  'taunton': 'Taunton',
  'bath': 'Bath',
  'brighton': 'Brighton',
  'barnstaple': 'Barnstaple'
} as const

interface PageProps {
  params: { slug: string; area: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.slug, active: true }
  })

  if (!tenant || !VALID_AREAS.includes(params.area)) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }

  const areaName = AREA_NAMES[params.area as keyof typeof AREA_NAMES]
  const businessType = tenant.businessType || 'Training Centre'
  
  return {
    title: tenant.metaTitle 
      ? `${tenant.metaTitle} - ${areaName} ${businessType}`
      : `${tenant.name} - Professional ${businessType} in ${areaName}`,
    description: tenant.metaDescription || 
      `Leading ${businessType.toLowerCase()} in ${areaName}. Expert training courses, professional certifications, and hands-on learning. Book your course today with ${tenant.name}.`,
    keywords: `${businessType}, ${areaName}, training, courses, certification, ${tenant.name}`,
    openGraph: {
      title: `${tenant.name} - ${areaName} ${businessType}`,
      description: tenant.metaDescription || `Professional ${businessType.toLowerCase()} serving ${areaName}`,
      type: 'website',
    },
  }
}

export default async function TenantAreaPage({ params }: PageProps) {
  // Validate area
  if (!VALID_AREAS.includes(params.area)) {
    notFound()
  }

  // Check tenant status first
  const tenantStatus = await checkTenantStatus(params.slug)

  if (tenantStatus === 'not_found') {
    notFound()
  }

  // If tenant is inactive, show suspended page
  if (tenantStatus === 'inactive') {
    const inactiveTenant = await prisma.tenant.findUnique({
      where: { slug: params.slug },
      select: { name: true, email: true, phone: true }
    })

    return (
      <AccountSuspended
        tenantName={inactiveTenant?.name}
        contactEmail={inactiveTenant?.email || undefined}
        contactPhone={inactiveTenant?.phone || undefined}
      />
    )
  }

  // Get tenant data (only for active tenants now)
  const tenant = await prisma.tenant.findUnique({
    where: { 
      slug: params.slug,
      active: true
    },
    include: {
      courses: {
        include: {
          sessions: {
            where: {
              startDate: {
                gte: new Date()
              }
            },
            orderBy: {
              startDate: 'asc'
            },
            take: 3
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!tenant) {
    notFound()
  }

  const areaName = AREA_NAMES[params.area as keyof typeof AREA_NAMES]
  const businessType = tenant.businessType || 'Training Centre'

  // Parse JSON fields safely
  const mainServices = tenant.mainServices ? JSON.parse(tenant.mainServices) : []
  const whyChooseUs = tenant.whyChooseUs ? JSON.parse(tenant.whyChooseUs) : []
  
  // Group courses by category
  const groupedCourses = tenant.courses.reduce((acc, course) => {
    const category = course.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(course)
    return acc
  }, {} as Record<string, typeof tenant.courses>)

  // Custom CSS for tenant branding
  const tenantStyles = {
    '--primary-color': tenant.primaryColor,
    '--secondary-color': tenant.secondaryColor,
  } as React.CSSProperties

  return (
    <div style={tenantStyles} className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative py-20 px-4 text-white overflow-hidden"
        style={{ backgroundColor: tenant.primaryColor }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-white bg-opacity-20 rounded-full px-4 py-2 mb-6">
                <span className="text-sm font-medium">
                  🎯 {businessType} in {areaName}
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                {tenant.heroHeading || `Professional ${businessType} Training in ${areaName}`}
              </h1>
              
              <p className="text-xl mb-8 text-white text-opacity-90 leading-relaxed">
                {tenant.heroSubheading || 
                  `Transform your career with expert ${businessType.toLowerCase()} courses in ${areaName}. Join thousands who've advanced their skills with ${tenant.name}.`}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={`/${params.slug}/courses`}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  📚 View {areaName} Courses
                </a>
                <a 
                  href={`/${params.slug}/contact`}
                  className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-colors"
                >
                  📞 Contact {areaName} Team
                </a>
              </div>
            </div>
            
            <div className="lg:text-right">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">🏆 Why Choose {tenant.name} in {areaName}?</h3>
                <div className="space-y-3 text-left">
                  {(whyChooseUs.length > 0 ? whyChooseUs : [
                    `Expert ${businessType.toLowerCase()} training in ${areaName}`,
                    'Industry-certified instructors',
                    'Hands-on practical experience',
                    'Flexible scheduling options',
                    'Local support and guidance'
                  ]).map((point: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-green-400 text-lg">✅</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Area-Specific Stats */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor }}>500+</div>
              <div className="text-gray-600">Students Trained in {areaName}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor }}>98%</div>
              <div className="text-gray-600">Pass Rate in {areaName}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor }}>15+</div>
              <div className="text-gray-600">Years Serving {areaName}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor }}>5★</div>
              <div className="text-gray-600">{areaName} Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories for Area */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" style={{ color: tenant.primaryColor }}>
              📚 {areaName} Training Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive {businessType.toLowerCase()} courses designed for {areaName} professionals. 
              Learn from industry experts and advance your career.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {Object.entries(groupedCourses).map(([category, courses]) => (
              <div key={category} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold mb-4" style={{ color: tenant.primaryColor }}>
                  {category}
                </h3>
                <div className="space-y-4">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="border-b border-gray-200 pb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: tenant.secondaryColor }}>
                          £{course.price}
                        </span>
                        {course.sessions.length > 0 && (
                          <span className="text-sm text-gray-500">
                            Next: {new Date(course.sessions[0].startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <a 
                  href={`/${params.slug}/courses?category=${encodeURIComponent(category)}`}
                  className="inline-flex items-center mt-6 text-sm font-semibold hover:underline"
                  style={{ color: tenant.primaryColor }}
                >
                  View all {category} courses in {areaName} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Progression - Customized for Area */}
      <section className="py-20 px-4" style={{ backgroundColor: `${tenant.primaryColor}10` }}>
        <div className="max-w-6xl mx-auto">
          <TierProgressionShowcase 
            primaryColor={tenant.primaryColor} 
            areaName={areaName}
            businessType={businessType}
          />
        </div>
      </section>

      {/* Area-Specific Bundle Offers */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <BundleOffers 
            courses={tenant.courses}
            primaryColor={tenant.primaryColor}
            secondaryColor={tenant.secondaryColor}
            areaName={areaName}
            tenantSlug={params.slug}
          />
        </div>
      </section>

      {/* Live Achievement Feed */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <LiveAchievementFeed 
            tenantId={tenant.id} 
            primaryColor={tenant.primaryColor}
            areaName={areaName}
          />
        </div>
      </section>

      {/* Area Contact & Booking */}
      <section className="py-20 px-4" style={{ backgroundColor: tenant.primaryColor }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your {businessType} Journey in {areaName}?
          </h2>
          <p className="text-xl mb-8 text-white text-opacity-90">
            Join hundreds of professionals who've advanced their careers through our {areaName}-based training programs.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">📍 {areaName} Training Center</h3>
              <p className="text-white text-opacity-90">
                {tenant.address || `Professional training facility located in the heart of ${areaName}`}
              </p>
              {tenant.phone && (
                <p className="mt-2 font-semibold">📞 {tenant.phone}</p>
              )}
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">⏰ Flexible Scheduling</h3>
              <p className="text-white text-opacity-90">
                Weekend and evening classes available for working professionals in {areaName}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`/${params.slug}/booking`}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              📅 Book {areaName} Course
            </a>
            <a 
              href={`/${params.slug}/contact`}
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              💬 Contact {areaName} Team
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// Generate static paths for common areas
export async function generateStaticParams() {
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { slug: true }
  })

  const paths = []
  for (const tenant of tenants) {
    for (const area of VALID_AREAS) {
      paths.push({
        slug: tenant.slug,
        area: area
      })
    }
  }

  return paths
}