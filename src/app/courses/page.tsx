'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Users, PoundSterling } from 'lucide-react'
import Image from 'next/image'

interface Course {
  id: string
  title: string
  description: string
  category: string
  duration: number
  price: number
  maxStudents: number
  sessions: Array<{
    id: string
    startDate: string
    endDate: string
    availableSpots: number
    bookedSpots: number
  }>
}

function CoursesPageContent() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Courses' },
    { value: 'gas_safe', label: 'Gas Safe' },
    { value: 'heat_pump', label: 'Heat Pump' },
    { value: 'oftec', label: 'OFTEC' },
    { value: 'lpg', label: 'LPG' },
    { value: 'fgas_air_conditioning', label: 'F-Gas Air Conditioning' },
    { value: 'commercial_catering', label: 'Commercial Catering' },
    { value: 'commercial_laundry', label: 'Commercial Laundry' },
    { value: 'commercial_gas', label: 'Commercial Gas' },
    { value: 'commercial_core', label: 'Commercial Core' },
    { value: 'water', label: 'Water' },
    { value: 'vaporizing', label: 'Vaporizing' },
    { value: 'electrical', label: 'Electrical (NIC EIC)' },
    { value: 'refrigeration', label: 'Refrigeration' }
  ]

  // Set initial category from URL parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && categories.some(cat => cat.value === categoryParam)) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams])

  useEffect(() => {
    fetchCourses()
  }, [selectedCategory])

  const fetchCourses = async () => {
    try {
      const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''
      const response = await fetch(`/api/courses${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      } else {
        console.error('Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return 'bg-red-100 text-red-800'
      case 'HEAT_PUMP': return 'bg-green-100 text-green-800'
      case 'OFTEC': return 'bg-blue-100 text-blue-800'
      case 'LPG': return 'bg-purple-100 text-purple-800'
      case 'FGAS_AIR_CONDITIONING': return 'bg-cyan-100 text-cyan-800'
      case 'COMMERCIAL_CATERING': return 'bg-orange-100 text-orange-800'
      case 'COMMERCIAL_LAUNDRY': return 'bg-indigo-100 text-indigo-800'
      case 'COMMERCIAL_GAS': return 'bg-amber-100 text-amber-800'
      case 'COMMERCIAL_CORE': return 'bg-gray-100 text-gray-800'
      case 'WATER': return 'bg-teal-100 text-teal-800'
      case 'VAPORIZING': return 'bg-pink-100 text-pink-800'
      case 'ELECTRICAL': return 'bg-yellow-100 text-yellow-800'
      case 'REFRIGERATION': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLogo = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return '/images/logos/gas-safe.svg'
      case 'HEAT_PUMP': return '/images/logos/heat-pump.svg'
      case 'OFTEC': return '/images/logos/oftec.svg'
      case 'LPG': return '/images/logos/lpg.svg'
      case 'FGAS_AIR_CONDITIONING': return '/images/logos/gas-safe.svg' // F-Gas uses similar certification
      case 'COMMERCIAL_CATERING': return '/images/logos/gas-safe.svg'
      case 'COMMERCIAL_LAUNDRY': return '/images/logos/gas-safe.svg'
      case 'COMMERCIAL_GAS': return '/images/logos/gas-safe.svg'
      case 'COMMERCIAL_CORE': return '/images/logos/gas-safe.svg'
      case 'WATER': return '/images/logos/gas-safe.svg'
      case 'VAPORIZING': return '/images/logos/gas-safe.svg'
      case 'ELECTRICAL': return '/images/logos/electrical.svg'
      case 'REFRIGERATION': return '/images/logos/refrigeration.svg'
      default: return '/images/logos/gas-safe.svg' // fallback
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCategoryName = (category: string) => {
    switch (category) {
      case 'FGAS_AIR_CONDITIONING': return 'F-Gas Air Conditioning'
      case 'COMMERCIAL_CATERING': return 'Commercial Catering'
      case 'COMMERCIAL_LAUNDRY': return 'Commercial Laundry'
      case 'COMMERCIAL_GAS': return 'Commercial Gas'
      case 'COMMERCIAL_CORE': return 'Commercial Core'
      case 'GAS_SAFE': return 'Gas Safe'
      case 'HEAT_PUMP': return 'Heat Pump'
      case 'OFTEC': return 'OFTEC'
      case 'LPG': return 'LPG'
      case 'WATER': return 'Water'
      case 'VAPORIZING': return 'Vaporizing'
      case 'ELECTRICAL': return 'Electrical (NIC EIC)'
      case 'REFRIGERATION': return 'Refrigeration'
      default: return category.replace(/_/g, ' ')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading courses...</div>
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
              <Link href="/courses" className="text-blue-200">Courses</Link>
              <Link href="/booking" className="hover:text-blue-200">Book Now</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Training Courses</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our comprehensive range of professional gas, heating, and renewable energy training courses
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No courses found for the selected category.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Category Badge & Logo */}
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryBadgeColor(course.category)}`}>
                      {formatCategoryName(course.category)}
                    </span>
                    <div className="flex-shrink-0">
                      <Image
                        src={getCategoryLogo(course.category)}
                        alt={`${course.category} certification logo`}
                        width={60}
                        height={30}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-2">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">{course.description}</p>
                  
                  {/* Course Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{course.duration} hours</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Max {course.maxStudents} students</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-green-600">
                      <PoundSterling className="w-4 h-4 mr-1" />
                      <span>{course.price.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Available Sessions */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Upcoming Sessions:</h4>
                    {course.sessions.length === 0 ? (
                      <p className="text-sm text-gray-500">No upcoming sessions</p>
                    ) : (
                      <div className="space-y-1">
                        {course.sessions.slice(0, 3).map((session) => (
                          <div key={session.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(session.startDate)}
                            </span>
                            <span className="text-gray-500">
                              {session.availableSpots - session.bookedSpots} spots left
                            </span>
                          </div>
                        ))}
                        {course.sessions.length > 3 && (
                          <p className="text-xs text-gray-500">+{course.sessions.length - 3} more sessions</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Book Button */}
                  <Link 
                    href={`/booking?course=${course.id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors text-center block"
                  >
                    Book This Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    }>
      <CoursesPageContent />
    </Suspense>
  )
}