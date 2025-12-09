'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, User, Mail, Phone, Building, MapPin, CreditCard, Clock, Users, Plus, Minus } from 'lucide-react'
import PaymentForm from '../../components/PaymentForm'

// Add-ons data structure based on ACME_PRICING_ADDONS.md
const courseAddons = {
  GAS_SAFE: [
    { id: 'single-oven', name: 'Single Oven Assessment', price: 75 },
    { id: 'double-oven', name: 'Double Oven Assessment', price: 95 },
    { id: 'range-cooker', name: 'Range Cooker Assessment', price: 125 },
    { id: 'gas-fire-open', name: 'Gas Fire Assessment (Open Flue)', price: 95 },
    { id: 'gas-fire-balanced', name: 'Gas Fire Assessment (Balanced Flue)', price: 105 },
    { id: 'instant-water-heater', name: 'Instantaneous Water Heater', price: 95 },
    { id: 'storage-water-heater', name: 'Storage Water Heater', price: 105 },
    { id: 'combination-boiler', name: 'Combination Boiler Assessment', price: 145 },
    { id: 'system-boiler', name: 'System Boiler Assessment', price: 135 },
    { id: 'central-heating', name: 'Central Heating Installation', price: 165 }
  ],
  HEAT_PUMP: [
    { id: 'ground-source', name: 'Ground Source Heat Pump', price: 195 },
    { id: 'water-source', name: 'Water Source Heat Pump', price: 185 },
    { id: 'hybrid-systems', name: 'Hybrid Heat Pump Systems', price: 165 },
    { id: 'high-temp-pump', name: 'High Temperature Heat Pump', price: 175 },
    { id: 'heat-pump-sizing', name: 'Heat Pump Sizing', price: 85 },
    { id: 'controls-commissioning', name: 'Controls & Commissioning', price: 125 },
    { id: 'refrigerant-handling', name: 'Refrigerant Handling', price: 145 }
  ],
  OFTEC: [
    { id: 'pressure-jet', name: 'Pressure Jet Boiler (OFT10-101)', price: 145 },
    { id: 'vaporising-boiler', name: 'Vaporising Boiler Assessment', price: 125 },
    { id: 'combination-oil', name: 'Combination Oil Boiler', price: 165 },
    { id: 'aga-assessment', name: 'AGA Assessment', price: 185 },
    { id: 'rayburn-assessment', name: 'Rayburn Assessment', price: 185 },
    { id: 'esse-cooker', name: 'Esse Cooker Assessment', price: 165 },
    { id: 'oil-tank-install', name: 'Oil Tank Installation', price: 125 },
    { id: 'fault-finding', name: 'Fault Finding Module', price: 115 }
  ],
  LPG: [
    { id: 'lpg-cooker', name: 'LPG Cooker Assessment', price: 85 },
    { id: 'lpg-fire', name: 'LPG Fire Assessment', price: 105 },
    { id: 'lpg-water-heater', name: 'LPG Water Heater', price: 115 },
    { id: 'caravan-systems', name: 'Caravan/Motorhome Systems', price: 125 },
    { id: 'lpg-cylinder', name: 'LPG Cylinder Storage', price: 75 },
    { id: 'bulk-lpg-tank', name: 'Bulk LPG Tank Systems', price: 165 }
  ],
  WATER: [
    { id: 'unvented-g3', name: 'Unvented Hot Water (G3)', price: 285 },
    { id: 'unvented-maintenance', name: 'Unvented Maintenance', price: 145 },
    { id: 'solar-water', name: 'Solar Water Heating', price: 195 },
    { id: 'heat-pump-water', name: 'Heat Pump Water Heating', price: 225 },
    { id: 'commercial-water', name: 'Commercial Water Heating', price: 245 },
    { id: 'legionella-awareness', name: 'Legionella Awareness', price: 125 }
  ],
  FGAS_AIR_CONDITIONING: [
    // Core F-Gas Certifications
    { id: 'fgas-cat1', name: 'F-Gas Category I Certification', price: 495 },
    { id: 'fgas-cat2', name: 'F-Gas Category II Certification', price: 395 },
    { id: 'fgas-cat3', name: 'F-Gas Category III Certification', price: 345 },
    { id: 'fgas-cat4', name: 'F-Gas Category IV Certification', price: 295 },
    
    // F-Gas Reassessments
    { id: 'fgas-cat1-reassess', name: 'F-Gas Category I Reassessment', price: 245 },
    { id: 'fgas-cat2-reassess', name: 'F-Gas Category II Reassessment', price: 195 },
    { id: 'fgas-cat3-reassess', name: 'F-Gas Category III Reassessment', price: 175 },
    { id: 'fgas-cat4-reassess', name: 'F-Gas Category IV Reassessment', price: 145 },
    
    // Commercial Refrigeration Systems
    { id: 'commercial-refrigeration', name: 'Commercial Refrigeration Systems', price: 465 },
    { id: 'supermarket-refrigeration', name: 'Supermarket Refrigeration Training', price: 385 },
    { id: 'cold-storage', name: 'Cold Storage Facility Training', price: 425 },
    { id: 'food-processing', name: 'Food Processing Refrigeration', price: 395 },
    { id: 'pharmaceutical-cooling', name: 'Pharmaceutical Cooling Systems', price: 445 },
    
    // Marine & Transport Refrigeration
    { id: 'marine-refrigeration', name: 'Marine Refrigeration Systems (Boats)', price: 525 },
    { id: 'ship-air-conditioning', name: 'Ship Air Conditioning Systems', price: 495 },
    { id: 'refrigerated-transport', name: 'Refrigerated Transport Vehicles', price: 385 },
    { id: 'container-refrigeration', name: 'Shipping Container Refrigeration', price: 425 },
    
    // Specialized Applications
    { id: 'data-centre-cooling', name: 'Data Centre Cooling Systems', price: 485 },
    { id: 'industrial-process-cooling', name: 'Industrial Process Cooling', price: 465 },
    { id: 'ice-rink-refrigeration', name: 'Ice Rink Refrigeration Systems', price: 545 },
    { id: 'brewery-refrigeration', name: 'Brewery Refrigeration Systems', price: 395 },
    
    // Air Conditioning Specializations
    { id: 'air-con-install', name: 'Air Conditioning Installation', price: 425 },
    { id: 'vrf-systems', name: 'VRF (Variable Refrigerant Flow) Systems', price: 485 },
    { id: 'chilled-water-systems', name: 'Chilled Water Systems', price: 445 },
    { id: 'split-system-ac', name: 'Split System Air Conditioning', price: 325 },
    { id: 'ducted-ac-systems', name: 'Ducted Air Conditioning Systems', price: 385 },
    
    // Technical Skills & Compliance
    { id: 'refrigerant-recovery', name: 'Refrigerant Recovery Training', price: 225 },
    { id: 'leak-detection', name: 'Leak Detection Training', price: 185 },
    { id: 'refrigerant-handling', name: 'Safe Refrigerant Handling', price: 165 },
    { id: 'environmental-compliance', name: 'F-Gas Environmental Compliance', price: 145 },
    { id: 'record-keeping', name: 'F-Gas Record Keeping Requirements', price: 95 }
  ],
  COMMERCIAL_CATERING: [
    { id: 'commercial-catering-core', name: 'Commercial Gas Catering Core', price: 385 },
    { id: 'commercial-catering-assessment', name: 'Commercial Natural Gas Catering Assessment', price: 295 },
    { id: 'commercial-ovens', name: 'Commercial Oven Training', price: 225 },
    { id: 'commercial-fryers', name: 'Commercial Fryer Training', price: 215 },
    { id: 'commercial-griddles', name: 'Commercial Griddle Training', price: 195 },
    { id: 'commercial-boiling-pans', name: 'Commercial Boiling Pan Training', price: 185 }
  ],
  COMMERCIAL_LAUNDRY: [
    { id: 'commercial-laundry-assessment', name: 'Commercial Laundry Natural Gas Assessment', price: 275 },
    { id: 'commercial-washers', name: 'Commercial Washer Training', price: 195 },
    { id: 'commercial-dryers', name: 'Commercial Dryer Training', price: 205 },
    { id: 'commercial-ironing', name: 'Commercial Ironing Equipment', price: 165 }
  ],
  COMMERCIAL_GAS: [
    { id: 'commercial-gas-core', name: 'Commercial Core Training', price: 425 },
    { id: 'commercial-gas-assessment', name: 'Commercial Gas Assessment', price: 385 },
    { id: 'commercial-pipework', name: 'Commercial Pipework Training', price: 295 },
    { id: 'commercial-meters', name: 'Commercial Meter Installation', price: 225 },
    { id: 'commercial-safety', name: 'Commercial Gas Safety', price: 195 }
  ],
  COMMERCIAL_CORE: [
    { id: 'commercial-core-training', name: 'Commercial Core Training Programme', price: 495 },
    { id: 'commercial-assessment-prep', name: 'Commercial Assessment Preparation', price: 225 },
    { id: 'commercial-regulations', name: 'Commercial Gas Regulations', price: 165 },
    { id: 'commercial-documentation', name: 'Commercial Documentation Training', price: 125 }
  ]
}

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

