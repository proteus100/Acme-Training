'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, User, Mail, Phone, Building, MapPin, CreditCard, Clock, Users } from 'lucide-react'

const bookingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  company: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  postcode: z.string().min(5, 'Postcode is required'),
  specialRequests: z.string().optional(),
  paymentType: z.enum(['full', 'deposit'])
})

type BookingForm = z.infer<typeof bookingSchema>

interface Course {
  id: string
  title: string
  description: string
  category: string
  duration: number
  price: number
  maxStudents: number
  sessions: CourseSession[]
}

interface CourseSession {
  id: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  availableSpots: number
  bookedSpots: number
}

export default function BookingPage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course')
  
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'course' | 'session' | 'details' | 'payment'>('course')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema)
  })

  const paymentType = watch('paymentType', 'full')

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId && courses.length > 0) {
      const course = courses.find(c => c.id === courseId)
      if (course) {
        setSelectedCourse(course)
        setStep('session')
      }
    }
  }, [courseId, courses])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setSelectedSession(null)
    setStep('session')
  }

  const handleSessionSelect = (session: CourseSession) => {
    setSelectedSession(session)
    setStep('details')
  }

  const handleFormSubmit = (data: BookingForm) => {
    if (!selectedCourse || !selectedSession) return
    
    // Here we would create the booking and initiate payment
    console.log('Booking data:', {
      course: selectedCourse,
      session: selectedSession,
      customer: data
    })
    
    setStep('payment')
  }

  const getCalendarEvents = () => {
    if (!selectedCourse) return []
    
    return selectedCourse.sessions.map(session => ({
      id: session.id,
      title: `${selectedCourse.title} (${session.availableSpots - session.bookedSpots} spots)`,
      start: session.startDate,
      end: session.endDate,
      backgroundColor: session.availableSpots - session.bookedSpots > 0 ? '#3b82f6' : '#ef4444',
      borderColor: session.availableSpots - session.bookedSpots > 0 ? '#2563eb' : '#dc2626',
      extendedProps: {
        session: session,
        available: session.availableSpots - session.bookedSpots > 0
      }
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateAmount = () => {
    if (!selectedCourse) return 0
    return paymentType === 'full' ? selectedCourse.price : selectedCourse.price * 0.3
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
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
              <Link href="/booking" className="text-blue-200">Book Now</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {['course', 'session', 'details', 'payment'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-blue-600 text-white' : 
                  ['course', 'session', 'details', 'payment'].indexOf(step) > index ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {['course', 'session', 'details', 'payment'].indexOf(step) + 1} of 4
          </div>
        </div>

        {/* Step 1: Course Selection */}
        {step === 'course' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Select a Course</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                     onClick={() => handleCourseSelect(course)}>
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{course.duration} hours</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Max {course.maxStudents} students</span>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-green-600">
                      <span>£{course.price.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Session Selection */}
        {step === 'session' && selectedCourse && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <button 
                onClick={() => setStep('course')}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Back to Course Selection
              </button>
              <h1 className="text-3xl font-bold mb-2">{selectedCourse.title}</h1>
              <p className="text-gray-600">Select a session date</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={getCalendarEvents()}
                  eventClick={(info) => {
                    if (info.event.extendedProps.available) {
                      handleSessionSelect(info.event.extendedProps.session)
                    }
                  }}
                  height="400px"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                  }}
                />
              </div>

              {/* Session List */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Available Sessions</h3>
                <div className="space-y-3">
                  {selectedCourse.sessions.map((session) => {
                    const spotsLeft = session.availableSpots - session.bookedSpots
                    return (
                      <div key={session.id} 
                           className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                             spotsLeft > 0 ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' : 'border-red-200 bg-red-50 cursor-not-allowed'
                           }`}
                           onClick={() => spotsLeft > 0 && handleSessionSelect(session)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{formatDate(session.startDate)}</p>
                            <p className="text-sm text-gray-600">
                              {session.startTime} - {session.endTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 'details' && selectedCourse && selectedSession && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button 
                onClick={() => setStep('session')}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Back to Session Selection
              </button>
              <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium">{selectedCourse.title}</p>
                <p className="text-sm text-gray-600">{formatDate(selectedSession.startDate)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      {...register('firstName')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      {...register('lastName')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                    <input
                      {...register('company')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      {...register('address')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      {...register('postcode')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.postcode && <p className="text-red-600 text-sm mt-1">{errors.postcode.message}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Option */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Option
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('paymentType')}
                      type="radio"
                      value="full"
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Full Payment</div>
                      <div className="text-sm text-gray-600">Pay £{selectedCourse.price.toFixed(0)} now</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('paymentType')}
                      type="radio"
                      value="deposit"
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Deposit (30%)</div>
                      <div className="text-sm text-gray-600">Pay £{(selectedCourse.price * 0.3).toFixed(0)} now, remainder before course</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests or Notes (Optional)</label>
                <textarea
                  {...register('specialRequests')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Course:</span>
                    <span>{selectedCourse.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formatDate(selectedSession.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{selectedSession.startTime} - {selectedSession.endTime}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Amount to pay:</span>
                    <span>£{calculateAmount().toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 'payment' && (
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Payment Processing</h1>
            <p className="text-gray-600 mb-8">Payment integration will be implemented next...</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Stripe payment integration coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}