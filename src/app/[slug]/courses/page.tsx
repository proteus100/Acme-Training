import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

interface CoursePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
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
    title: `Courses - ${tenant.name}`,
    description: `Browse professional training courses offered by ${tenant.name}. Located in ${tenant.city}, ${tenant.county}.`,
    keywords: `${tenant.name}, training courses, ${tenant.city}, ${tenant.county}, professional training`
  }
}

export default async function TenantCoursesPage({ params }: CoursePageProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Courses</h1>
              <p className="text-lg text-gray-600 mt-1">{tenant.name}</p>
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
        {tenant.courses.length > 0 ? (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Available Training Courses
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Professional training courses to advance your career and skills.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tenant.courses.map((course) => (
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

                  {course.sessions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Next available dates:</p>
                      <div className="space-y-1">
                        {course.sessions.slice(0, 2).map((session) => (
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
                        {course.sessions.length > 2 && (
                          <p className="text-xs text-gray-400">
                            +{course.sessions.length - 2} more dates available
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <a
                    href={`/${tenant.slug}/booking`}
                    className="w-full block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Book This Course
                  </a>
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                No courses available
              </h3>
              <p className="text-gray-600 mb-8">
                We don't currently have any courses available.
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
                    href={`/${tenant.slug}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Links
          </h2>

          <div className="grid gap-4 md:grid-cols-3 text-center">
            <a
              href={`/${tenant.slug}/booking`}
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="mb-4">
                <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6m-6 0a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2m-6 0V9" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Book Training</h3>
              <p className="text-sm text-gray-600">Reserve your spot online</p>
            </a>

            <a
              href={`/${tenant.slug}/contact`}
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="mb-4">
                <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
              <p className="text-sm text-gray-600">Get in touch with questions</p>
            </a>

            <a
              href={`/${tenant.slug}`}
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="mb-4">
                <svg className="mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Home</h3>
              <p className="text-sm text-gray-600">Back to main page</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}