interface TenantData {
  name: string
  slug: string
  logo?: string
  email: string
  phone?: string
  city?: string
  county?: string
  primaryColor: string
  secondaryColor: string
}

interface Bundle {
  id: string
  title: string
  description: string
  tagline: string | null
  tier: string
  originalPrice: number
  bundlePrice: number
  savings: number
  discountPercentage: number
  isPopular: boolean
  features: string[]
  benefits: string[]
  courses: {
    id: string
    title: string
    description: string
    category: string
    duration: number
    price: number
    sessions: CourseSession[]
  }[]
}

function BookingPageContent() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course')
  const bundleId = searchParams.get('bundle')

  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'course' | 'session' | 'addons' | 'details' | 'payment'>('course')
  const [calendarView, setCalendarView] = useState<'single-course' | 'all-courses'>('single-course')
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string
    customerId: string
  } | null>(null)
  const [paymentData, setPaymentData] = useState<{
    amount: number
    courseTitle: string
    customerName: string
    bookingData: any
  } | null>(null)

  // Bundle-specific state
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [bundleSessionSelections, setBundleSessionSelections] = useState<{[courseId: string]: string}>({})

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
    fetchTenantAndCourses()
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

  useEffect(() => {
    if (bundleId) {
      fetchBundle()
    }
  }, [bundleId])

  const fetchBundle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bundles/${bundleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bundle')
      }
      const bundleData = await response.json()
      setSelectedBundle(bundleData)
      setStep('session')
    } catch (error) {
      console.error('Error fetching bundle:', error)
      alert('Failed to load bundle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTenantAndCourses = async () => {
    try {
      // Fetch tenant data from current hostname
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]

      // Try to fetch tenant by subdomain
      const tenantResponse = await fetch(`/api/tenant/${subdomain}`)
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json()
        setTenant(tenantData)
      } else {
        // Fallback to default tenant name
        setTenant({
          name: 'TrainKit Training',
          slug: 'trainkit',
          email: 'info@trainkit.co.uk',
          phone: '01234 567890',
          city: 'Exeter',
          county: 'Devon',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af'
        })
      }

      // Fetch courses (already tenant-filtered by API)
      const coursesResponse = await fetch('/api/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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
    setStep('addons')
  }

  const handleFormSubmit = async (data: BookingForm) => {
    setSubmitting(true)

    try {
      // Handle bundle booking
      if (selectedBundle) {
        // Validate all sessions are selected
        const allSessionsSelected = selectedBundle.courses.every(course =>
          bundleSessionSelections[course.id]
        )

        if (!allSessionsSelected) {
          alert('Please select a session for each course in the bundle')
          setSubmitting(false)
          return
        }

        const paymentAmount = data.paymentType === 'deposit'
          ? selectedBundle.bundlePrice * 0.3
          : selectedBundle.bundlePrice

        // Prepare bundle booking data
        const bookingData = {
          bundleId: selectedBundle.id,
          sessionSelections: selectedBundle.courses.map(course => ({
            courseId: course.id,
            sessionId: bundleSessionSelections[course.id]
          })),
          customer: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            company: data.company || undefined,
            address: data.address,
            postcode: data.postcode,
            specialRequests: data.specialRequests || undefined
          },
          paymentType: data.paymentType
        }

        setPaymentData({
          amount: paymentAmount,
          courseTitle: selectedBundle.title,
          customerName: `${data.firstName} ${data.lastName}`,
          bookingData
        })

        setStep('payment')
        return
      }

      // Handle single course booking
      if (!selectedCourse || !selectedSession) return

      // Calculate amounts including add-ons
      const totalAmount = selectedCourse.price + calculateAddonsTotal()
      const paymentAmount = data.paymentType === 'deposit' ? totalAmount * 0.3 : totalAmount

      // Prepare add-ons data
      const selectedAddonsList = Object.entries(selectedAddons)
        .filter(([_, qty]) => qty > 0)
        .map(([addonId, quantity]) => {
          const addon = courseAddons[selectedCourse.category as keyof typeof courseAddons]?.find(a => a.id === addonId)
          return {
            addonId,
            name: addon?.name || '',
            price: addon?.price || 0,
            quantity
          }
        })

      // Prepare payment data
      const bookingData = {
        courseId: selectedCourse.id,
        sessionId: selectedSession.id,
        addons: selectedAddonsList,
        customer: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company || undefined,
          address: data.address,
          postcode: data.postcode,
          specialRequests: data.specialRequests || undefined
        },
        paymentType: data.paymentType
      }

      setPaymentData({
        amount: paymentAmount,
        courseTitle: selectedCourse.title,
        customerName: `${data.firstName} ${data.lastName}`,
        bookingData
      })

      setStep('payment')
    } catch (error) {
      console.error('Error preparing payment:', error)
      alert(`Error preparing payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getCourseColor = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return '#dc2626'        // Red
      case 'HEAT_PUMP': return '#16a34a'       // Green  
      case 'OFTEC': return '#2563eb'           // Blue
      case 'LPG': return '#7c3aed'             // Purple
      case 'FGAS_AIR_CONDITIONING': return '#0891b2'  // Cyan
      case 'COMMERCIAL_CATERING': return '#ea580c'    // Orange
      case 'COMMERCIAL_LAUNDRY': return '#7c2d12'     // Brown
      case 'COMMERCIAL_GAS': return '#991b1b'         // Dark red
      case 'COMMERCIAL_CORE': return '#1e40af'        // Dark blue
      case 'WATER': return '#059669'           // Emerald
      case 'VAPORIZING': return '#9333ea'     // Violet
      default: return '#6b7280'               // Gray
    }
  }

  const getCalendarEvents = () => {
    if (calendarView === 'all-courses') {
      // Show all courses and sessions
      return courses.flatMap(course => 
        course.sessions.map(session => ({
          id: session.id,
          title: `${course.title} (${session.availableSpots - session.bookedSpots} spots)`,
          start: session.startDate,
          end: session.endDate,
          backgroundColor: getCourseColor(course.category),
          borderColor: getCourseColor(course.category),
          textColor: '#ffffff',
          extendedProps: {
            course: course,
            session: session,
            available: session.availableSpots - session.bookedSpots > 0,
            category: course.category
          }
        }))
      )
    } else if (selectedCourse) {
      // Current single-course view
      return selectedCourse.sessions.map(session => ({
        id: session.id,
        title: `${selectedCourse.title} (${session.availableSpots - session.bookedSpots} spots)`,
        start: session.startDate,
        end: session.endDate,
        backgroundColor: session.availableSpots - session.bookedSpots > 0 ? '#3b82f6' : '#ef4444',
        borderColor: session.availableSpots - session.bookedSpots > 0 ? '#2563eb' : '#dc2626',
        extendedProps: {
          course: selectedCourse,
          session: session,
          available: session.availableSpots - session.bookedSpots > 0
        }
      }))
    }
    return []
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
      default: return category.replace(/_/g, ' ')
    }
  }

  const calculateAddonsTotal = () => {
    if (!selectedCourse) return 0
    
    const addons = courseAddons[selectedCourse.category as keyof typeof courseAddons] || []
    return Object.entries(selectedAddons).reduce((total, [addonId, quantity]) => {
      const addon = addons.find(a => a.id === addonId)
      return total + (addon ? addon.price * quantity : 0)
    }, 0)
  }

  const calculateAmount = () => {
    if (selectedBundle) {
      return paymentType === 'full' ? selectedBundle.bundlePrice : selectedBundle.bundlePrice * 0.3
    }
    if (!selectedCourse) return 0
    const totalPrice = selectedCourse.price + calculateAddonsTotal()
    return paymentType === 'full' ? totalPrice : totalPrice * 0.3
  }

  const handlePaymentSuccess = (bookingId: string) => {
    setBookingResult({
      bookingId,
      customerId: 'payment-completed'
    })
    // Stay on payment step to show success message
  }

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50 relative"
      style={tenant?.logo ? {
        backgroundImage: `url('${tenant.logo}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Background overlay for better readability */}
      {tenant?.logo && <div className="absolute inset-0 bg-white/85 z-0"></div>}
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">{tenant?.name || 'TrainKit Training'}</Link>
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
          {selectedBundle ? (
            // Bundle flow: session, details, payment (3 steps)
            <div>
              <div className="flex items-center justify-center space-x-4 mb-4">
                {['session', 'details', 'payment'].map((s, index) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s ? 'bg-blue-600 text-white' :
                      ['session', 'details', 'payment'].indexOf(step) > index ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 2 && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-gray-600">
                Step {['session', 'details', 'payment'].indexOf(step) + 1} of 3
              </div>
            </div>
          ) : (
            // Single course flow: course, session, addons, details, payment (5 steps)
            <div>
              <div className="flex items-center justify-center space-x-4 mb-4">
                {['course', 'session', 'addons', 'details', 'payment'].map((s, index) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s ? 'bg-blue-600 text-white' :
                      ['course', 'session', 'addons', 'details', 'payment'].indexOf(step) > index ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 4 && <div className="w-16 h-0.5 bg-gray-300 mx-2" />}
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-gray-600">
                Step {['course', 'session', 'addons', 'details', 'payment'].indexOf(step) + 1} of 5
              </div>
            </div>
          )}
        </div>

        {/* Step 1: Course Selection */}
        {step === 'course' && (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Select a Course Category</h1>
            
            {/* Course Categories Grid */}
            <div className="space-y-8">
              {Object.entries({
                'GAS_SAFE': courses.filter(c => c.category === 'GAS_SAFE'),
                'FGAS_AIR_CONDITIONING': courses.filter(c => c.category === 'FGAS_AIR_CONDITIONING'),
                'HEAT_PUMP': courses.filter(c => c.category === 'HEAT_PUMP'),
                'OFTEC': courses.filter(c => c.category === 'OFTEC'),
                'LPG': courses.filter(c => c.category === 'LPG'),
                'WATER': courses.filter(c => c.category === 'WATER'),
                'COMMERCIAL_CATERING': courses.filter(c => c.category === 'COMMERCIAL_CATERING'),
                'COMMERCIAL_LAUNDRY': courses.filter(c => c.category === 'COMMERCIAL_LAUNDRY'),
                'COMMERCIAL_GAS': courses.filter(c => c.category === 'COMMERCIAL_GAS'),
                'COMMERCIAL_CORE': courses.filter(c => c.category === 'COMMERCIAL_CORE'),
                'VAPORIZING': courses.filter(c => c.category === 'VAPORIZING')
              }).filter(([_, coursesInCategory]) => coursesInCategory.length > 0).map(([category, coursesInCategory]) => (
                <div key={category} className="bg-white rounded-lg shadow-lg p-6">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {formatCategoryName(category)}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {coursesInCategory.length} course{coursesInCategory.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                    <div 
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        category === 'GAS_SAFE' ? 'bg-red-100 text-red-800' :
                        category === 'FGAS_AIR_CONDITIONING' ? 'bg-cyan-100 text-cyan-800' :
                        category === 'HEAT_PUMP' ? 'bg-green-100 text-green-800' :
                        category === 'OFTEC' ? 'bg-blue-100 text-blue-800' :
                        category === 'LPG' ? 'bg-purple-100 text-purple-800' :
                        category === 'WATER' ? 'bg-teal-100 text-teal-800' :
                        category === 'COMMERCIAL_CATERING' ? 'bg-orange-100 text-orange-800' :
                        category === 'COMMERCIAL_LAUNDRY' ? 'bg-indigo-100 text-indigo-800' :
                        category === 'COMMERCIAL_GAS' ? 'bg-amber-100 text-amber-800' :
                        category === 'COMMERCIAL_CORE' ? 'bg-gray-100 text-gray-800' :
                        'bg-pink-100 text-pink-800'
                      }`}
                    >
                      {formatCategoryName(category)}
                    </div>
                  </div>

                  {/* Courses Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coursesInCategory.map((course) => (
                      <div key={course.id} 
                           className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer border-2 border-transparent hover:border-blue-200"
                           onClick={() => handleCourseSelect(course)}>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">{course.title}</h3>
                        <p className="text-gray-600 mb-3 text-sm line-clamp-2">{course.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{course.duration}h</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            <span>Max {course.maxStudents}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">£{course.price.toFixed(0)}</span>
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            {course.sessions?.length || 0} session{course.sessions?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* No Courses Message */}
            {courses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No courses available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Bundle Session Selection */}
        {step === 'session' && selectedBundle && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => window.location.href = '/'}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Back to Home
              </button>
              <h1 className="text-3xl font-bold mb-2">{selectedBundle.title}</h1>
              <p className="text-gray-600 mb-4">{selectedBundle.description}</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Original Price</p>
                    <p className="font-medium line-through">£{selectedBundle.originalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bundle Price</p>
                    <p className="font-bold text-blue-600 text-lg">£{selectedBundle.bundlePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">You Save</p>
                    <p className="font-medium text-green-600">£{selectedBundle.savings.toFixed(2)} ({selectedBundle.discountPercentage}%)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Select Sessions for Each Course</h2>
              <p className="text-gray-600 text-sm mb-6">Please select a session date for each course in the bundle</p>

              <div className="space-y-6">
                {selectedBundle.courses.map((course, index) => {
                  const selectedSessionId = bundleSessionSelections[course.id]
                  const selectedSessionForCourse = course.sessions?.find(s => s.id === selectedSessionId)

                  return (
                    <div key={course.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                              Course {index + 1} of {selectedBundle.courses.length}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatCategoryName(course.category)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>Duration: {course.duration}h</span>
                            <span>Regular Price: £{course.price.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>

                      {selectedSessionForCourse && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <p className="text-sm font-medium text-green-800">✓ Session Selected</p>
                          <p className="text-sm text-green-700">{formatDate(selectedSessionForCourse.startDate)}</p>
                          <p className="text-xs text-green-600">{selectedSessionForCourse.startTime} - {selectedSessionForCourse.endTime}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Available Sessions:</p>
                        {course.sessions && course.sessions.length > 0 ? (
                          <div className="space-y-2">
                            {course.sessions.map((session) => {
                              const spotsLeft = session.availableSpots - session.bookedSpots
                              const isSelected = bundleSessionSelections[course.id] === session.id

                              return (
                                <div
                                  key={session.id}
                                  className={`p-3 border rounded cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50'
                                      : spotsLeft > 0
                                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                      : 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                                  }`}
                                  onClick={() => {
                                    if (spotsLeft > 0) {
                                      setBundleSessionSelections(prev => ({
                                        ...prev,
                                        [course.id]: session.id
                                      }))
                                    }
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-sm">{formatDate(session.startDate)}</p>
                                      <p className="text-xs text-gray-600">
                                        {session.startTime} - {session.endTime}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-xs font-medium ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}
                                      </p>
                                      {isSelected && (
                                        <span className="text-xs text-blue-600 font-medium">✓ Selected</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                            No sessions available for this course yet
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const allSelected = selectedBundle.courses.every(course =>
                      bundleSessionSelections[course.id]
                    )
                    if (!allSelected) {
                      alert('Please select a session for each course')
                      return
                    }
                    setStep('details')
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Continue to Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Session Selection */}
        {step === 'session' && selectedCourse && !selectedBundle && (
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

            {/* Calendar View Toggle */}
            <div className="mb-6 flex justify-center">
              <div className="bg-white rounded-lg shadow-sm p-1 flex space-x-1">
                <button 
                  onClick={() => setCalendarView('single-course')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    calendarView === 'single-course' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Selected Course Only
                </button>
                <button 
                  onClick={() => setCalendarView('all-courses')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    calendarView === 'all-courses' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Courses
                </button>
              </div>
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
                  {calendarView === 'single-course' ? (
                    // Single course sessions
                    selectedCourse.sessions.map((session) => {
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
                    })
                  ) : (
                    // All courses sessions - sorted by date
                    courses.flatMap(course => 
                      course.sessions.map(session => ({ course, session }))
                    ).sort((a, b) => 
                      new Date(a.session.startDate).getTime() - new Date(b.session.startDate).getTime()
                    ).map(({ course, session }) => {
                      const spotsLeft = session.availableSpots - session.bookedSpots
                      const categoryColor = getCourseColor(course.category)
                      return (
                        <div key={session.id} 
                             className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                               spotsLeft > 0 ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' : 'border-red-200 bg-red-50 cursor-not-allowed'
                             }`}
                             onClick={() => {
                               if (spotsLeft > 0) {
                                 setSelectedCourse(course)
                                 handleSessionSelect(session)
                               }
                             }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-lg">{course.title}</p>
                              <span 
                                className="inline-block px-2 py-1 rounded text-xs font-medium text-white mb-2"
                                style={{ backgroundColor: categoryColor }}
                              >
                                {formatCategoryName(course.category)}
                              </span>
                              <p className="font-medium">{formatDate(session.startDate)}</p>
                              <p className="text-sm text-gray-600">
                                {session.startTime} - {session.endTime}
                              </p>
                              <p className="text-sm font-medium text-gray-800">£{course.price.toFixed(0)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}
                              </p>
                              <button 
                                disabled={spotsLeft === 0}
                                className={`mt-2 px-3 py-1 rounded text-sm ${
                                  spotsLeft > 0 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {spotsLeft > 0 ? 'Select' : 'Full'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add-ons Selection (Single Course Only) */}
        {step === 'addons' && selectedCourse && selectedSession && !selectedBundle && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button 
                onClick={() => setStep('session')}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Back to Session Selection
              </button>
              <h1 className="text-3xl font-bold mb-2">Add Extra Training Elements</h1>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium">{selectedCourse.title}</p>
                <p className="text-sm text-gray-600">{formatDate(selectedSession.startDate)}</p>
                <p className="text-sm text-gray-600">Base price: £{selectedCourse.price.toFixed(0)}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Available Add-ons for {formatCategoryName(selectedCourse.category)}</h3>
                <p className="text-gray-600 text-sm">Select additional training elements to enhance your course. Maximum 6 add-ons per booking.</p>
              </div>

              {courseAddons[selectedCourse.category as keyof typeof courseAddons] ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {courseAddons[selectedCourse.category as keyof typeof courseAddons].map((addon) => {
                    const quantity = selectedAddons[addon.id] || 0
                    const maxQuantity = 2 // Maximum quantity per addon
                    
                    return (
                      <div key={addon.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{addon.name}</h4>
                            <p className="text-green-600 font-semibold">+£{addon.price}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                if (quantity > 0) {
                                  setSelectedAddons(prev => ({
                                    ...prev,
                                    [addon.id]: quantity - 1
                                  }))
                                }
                              }}
                              disabled={quantity === 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button
                              onClick={() => {
                                const totalAddons = Object.values(selectedAddons).reduce((sum, qty) => sum + qty, 0)
                                if (quantity < maxQuantity && totalAddons < 6) {
                                  setSelectedAddons(prev => ({
                                    ...prev,
                                    [addon.id]: quantity + 1
                                  }))
                                }
                              }}
                              disabled={quantity >= maxQuantity || Object.values(selectedAddons).reduce((sum, qty) => sum + qty, 0) >= 6}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {quantity > 0 && (
                          <div className="text-sm text-blue-600 font-medium">
                            Subtotal: £{(addon.price * quantity).toFixed(0)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No add-ons available for this course category.</p>
                </div>
              )}

              {/* Add-ons Summary */}
              <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Add-ons Summary</h4>
                {Object.keys(selectedAddons).length === 0 ? (
                  <p className="text-gray-500 text-sm">No add-ons selected</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(selectedAddons).filter(([_, qty]) => qty > 0).map(([addonId, quantity]) => {
                      const addon = courseAddons[selectedCourse.category as keyof typeof courseAddons]?.find(a => a.id === addonId)
                      if (!addon) return null
                      
                      return (
                        <div key={addonId} className="flex justify-between text-sm">
                          <span>{addon.name} × {quantity}</span>
                          <span className="font-medium">£{(addon.price * quantity).toFixed(0)}</span>
                        </div>
                      )
                    })}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Add-ons Total:</span>
                        <span>£{calculateAddonsTotal().toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Course Total:</span>
                        <span>£{(selectedCourse.price + calculateAddonsTotal()).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep('session')}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Sessions
                </button>
                <button
                  onClick={() => setStep('details')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Continue to Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Customer Details */}
        {step === 'details' && (selectedCourse || selectedBundle) && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setStep(selectedBundle ? 'session' : 'addons')}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← Back to {selectedBundle ? 'Session Selection' : 'Add-ons Selection'}
              </button>
              <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
              <div className="bg-blue-50 p-4 rounded-lg">
                {selectedBundle ? (
                  <>
                    <p className="font-medium">{selectedBundle.title}</p>
                    <p className="text-sm text-gray-600">{selectedBundle.courses.length} courses included</p>
                    <div className="mt-2 space-y-1">
                      {selectedBundle.courses.map(course => {
                        const session = course.sessions?.find(s => s.id === bundleSessionSelections[course.id])
                        return session ? (
                          <p key={course.id} className="text-xs text-gray-600">
                            • {course.title}: {formatDate(session.startDate)}
                          </p>
                        ) : null
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{selectedCourse?.title}</p>
                    <p className="text-sm text-gray-600">{selectedSession && formatDate(selectedSession.startDate)}</p>
                  </>
                )}
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
                      <div className="text-sm text-gray-600">
                        Pay £{selectedBundle
                          ? selectedBundle.bundlePrice.toFixed(0)
                          : (selectedCourse ? (selectedCourse.price + calculateAddonsTotal()).toFixed(0) : '0')
                        } now
                      </div>
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
                      <div className="text-sm text-gray-600">
                        Pay £{selectedBundle
                          ? (selectedBundle.bundlePrice * 0.3).toFixed(0)
                          : (selectedCourse ? ((selectedCourse.price + calculateAddonsTotal()) * 0.3).toFixed(0) : '0')
                        } now, remainder before course
                      </div>
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
                  {selectedBundle ? (
                    <>
                      <div className="flex justify-between">
                        <span>Bundle:</span>
                        <span>{selectedBundle.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Courses:</span>
                        <span>{selectedBundle.courses.length} courses</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Original Price:</span>
                        <span className="line-through">£{selectedBundle.originalPrice.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Bundle Price:</span>
                        <span>£{selectedBundle.bundlePrice.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 text-xs">
                        <span>You Save:</span>
                        <span>£{selectedBundle.savings.toFixed(0)} ({selectedBundle.discountPercentage}%)</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs space-y-1 text-gray-600">
                          <p className="font-medium mb-1">Selected Sessions:</p>
                          {selectedBundle.courses.map(course => {
                            const session = course.sessions?.find(s => s.id === bundleSessionSelections[course.id])
                            return session ? (
                              <div key={course.id} className="pl-2">
                                <p className="font-medium">{course.title}</p>
                                <p>{formatDate(session.startDate)}, {session.startTime} - {session.endTime}</p>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Course:</span>
                        <span>{selectedCourse?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>£{selectedCourse?.price.toFixed(0)}</span>
                      </div>
                      {calculateAddonsTotal() > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span>Add-ons:</span>
                            <span>£{calculateAddonsTotal().toFixed(0)}</span>
                          </div>
                          <div className="border-t pt-1">
                            <div className="flex justify-between font-medium">
                              <span>Total Course Price:</span>
                              <span>£{selectedCourse ? (selectedCourse.price + calculateAddonsTotal()).toFixed(0) : '0'}</span>
                            </div>
                          </div>
                        </>
                      )}
                      {selectedSession && (
                        <>
                          <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{formatDate(selectedSession.startDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Time:</span>
                            <span>{selectedSession.startTime} - {selectedSession.endTime}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div className="border-t pt-1">
                    <div className="flex justify-between font-bold">
                      <span>Amount to pay:</span>
                      <span>£{calculateAmount().toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Booking...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 'payment' && (selectedCourse || selectedBundle) && (
          <div className="max-w-2xl mx-auto">
            {bookingResult ? (
              // Payment Success
              <div>
                <h1 className="text-3xl font-bold text-center mb-6">Payment Successful!</h1>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-green-800">Booking Confirmed</h3>
                      <p className="text-sm text-green-600">Booking ID: {bookingResult.bookingId}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {selectedBundle ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-green-700">Bundle:</span>
                          <span className="font-medium text-green-900">{selectedBundle.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Courses:</span>
                          <span className="font-medium text-green-900">{selectedBundle.courses.length} courses</span>
                        </div>
                        <div className="border-t border-green-200 pt-2 mt-2">
                          <p className="text-xs text-green-700 font-medium mb-2">Your Sessions:</p>
                          {selectedBundle.courses.map(course => {
                            const session = course.sessions?.find(s => s.id === bundleSessionSelections[course.id])
                            return session ? (
                              <div key={course.id} className="mb-2 pl-2">
                                <p className="font-medium text-green-800">{course.title}</p>
                                <p className="text-xs text-green-700">{formatDate(session.startDate)}, {session.startTime} - {session.endTime}</p>
                              </div>
                            ) : null
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-green-700">Course:</span>
                          <span className="font-medium text-green-900">{selectedCourse?.title}</span>
                        </div>
                        {selectedSession && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-green-700">Date:</span>
                              <span className="font-medium text-green-900">{formatDate(selectedSession.startDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Time:</span>
                              <span className="font-medium text-green-900">{selectedSession.startTime} - {selectedSession.endTime}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="flex justify-between border-t border-green-200 pt-2">
                      <span className="text-green-700">Amount Paid:</span>
                      <span className="font-medium text-green-900">£{paymentData?.amount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Next Steps</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• You will receive a confirmation email with course details</p>
                    <p>• Course materials will be provided on the day</p>
                    <p>• Please arrive 15 minutes early for registration</p>
                    <p>• Bring a valid photo ID on the course day</p>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <button
                    onClick={() => {
                      setStep('course')
                      setSelectedCourse(null)
                      setSelectedSession(null)
                      setSelectedAddons({})
                      setBookingResult(null)
                      setPaymentData(null)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium transition-colors"
                  >
                    Book Another Course
                  </button>
                  
                  <div>
                    <Link href="/courses" className="text-blue-600 hover:text-blue-800">
                      ← Back to Courses
                    </Link>
                  </div>
                </div>
              </div>
            ) : paymentData ? (
              // Payment Form
              <div>
                <div className="mb-6">
                  <button
                    onClick={() => setStep('details')}
                    className="text-blue-600 hover:text-blue-800 mb-4"
                  >
                    ← Back to Booking Details
                  </button>
                  <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {selectedBundle ? (
                      <>
                        <p className="font-medium">{selectedBundle.title}</p>
                        <p className="text-sm text-gray-600">{selectedBundle.courses.length} courses - £{selectedBundle.bundlePrice.toFixed(0)}</p>
                        <p className="text-xs text-green-600">Save £{selectedBundle.savings.toFixed(0)} with this bundle!</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{selectedCourse?.title}</p>
                        {selectedSession && (
                          <>
                            <p className="text-sm text-gray-600">{formatDate(selectedSession.startDate)}</p>
                            <p className="text-sm text-gray-600">{selectedSession.startTime} - {selectedSession.endTime}</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <PaymentForm
                  amount={paymentData.amount}
                  courseTitle={paymentData.courseTitle}
                  customerName={paymentData.customerName}
                  bookingData={paymentData.bookingData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            ) : (
              // Loading state
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Preparing payment...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Copyright Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {tenant?.name || 'TrainKit'}. All Rights Reserved.</p>
        <p className="mt-1">Powered by <span className="font-semibold">TrainKit</span> Training Management Platform</p>
      </footer>
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking form...</p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}