'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, Award, MapPin, Clock, Star, Trophy, Target, TrendingUp, Zap, Activity, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import TierProgressionShowcase from '../components/TierProgressionShowcase'
import BundleOffers from '../components/BundleOffers'

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

interface TenantInfo {
  name: string
  slug: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  businessType?: string
  city?: string
  county?: string
  address?: string
  heroHeading?: string
  heroSubheading?: string
  email?: string
  phone?: string
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)

  useEffect(() => {
    // Check if we're on the main domain (not a tenant subdomain)
    const hostname = window.location.hostname
    const isMainDomain = hostname === 'trainkit.co.uk' ||
                        hostname === 'www.trainkit.co.uk' ||
                        hostname.includes('vercel.app')

    if (isMainDomain) {
      // Redirect to admin login for main domain
      window.location.href = '/admin/login'
      return
    }

    fetchTenantInfo()
    fetchCourses()
    checkStudentAuth()
  }, [])

  const fetchTenantInfo = async () => {
    try {
      // Get tenant slug from hostname
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]

      const response = await fetch(`/api/tenants/${subdomain}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.tenant) {
          setTenantInfo(data.tenant)
        }
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
    }
  }

  const checkStudentAuth = async () => {
    try {
      const response = await fetch('/api/student/profile')
      if (response.ok) {
        const profile = await response.json()
        setIsStudentLoggedIn(true)
        setStudentName(profile.firstName || 'Student')
      }
    } catch (error) {
      // Student not logged in
      setIsStudentLoggedIn(false)
    }
  }

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

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return 'Gas cooker training, gas fires training and testing, new gas training for beginners'
      case 'FGAS_AIR_CONDITIONING': return 'F-Gas certification, commercial refrigeration, marine systems, air conditioning'
      case 'HEAT_PUMP': return 'Installation, servicing and maintenance of heat pump systems'
      case 'OFTEC': return 'Pressure jet boilers and vaporizing appliances like AGA, Rayburn, Esse'
      case 'LPG': return 'Covering permanent, mobile homes, park homes, leisure vehicles, Widney fires'
      case 'WATER': return 'Water heating systems, legionella awareness, heat pump water heating'
      case 'COMMERCIAL_CATERING': return 'Commercial kitchen gas systems, ovens, fryers, griddles'
      case 'COMMERCIAL_LAUNDRY': return 'Commercial laundry gas equipment, washers, dryers'
      case 'COMMERCIAL_GAS': return 'Commercial gas installations and assessments'
      case 'COMMERCIAL_CORE': return 'Core commercial gas training fundamentals'
      case 'VAPORIZING': return 'Specialized vaporizing equipment and systems'
      default: return 'Professional training and certification'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return '🔥'
      case 'FGAS_AIR_CONDITIONING': return '❄️'
      case 'HEAT_PUMP': return '🌡️'
      case 'OFTEC': return '🛢️'
      case 'LPG': return '⚡'
      case 'WATER': return '💧'
      case 'COMMERCIAL_CATERING': return '🍳'
      case 'COMMERCIAL_LAUNDRY': return '🧺'
      case 'COMMERCIAL_GAS': return '🏭'
      case 'COMMERCIAL_CORE': return '⚙️'
      case 'VAPORIZING': return '💨'
      default: return '📚'
    }
  }

  const getCategoryLogo = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return '/images/logos/gas-safe.svg'
      case 'OFTEC': return '/images/logos/oftec.svg'
      default: return null
    }
  }

  const getCategoryUrlParam = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return 'gas_safe'
      case 'HEAT_PUMP': return 'heat_pump'
      case 'OFTEC': return 'oftec'
      case 'LPG': return 'lpg'
      case 'FGAS_AIR_CONDITIONING': return 'fgas_air_conditioning'
      case 'COMMERCIAL_CATERING': return 'commercial_catering'
      case 'COMMERCIAL_LAUNDRY': return 'commercial_laundry'
      case 'COMMERCIAL_GAS': return 'commercial_gas'
      case 'COMMERCIAL_CORE': return 'commercial_core'
      case 'WATER': return 'water'
      case 'VAPORIZING': return 'vaporizing'
      default: return 'all'
    }
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className="text-white"
        style={{
          background: tenantInfo
            ? `linear-gradient(135deg, ${tenantInfo.primaryColor} 0%, ${tenantInfo.secondaryColor} 100%)`
            : 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {tenantInfo?.logo ? (
                <div className="bg-white rounded-lg p-2">
                  <Image
                    src={tenantInfo.logo}
                    alt={tenantInfo.name}
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="bg-white/10 rounded px-3 py-1">
                  <span className="text-xl font-bold !text-white">
                    {tenantInfo?.name || 'Loading...'}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-light !text-white">
                {tenantInfo?.name ? `${tenantInfo.name} Training Center` : 'Professional Training'}
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/courses" className="hover:text-blue-200">Courses</Link>
              <Link href="/booking" className="hover:text-blue-200">Book Now</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact</Link>
              {isStudentLoggedIn ? (
                <>
                  <Link href="/student/dashboard" className="flex items-center bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg font-medium transition-colors">
                    <User className="w-4 h-4 mr-2" />
                    Welcome, {studentName}
                  </Link>
                  <Link href="/student/dashboard" className="flex items-center bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-300 transition-colors">
                    <Trophy className="w-4 h-4 mr-1" />
                    <span>My Dashboard</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/student/login" className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-medium transition-colors">Student Login</Link>
                  <Link href="/student-dashboard" className="flex items-center bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-300 transition-colors">
                    <Trophy className="w-4 h-4 mr-1" />
                    <span>Live Progress</span>
                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-blue-800 to-blue-600 text-white py-20 min-h-[600px] flex items-center"
        style={{
          backgroundImage: "url('/images/logos/gas traing in devon.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-blue-900/70"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Training Centre Logo/Branding */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-8 py-6 shadow-lg">
              <h1 className="text-4xl font-bold text-white mb-2">
                {tenantInfo?.name || 'Loading...'}
              </h1>
              <p className="text-lg text-white/90 mb-1">TRAINING CENTRE</p>
              <p className="text-sm text-white/80">
                {tenantInfo?.businessType || 'Professional Training'}
                {tenantInfo?.city && ` • ${tenantInfo.city}`}
                {!tenantInfo?.city && tenantInfo?.county && ` • ${tenantInfo.county}`}
              </p>
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl font-light mb-6 !text-white">
            {tenantInfo?.heroHeading || tenantInfo?.businessType || 'Professional Gas & Heating Training'}
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            {tenantInfo?.heroSubheading || `Complete training management from installation through to ongoing maintenance and compliance. ${tenantInfo?.city ? `${tenantInfo.city}'s` : 'Your'} premier training centre for Gas Safe, Heat Pump, OFTEC, and LPG qualifications with flexible scheduling.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              View Courses
            </Link>
            <Link href="/booking" className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-800 px-8 py-3 rounded-lg font-semibold transition-colors">
              Book Training
            </Link>
          </div>
        </div>
      </section>

      {/* Live Achievement Feed */}
      <section className="py-12 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-yellow-300 mr-2 animate-pulse" />
              <h3 className="text-2xl font-bold text-white">🔥 Live Student Achievements</h3>
              <Zap className="w-6 h-6 text-yellow-300 ml-2 animate-pulse" />
            </div>
            <p className="text-green-100 text-sm">
              See what other students are achieving right now • Join the competition!
            </p>
          </div>

          {/* Scrolling Achievement Feed */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll gap-6" style={{
              animation: 'scroll 25s linear infinite',
              width: 'calc(200% + 24px)'
            }}>
              {/* First set of achievements */}
              <div className="flex gap-6 min-w-full">
                {[
                  { emoji: '👨‍🔧', name: 'James W.', achievement: 'Just earned GOLD status!', detail: '4 Gas Safe qualifications', time: '2 mins ago', badge: '🥇' },
                  { emoji: '👩‍💼', name: 'Sarah K.', achievement: 'Completed Heat Pump Master', detail: '£52k salary increase!', time: '5 mins ago', badge: '🏆' },
                  { emoji: '👨‍🏭', name: 'Mike R.', achievement: 'ELITE Multi-Trade Expert', detail: '6 categories mastered', time: '8 mins ago', badge: '🏆' },
                  { emoji: '👩‍🔧', name: 'Emma L.', achievement: 'First OFTEC certification', detail: 'Started own business!', time: '12 mins ago', badge: '🥉' },
                  { emoji: '👨‍💻', name: 'David P.', achievement: 'Commercial Gas certified', detail: 'Promoted to supervisor', time: '18 mins ago', badge: '🥈' },
                  { emoji: '👩‍🏫', name: 'Lisa M.', achievement: 'F-Gas Air Con expert', detail: '3rd category completed', time: '22 mins ago', badge: '🥈' },
                  { emoji: '👨‍🚀', name: 'Tom B.', achievement: 'LPG Installation pro', detail: 'Elite status next!', time: '25 mins ago', badge: '🥇' },
                  { emoji: '👩‍🎯', name: 'Amy S.', achievement: 'Water Regulations master', detail: 'Cross-training bonus', time: '28 mins ago', badge: '🥇' },
                  { emoji: '👨‍🎨', name: 'Chris D.', achievement: 'Vaporizing specialist', detail: '5 courses completed', time: '32 mins ago', badge: '🥇' },
                  { emoji: '👩‍💪', name: 'Jenny F.', achievement: 'Commercial Laundry pro', detail: 'New career path!', time: '35 mins ago', badge: '🥈' }
                ].map((student, index) => (
                  <div key={index} className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg p-4 w-72 border border-white/30">
                    <div className="flex items-center mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl mr-3">
                        {student.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-bold text-white text-sm">{student.name}</span>
                          <span className="ml-2 text-lg">{student.badge}</span>
                        </div>
                        <p className="text-green-100 text-xs">{student.time}</p>
                      </div>
                    </div>
                    <div className="text-white">
                      <p className="font-semibold text-sm mb-1">{student.achievement}</p>
                      <p className="text-green-100 text-xs">{student.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex gap-6 min-w-full">
                {[
                  { emoji: '👨‍🔧', name: 'James W.', achievement: 'Just earned GOLD status!', detail: '4 Gas Safe qualifications', time: '2 mins ago', badge: '🥇' },
                  { emoji: '👩‍💼', name: 'Sarah K.', achievement: 'Completed Heat Pump Master', detail: '£52k salary increase!', time: '5 mins ago', badge: '🏆' },
                  { emoji: '👨‍🏭', name: 'Mike R.', achievement: 'ELITE Multi-Trade Expert', detail: '6 categories mastered', time: '8 mins ago', badge: '🏆' },
                  { emoji: '👩‍🔧', name: 'Emma L.', achievement: 'First OFTEC certification', detail: 'Started own business!', time: '12 mins ago', badge: '🥉' },
                  { emoji: '👨‍💻', name: 'David P.', achievement: 'Commercial Gas certified', detail: 'Promoted to supervisor', time: '18 mins ago', badge: '🥈' },
                  { emoji: '👩‍🏫', name: 'Lisa M.', achievement: 'F-Gas Air Con expert', detail: '3rd category completed', time: '22 mins ago', badge: '🥈' },
                  { emoji: '👨‍🚀', name: 'Tom B.', achievement: 'LPG Installation pro', detail: 'Elite status next!', time: '25 mins ago', badge: '🥇' },
                  { emoji: '👩‍🎯', name: 'Amy S.', achievement: 'Water Regulations master', detail: 'Cross-training bonus', time: '28 mins ago', badge: '🥇' },
                  { emoji: '👨‍🎨', name: 'Chris D.', achievement: 'Vaporizing specialist', detail: '5 courses completed', time: '32 mins ago', badge: '🥇' },
                  { emoji: '👩‍💪', name: 'Jenny F.', achievement: 'Commercial Laundry pro', detail: 'New career path!', time: '35 mins ago', badge: '🥈' }
                ].map((student, index) => (
                  <div key={`dup-${index}`} className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg p-4 w-72 border border-white/30">
                    <div className="flex items-center mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl mr-3">
                        {student.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-bold text-white text-sm">{student.name}</span>
                          <span className="ml-2 text-lg">{student.badge}</span>
                        </div>
                        <p className="text-green-100 text-xs">{student.time}</p>
                      </div>
                    </div>
                    <div className="text-white">
                      <p className="font-semibold text-sm mb-1">{student.achievement}</p>
                      <p className="text-green-100 text-xs">{student.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
              <Trophy className="w-5 h-5 text-yellow-300 mr-2" />
              <span className="text-white font-semibold mr-4">Want to see YOUR achievement here?</span>
              <div className="flex gap-3">
                <Link 
                  href="/courses" 
                  className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-100 transition-colors"
                >
                  Start Learning
                </Link>
                <Link 
                  href="/student-dashboard" 
                  className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Track Progress
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom scrolling animation styles */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      {/* Tier Progression Showcase */}
      <TierProgressionShowcase />

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose Our Training Platform?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-3">Flexible Scheduling</h4>
              <p className="text-gray-600">Short notice bookings available with weekend and evening sessions to fit your schedule.</p>
            </div>
            <div className="text-center p-6">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-3">Complete Training Solution</h4>
              <p className="text-gray-600">From installation to ongoing maintenance and compliance - we're your one-stop software house for comprehensive training management.</p>
            </div>
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-3">Local & Friendly</h4>
              <p className="text-gray-600">
                {tenantInfo?.city
                  ? `Based in ${tenantInfo.city}, providing personal service and local expertise.`
                  : tenantInfo?.county
                  ? `Based in ${tenantInfo.county}, providing personal service and local expertise.`
                  : 'Providing personal service and local expertise.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-4">Available Training Courses</h3>
          <p className="text-center text-gray-600 mb-12">Professional gas, heating, and renewable energy training</p>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : (
            <>
              {/* Course Categories */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {Object.entries(
                  courses.reduce((acc, course) => {
                    if (!acc[course.category]) {
                      acc[course.category] = []
                    }
                    acc[course.category].push(course)
                    return acc
                  }, {} as Record<string, Course[]>)
                ).map(([category, coursesInCategory]) => (
                  <div key={category} className="bg-white p-6 rounded-lg shadow-lg border hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">{getCategoryIcon(category)}</div>
                      {getCategoryLogo(category) && (
                        <Image
                          src={getCategoryLogo(category)!}
                          alt={`${formatCategoryName(category)} certification logo`}
                          width={60}
                          height={30}
                          className="object-contain"
                        />
                      )}
                    </div>
                    <h4 className="text-xl font-semibold mb-3">{formatCategoryName(category)}</h4>
                    <p className="text-gray-600 mb-4 text-sm">{getCategoryDescription(category)}</p>
                    <div className="mb-4">
                      <span className="text-sm text-blue-600 font-medium">
                        {coursesInCategory.length} course{coursesInCategory.length !== 1 ? 's' : ''} available
                      </span>
                    </div>
                    <Link href={`/courses?category=${getCategoryUrlParam(category)}`} className="text-blue-600 hover:text-blue-800 font-semibold">
                      View Courses →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Featured Courses */}
              {courses.length > 0 && (
                <div>
                  <h4 className="text-2xl font-bold text-center mb-8">Featured Courses</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.slice(0, 6).map((course) => (
                      <div key={course.id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{getCategoryIcon(course.category)}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {formatCategoryName(course.category)}
                          </span>
                        </div>
                        <h5 className="text-lg font-semibold mb-2">{course.title}</h5>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{course.duration}h</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>Max {course.maxStudents}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">£{course.price}</span>
                          <Link 
                            href={`/booking?course=${course.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link 
                      href="/courses" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      View All Courses
                    </Link>
                  </div>
                </div>
              )}

              {courses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No courses available at the moment.</p>
                  <p className="text-gray-500 text-sm mt-2">Please check back later for updated course listings.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Bundle Offers */}
      <BundleOffers />

      {/* Certifications Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-4">Official Training Partner</h3>
          <p className="text-center text-gray-600 mb-12">Approved and certified by industry leaders</p>
          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <Image
                src="/images/logos/gas-safe.svg"
                alt="Gas Safe Register approved training centre"
                width={120}
                height={60}
                className="object-contain mx-auto mb-4"
              />
              <p className="text-sm text-gray-600">Gas Safe Register<br />Approved Training Centre</p>
            </div>
            <div className="text-center">
              <Image
                src="/images/logos/oftec.svg"
                alt="OFTEC approved training centre"
                width={120}
                height={60}
                className="object-contain mx-auto mb-4"
              />
              <p className="text-sm text-gray-600">OFTEC Approved<br />Training Centre</p>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Achievers Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-orange-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
              <h3 className="text-3xl font-bold text-gray-900">Platform Success Stories</h3>
              <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet our exceptional students who've achieved multiple qualifications and transformed their careers
            </p>
          </div>

          {/* Elite Students Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Student 1 - Multi-Trade Master */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  🏆 ELITE
                </div>
              </div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                  JS
                </div>
                <h4 className="text-xl font-bold text-gray-900">John Smith</h4>
                <p className="text-gray-600">Multi-Trade Master</p>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <Award className="w-4 h-4 text-green-500 mr-2" />
                  <span className="font-semibold text-gray-700">6 Qualifications</span>
                </div>
                <div className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-gray-600">Gas Safe + Heat Pump + OFTEC</span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-600">£47k average salary increase</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 text-sm italic text-gray-700">
                "The progression system kept me motivated. Each new qualification opened doors I never imagined!"
              </div>
            </div>

            {/* Student 2 - Heat Pump Specialist */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  🥇 GOLD
                </div>
              </div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                  SJ
                </div>
                <h4 className="text-xl font-bold text-gray-900">Sarah Jones</h4>
                <p className="text-gray-600">Renewable Energy Expert</p>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <Award className="w-4 h-4 text-green-500 mr-2" />
                  <span className="font-semibold text-gray-700">5 Qualifications</span>
                </div>
                <div className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-gray-600">Heat Pump + F-Gas Certified</span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-600">Started own renewable business</span>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 text-sm italic text-gray-700">
                "Elite status helped me become the go-to expert for heat pump installations in my area."
              </div>
            </div>

            {/* Student 3 - Commercial Specialist */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  🥇 GOLD
                </div>
              </div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                  MT
                </div>
                <h4 className="text-xl font-bold text-gray-900">Mike Thompson</h4>
                <p className="text-gray-600">Commercial Gas Master</p>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <Award className="w-4 h-4 text-green-500 mr-2" />
                  <span className="font-semibold text-gray-700">4 Qualifications</span>
                </div>
                <div className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-gray-600">Commercial Catering + Core</span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-gray-600">Promoted to Head Engineer</span>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 text-sm italic text-gray-700">
                "The commercial qualifications made me indispensable. My company values my expertise!"
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-yellow-200">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Join Our Elite Achievers</h4>
              <p className="text-gray-600 mb-6">
                Start your journey to elite status. Each qualification gets you closer to career transformation and higher earnings.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/courses" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  View All Courses
                </Link>
                <Link 
                  href="/booking" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Start Your Journey
                </Link>
                <Link 
                  href="/student-dashboard" 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Track Progress
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Training?</h3>
          <p className="text-xl mb-8">Book your course today with our easy online booking system</p>
          <Link href="/booking" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-lg font-semibold transition-colors inline-block">
            Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {tenantInfo?.name || 'Training Centre'}
              </h4>
              <p className="text-gray-300">
                {tenantInfo?.businessType || 'Professional training'}
                {tenantInfo?.city && ` in ${tenantInfo.city}`}
                {!tenantInfo?.city && tenantInfo?.county && ` in ${tenantInfo.county}`}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              {tenantInfo?.city && tenantInfo?.county && (
                <p className="text-gray-300">{tenantInfo.city}, {tenantInfo.county}</p>
              )}
              {tenantInfo?.city && !tenantInfo?.county && (
                <p className="text-gray-300">{tenantInfo.city}</p>
              )}
              {!tenantInfo?.city && tenantInfo?.county && (
                <p className="text-gray-300">{tenantInfo.county}</p>
              )}
              {tenantInfo?.email && (
                <p className="text-gray-300">Email: {tenantInfo.email}</p>
              )}
              {tenantInfo?.phone && (
                <p className="text-gray-300">Phone: {tenantInfo.phone}</p>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/courses" className="block text-gray-300 hover:text-white">Courses</Link>
                <Link href="/booking" className="block text-gray-300 hover:text-white">Book Training</Link>
                <Link href="/contact" className="block text-gray-300 hover:text-white">Contact</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 {tenantInfo?.name || 'Training Centre'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}