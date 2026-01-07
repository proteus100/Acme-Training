import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug }
  })

  if (!tenant) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }

  return {
    title: `Book Training - ${tenant.name}`,
    description: `Book professional training courses with ${tenant.name}. Easy online booking with instant confirmation.`,
    keywords: `${tenant.name}, training booking, course booking, ${tenant.city}, ${tenant.county}`
  }
}

export default async function TenantBookingPage({ params }: BookingPageProps) {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      courses: {
        include: {
          sessions: {
            where: {
              isActive: true,
              startDate: {
                gte: new Date()
              }
            },
            orderBy: {
              startDate: 'asc'
            }
          }
        }
      }
    }
  })

  if (!tenant) {
    notFound()
  }

  const availableCourses = tenant.courses.filter(course => course.sessions.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book Training</h1>
              <p className="text-lg text-gray-600 mt-1">with {tenant.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{tenant.city}, {tenant.county}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableCourses.length > 0 ? (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Available Training Courses
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Select a course below to view available dates and book your training session.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {course.description}
                    </p>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="font-medium">{course.duration} day{course.duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-bold text-lg text-green-600">£{course.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Available sessions:</span>
                      <span className="font-medium">{course.sessions.length}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Next available dates:</p>
                    <div className="space-y-1">
                      {course.sessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="text-sm">
                          <span className="font-medium">
                            {new Date(session.startDate).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({session.maxStudents - session.enrolledStudents} spaces left)
                          </span>
                        </div>
                      ))}
                      {course.sessions.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{course.sessions.length - 3} more dates available
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => {
                      // For now, redirect to the main booking page
                      window.location.href = '/booking'
                    }}
                  >
                    View Dates & Book
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6m-6 0a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0V9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No courses available for booking
              </h3>
              <p className="text-gray-600 mb-8">
                We don't currently have any training sessions scheduled.
                Please check back soon or contact us for more information.
              </p>
              <div className="space-y-4">
                <a
                  href={`/${tenant.slug}/contact`}
                  className="inline-block bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Contact Us
                </a>
                <div>
                  <a
                    href={`/${tenant.slug}/courses`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Our Courses
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Need Help with Booking?
            </h3>
            <p className="text-gray-600">
              Our team is here to help you find the right training course
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="mb-4">
                <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Phone</h4>
              <p className="text-gray-600">{tenant.phone}</p>
            </div>

            <div>
              <div className="mb-4">
                <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
              <p className="text-gray-600">{tenant.email}</p>
            </div>

            <div>
              <div className="mb-4">
                <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
              <p className="text-gray-600">{tenant.city}, {tenant.county}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}