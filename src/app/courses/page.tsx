'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, Pound } from 'lucide-react'

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Courses' },
    { value: 'GAS_SAFE', label: 'Gas Safe' },
    { value: 'HEAT_PUMP', label: 'Heat Pump' },
    { value: 'OFTEC', label: 'OFTEC Oil' },
    { value: 'LPG', label: 'LPG' },
    { value: 'WATER', label: 'Water Systems' },
    { value: 'VAPORIZING', label: 'Vaporizing Appliances' }
  ]

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
        // If API fails, show sample data for demo purposes
        console.warn('API not available, showing sample data')
        setCourses(getSampleCourses())
      }
    } catch (error) {
      console.warn('Database not connected, showing sample data')
      setCourses(getSampleCourses())
    } finally {
      setLoading(false)
    }
  }

  const getSampleCourses = (): Course[] => {
    const allCourses = [
      {
        id: '1',
        title: 'ACS CORE & 4 REA',
        description: 'Gas safety reassessment for core competencies and 4 appliances. Run by engineers for engineers.',
        category: 'GAS_SAFE',
        duration: 16,
        price: 650.00,
        maxStudents: 12,
        sessions: [
          { id: '1', startDate: '2024-09-16T00:00:00Z', endDate: '2024-09-17T00:00:00Z', availableSpots: 12, bookedSpots: 3 },
          { id: '2', startDate: '2024-10-17T00:00:00Z', endDate: '2024-10-18T00:00:00Z', availableSpots: 12, bookedSpots: 5 }
        ]
      },
      {
        id: '2',
        title: 'ACS CORE & 4 INITIAL',
        description: 'Initial gas safety assessment for core competencies and 4 appliances. Complete certification course.',
        category: 'GAS_SAFE',
        duration: 40,
        price: 995.00,
        maxStudents: 12,
        sessions: [
          { id: '3', startDate: '2024-09-30T00:00:00Z', endDate: '2024-10-04T00:00:00Z', availableSpots: 12, bookedSpots: 8 }
        ]
      },
      {
        id: '3',
        title: 'LPG PD/RPH REA',
        description: 'LPG Permanent Dwellings and Residential Park Homes reassessment.',
        category: 'LPG',
        duration: 16,
        price: 300.00,
        maxStudents: 12,
        sessions: [
          { id: '4', startDate: '2024-10-02T00:00:00Z', endDate: '2024-10-03T00:00:00Z', availableSpots: 12, bookedSpots: 2 }
        ]
      },
      {
        id: '4',
        title: 'OFTEC REA',
        description: 'OFTEC oil heating reassessment for qualified technicians.',
        category: 'OFTEC',
        duration: 16,
        price: 600.00,
        maxStudents: 12,
        sessions: [
          { id: '5', startDate: '2024-09-23T00:00:00Z', endDate: '2024-09-24T00:00:00Z', availableSpots: 12, bookedSpots: 6 }
        ]
      },
      {
        id: '5',
        title: 'Air Source Heat Pump',
        description: 'Air source heat pump installation, commissioning and maintenance training.',
        category: 'HEAT_PUMP',
        duration: 32,
        price: 650.00,
        maxStudents: 10,
        sessions: [
          { id: '6', startDate: '2024-09-27T00:00:00Z', endDate: '2024-09-30T00:00:00Z', availableSpots: 10, bookedSpots: 4 }
        ]
      },
      {
        id: '6',
        title: 'Vented/Unvented REA',
        description: 'Vented and unvented hot water systems reassessment.',
        category: 'WATER',
        duration: 8,
        price: 185.00,
        maxStudents: 12,
        sessions: [
          { id: '7', startDate: '2024-09-19T00:00:00Z', endDate: '2024-09-19T00:00:00Z', availableSpots: 12, bookedSpots: 1 }
        ]
      }
    ]
    
    if (selectedCategory === 'all') {
      return allCourses
    }
    
    return allCourses.filter(course => course.category === selectedCategory)
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return 'bg-red-100 text-red-800'
      case 'HEAT_PUMP': return 'bg-green-100 text-green-800'
      case 'OFTEC': return 'bg-blue-100 text-blue-800'
      case 'LPG': return 'bg-purple-100 text-purple-800'
      case 'WATER': return 'bg-cyan-100 text-cyan-800'
      case 'VAPORIZING': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
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
                {/* Category Badge */}
                <div className="p-4 pb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryBadgeColor(course.category)}`}>
                    {course.category.replace('_', ' ')}
                  </span>
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
                      <Pound className="w-4 h-4 mr-1" />
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