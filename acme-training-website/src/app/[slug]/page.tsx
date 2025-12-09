'use client'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, Award, MapPin, Clock, Star, Trophy, Target, TrendingUp, Zap, Activity } from 'lucide-react'
import TierProgressionShowcase from '../../components/TierProgressionShowcase'
import BundleOffers from '../../components/BundleOffers'
import { useEffect, useState } from 'react'

interface TenantPageProps {
  params: Promise<{
    slug: string
  }>
}

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

export default function TenantPage({ params }: TenantPageProps) {
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<string>('')

  useEffect(() => {
    async function initializeAndFetch() {
      try {
        const resolvedParams = await params
        const currentSlug = resolvedParams.slug
        setSlug(currentSlug)

        const response = await fetch(`/api/tenant/${currentSlug}`)
        if (response.ok) {
          const data = await response.json()
          setTenant(data.tenant)
        } else {
          setTenant(null)
        }
      } catch (error) {
        console.error('Error fetching tenant:', error)
        setTenant(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAndFetch()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!tenant) {
    notFound()
  }

  // Transform courses to match the expected format
  const courses: Course[] = tenant.courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description || '',
    category: course.category || 'GENERAL',
    duration: course.duration || 8,
    price: course.price || 0,
    maxStudents: course.maxStudents || 12,
    sessions: course.sessions.map(session => ({
      id: session.id,
      startDate: typeof session.startDate === 'string' ? session.startDate : new Date(session.startDate).toISOString(),
      endDate: typeof session.endDate === 'string' ? session.endDate : new Date(session.endDate).toISOString(),
      availableSpots: session.maxStudents - session.currentStudents,
      bookedSpots: session.currentStudents
    }))
  }))

  // Helper functions from main page
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

  // Tenant-specific customizations
  const tenantName = tenant.name
  const tenantCity = tenant.city || tenant.county || 'Your Area'
  const businessTypeFormatted = tenant.businessType || 'Professional Training'
  const heroHeading = tenant.heroHeading || `Professional ${businessTypeFormatted} in ${tenantCity}`
  const heroSubheading = tenant.heroSubheading || 'Expert training courses with flexible booking and industry-leading certification'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="text-white" style={{ backgroundColor: tenant.primaryColor || '#1e3a8a' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded px-3 py-1">
                <span className="text-xl font-bold">{tenantName.split(' ')[0]}</span>
              </div>
              <h1 className="text-2xl font-light text-white">{tenantName}</h1>
            </div>
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href={`/${slug}/courses`} className="hover:text-blue-200">Courses</Link>
              <Link href={`/${slug}/booking`} className="hover:text-blue-200">Book Now</Link>
              <Link href={`/${slug}/contact`} className="hover:text-blue-200">Contact</Link>
              <Link href={`/${slug}/student/login`} className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-medium transition-colors">Student Login</Link>
              <Link href={`/${slug}/student-dashboard`} className="flex items-center bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-300 transition-colors">
                <Trophy className="w-4 h-4 mr-1" />
                <span>Live Progress</span>
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative text-white py-20 min-h-[600px] flex items-center"
        style={{
          background: `linear-gradient(to right, ${tenant.primaryColor || '#1e40af'}, ${tenant.secondaryColor || '#dc2626'})`,
          backgroundImage: "url('/images/logos/gas traing in devon.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0" style={{ backgroundColor: `${tenant.primaryColor || '#1e3a8a'}70` }}></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Tenant Logo */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-8 py-6 shadow-lg">
              <h1 className="text-4xl font-bold text-white mb-2">{tenantName.split(' ')[0].toUpperCase()}</h1>
              <p className="text-lg text-white/90 mb-1">TRAINING CENTRE</p>
              <p className="text-sm text-white/80">{businessTypeFormatted} • {tenantCity}</p>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-light mb-6">
            {heroHeading}
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            {heroSubheading}. {tenantCity}'s premier training centre with flexible scheduling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${slug}/courses`} className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              View Courses
            </Link>
            <Link href={`/${slug}/booking`} className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-800 px-8 py-3 rounded-lg font-semibold transition-colors">
              Book Training
            </Link>
          </div>
        </div>
      </section>

      {/* Live Achievement Feed - Customized for tenant */}
      <section className="py-12 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-yellow-300 mr-2 animate-pulse" />
              <h3 className="text-2xl font-bold text-white">🔥 Live Student Achievements at {tenantName}</h3>
              <Zap className="w-6 h-6 text-yellow-300 ml-2 animate-pulse" />
            </div>
            <p className="text-green-100 text-sm">
              See what {tenantName} students are achieving right now • Join the competition!
            </p>
          </div>

          {/* Achievement Feed with tenant branding */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll gap-6" style={{
              animation: 'scroll 25s linear infinite',
              width: 'calc(200% + 24px)'
            }}>
              {/* Achievements customized for tenant */}
              <div className="flex gap-6 min-w-full">
                {[
                  { emoji: '👨‍🔧', name: 'James W.', achievement: 'Just earned GOLD status!', detail: `4 ${businessTypeFormatted} qualifications`, time: '2 mins ago', badge: '🥇' },
                  { emoji: '👩‍💼', name: 'Sarah K.', achievement: 'Completed certification', detail: '£52k salary increase!', time: '5 mins ago', badge: '🏆' },
                  { emoji: '👨‍🏭', name: 'Mike R.', achievement: 'ELITE Multi-Trade Expert', detail: '6 categories mastered', time: '8 mins ago', badge: '🏆' },
                  { emoji: '👩‍🔧', name: 'Emma L.', achievement: 'First certification', detail: 'Started own business!', time: '12 mins ago', badge: '🥉' },
                  { emoji: '👨‍💻', name: 'David P.', achievement: 'Advanced certified', detail: 'Promoted to supervisor', time: '18 mins ago', badge: '🥈' },
                  { emoji: '👩‍🏫', name: 'Lisa M.', achievement: 'Specialist qualification', detail: '3rd category completed', time: '22 mins ago', badge: '🥈' },
                  { emoji: '👨‍🚀', name: 'Tom B.', achievement: 'Professional status', detail: 'Elite status next!', time: '25 mins ago', badge: '🥇' },
                  { emoji: '👩‍🎯', name: 'Amy S.', achievement: 'Expert certification', detail: 'Cross-training bonus', time: '28 mins ago', badge: '🥇' },
                  { emoji: '👨‍🎨', name: 'Chris D.', achievement: 'Master qualification', detail: '5 courses completed', time: '32 mins ago', badge: '🥇' },
                  { emoji: '👩‍💪', name: 'Jenny F.', achievement: 'Professional certified', detail: 'New career path!', time: '35 mins ago', badge: '🥈' }
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
              {/* Duplicate for seamless scroll */}
              <div className="flex gap-6 min-w-full">
                {[
                  { emoji: '👨‍🔧', name: 'James W.', achievement: 'Just earned GOLD status!', detail: `4 ${businessTypeFormatted} qualifications`, time: '2 mins ago', badge: '🥇' },
                  { emoji: '👩‍💼', name: 'Sarah K.', achievement: 'Completed certification', detail: '£52k salary increase!', time: '5 mins ago', badge: '🏆' },
                  { emoji: '👨‍🏭', name: 'Mike R.', achievement: 'ELITE Multi-Trade Expert', detail: '6 categories mastered', time: '8 mins ago', badge: '🏆' },
                  { emoji: '👩‍🔧', name: 'Emma L.', achievement: 'First certification', detail: 'Started own business!', time: '12 mins ago', badge: '🥉' },
                  { emoji: '👨‍💻', name: 'David P.', achievement: 'Advanced certified', detail: 'Promoted to supervisor', time: '18 mins ago', badge: '🥈' },
                  { emoji: '👩‍🏫', name: 'Lisa M.', achievement: 'Specialist qualification', detail: '3rd category completed', time: '22 mins ago', badge: '🥈' },
                  { emoji: '👨‍🚀', name: 'Tom B.', achievement: 'Professional status', detail: 'Elite status next!', time: '25 mins ago', badge: '🥇' },
                  { emoji: '👩‍🎯', name: 'Amy S.', achievement: 'Expert certification', detail: 'Cross-training bonus', time: '28 mins ago', badge: '🥇' },
                  { emoji: '👨‍🎨', name: 'Chris D.', achievement: 'Master qualification', detail: '5 courses completed', time: '32 mins ago', badge: '🥇' },
                  { emoji: '👩‍💪', name: 'Jenny F.', achievement: 'Professional certified', detail: 'New career path!', time: '35 mins ago', badge: '🥈' }
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
              <span className="text-white font-semibold mr-4" style={{ color: 'white !important' }}>Want to see YOUR achievement here?</span>
              <div className="flex gap-3">
                <Link 
                  href={`/${slug}/courses`}
                  className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-100 transition-colors"
                >
                  Start Learning
                </Link>
                <Link 
                  href={`/${slug}/student-dashboard`}
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

      {/* Live Achievement Feed */}
      <section className="py-16 overflow-hidden" style={{ backgroundColor: tenant.primaryColor || '#1e3a8a' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="text-2xl font-bold text-white">🔥 Live Student Achievements at {tenantName}</h3>
              <div className="flex items-center">
                <span className="text-white font-semibold mr-2">Live Progress</span>
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>
              </div>
            </div>
            <p className="text-white text-opacity-90">See what our students are achieving right now!</p>
          </div>

          {/* Scrolling Achievement Feed */}
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0">
              {/* First set of achievements */}
              <div className="flex gap-4 animate-scroll-left">
                {[
                  { emoji: '👨‍🔧', name: 'James W.', achievement: 'Just earned GOLD status!', detail: `4 ${businessTypeFormatted} qualifications`, time: '2 mins ago', badge: '🥇' },
                  { emoji: '👩‍💼', name: 'Sarah K.', achievement: `Completed ${businessTypeFormatted} Master`, detail: '£52k salary increase!', time: '5 mins ago', badge: '🏆' },
                  { emoji: '👨‍🏭', name: 'Mike R.', achievement: 'ELITE Multi-Trade Expert', detail: '6 categories mastered', time: '8 mins ago', badge: '🏆' },
                  { emoji: '👩‍🔧', name: 'Emma L.', achievement: `First ${businessTypeFormatted} certification`, detail: 'Started own business!', time: '12 mins ago', badge: '🥉' },
                  { emoji: '👨‍💻', name: 'David P.', achievement: `${businessTypeFormatted} certified`, detail: 'Promoted to supervisor', time: '18 mins ago', badge: '🥈' },
                  { emoji: '👩‍🏫', name: 'Lisa M.', achievement: `${businessTypeFormatted} expert`, detail: '3rd category completed', time: '22 mins ago', badge: '🥈' },
                  { emoji: '👨‍🚀', name: 'Tom B.', achievement: `${businessTypeFormatted} pro`, detail: 'Elite status next!', time: '25 mins ago', badge: '🥇' },
                  { emoji: '👩‍🎯', name: 'Amy S.', achievement: `${businessTypeFormatted} master`, detail: 'Cross-training bonus', time: '28 mins ago', badge: '🥇' }
                ].map((student, index) => (
                  <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-w-72 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{student.emoji}</span>
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-xs text-white text-opacity-70">{student.time}</p>
                        </div>
                      </div>
                      <span className="text-xl">{student.badge}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1 text-white">{student.achievement}</p>
                      <p className="text-xs text-white text-opacity-80">{student.detail}</p>
                    </div>
                  </div>
                ))}
                
                {/* Duplicate for seamless loop */}
                {[
                  { emoji: '👨‍🔧', name: 'James W.', achievement: 'Just earned GOLD status!', detail: `4 ${businessTypeFormatted} qualifications`, time: '2 mins ago', badge: '🥇' },
                  { emoji: '👩‍💼', name: 'Sarah K.', achievement: `Completed ${businessTypeFormatted} Master`, detail: '£52k salary increase!', time: '5 mins ago', badge: '🏆' },
                  { emoji: '👨‍🏭', name: 'Mike R.', achievement: 'ELITE Multi-Trade Expert', detail: '6 categories mastered', time: '8 mins ago', badge: '🏆' },
                  { emoji: '👩‍🔧', name: 'Emma L.', achievement: `First ${businessTypeFormatted} certification`, detail: 'Started own business!', time: '12 mins ago', badge: '🥉' },
                  { emoji: '👨‍💻', name: 'David P.', achievement: `${businessTypeFormatted} certified`, detail: 'Promoted to supervisor', time: '18 mins ago', badge: '🥈' },
                  { emoji: '👩‍🏫', name: 'Lisa M.', achievement: `${businessTypeFormatted} expert`, detail: '3rd category completed', time: '22 mins ago', badge: '🥈' },
                  { emoji: '👨‍🚀', name: 'Tom B.', achievement: `${businessTypeFormatted} pro`, detail: 'Elite status next!', time: '25 mins ago', badge: '🥇' },
                  { emoji: '👩‍🎯', name: 'Amy S.', achievement: `${businessTypeFormatted} master`, detail: 'Cross-training bonus', time: '28 mins ago', badge: '🥇' }
                ].map((student, index) => (
                  <div key={`duplicate-${index}`} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 min-w-72 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{student.emoji}</span>
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-xs text-white text-opacity-70">{student.time}</p>
                        </div>
                      </div>
                      <span className="text-xl">{student.badge}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1 text-white">{student.achievement}</p>
                      <p className="text-xs text-white text-opacity-80">{student.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* CTA Banner */}
          <div className="mt-8 text-center bg-black bg-opacity-20 rounded-xl py-4 px-6 backdrop-blur-sm">
            <span className="text-white font-semibold mr-4" style={{ color: 'white !important' }}>Want to see YOUR achievement here?</span>
            <Link 
              href={`/${slug}/courses`} 
              className="bg-gray-100 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors inline-block"
              style={{ backgroundColor: '#f3f4f6 !important', color: '#111827 !important' }}
            >
              View Our Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* Tier Progression Showcase */}
      <TierProgressionShowcase />

      {/* Stats Section - Training Center Credibility */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Trusted by Professionals Across {tenantCity}</h3>
            <p className="text-xl text-gray-600">Join thousands who've advanced their careers with {tenantName}</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor || '#2563eb' }}>2,500+</div>
              <div className="text-gray-600 font-semibold">Students Trained</div>
              <div className="text-sm text-gray-500 mt-1">Across all programs</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor || '#2563eb' }}>98.5%</div>
              <div className="text-gray-600 font-semibold">Pass Rate</div>
              <div className="text-sm text-gray-500 mt-1">First-time certification</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor || '#2563eb' }}>15+</div>
              <div className="text-gray-600 font-semibold">Years Experience</div>
              <div className="text-sm text-gray-500 mt-1">Industry expertise</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold mb-2" style={{ color: tenant.primaryColor || '#2563eb' }}>5.0★</div>
              <div className="text-gray-600 font-semibold">Average Rating</div>
              <div className="text-sm text-gray-500 mt-1">From 500+ reviews</div>
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold mb-4">What Our Students Say</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 text-lg">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Excellent training with {tenantName}. The instructors were knowledgeable and the hands-on approach really helped me understand the practical aspects."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    JM
                  </div>
                  <div>
                    <div className="font-semibold">Jamie Miller</div>
                    <div className="text-sm text-gray-500">Certified {businessTypeFormatted} Professional</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 text-lg">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Got my certification in record time thanks to their flexible scheduling and expert instruction. Highly recommend {tenantName} to anyone looking to advance their career."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    ST
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Thompson</div>
                    <div className="text-sm text-gray-500">Senior Technician</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 text-lg">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The training quality is outstanding. I've completed multiple courses with {tenantName} and each one has been professionally delivered with great support."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    MJ
                  </div>
                  <div>
                    <div className="font-semibold">Michael Johnson</div>
                    <div className="text-sm text-gray-500">Lead Engineer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Customized for tenant */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose {tenantName}?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: tenant.primaryColor || '#2563eb' }} />
              <h4 className="text-xl font-semibold mb-3">Flexible Scheduling</h4>
              <p className="text-gray-600">Short notice bookings available with weekend and evening sessions to fit your schedule.</p>
            </div>
            <div className="text-center p-6">
              <Award className="w-12 h-12 mx-auto mb-4" style={{ color: tenant.primaryColor || '#2563eb' }} />
              <h4 className="text-xl font-semibold mb-3">Complete Training Solution</h4>
              <p className="text-gray-600">From installation to ongoing maintenance and compliance - we're your one-stop training provider.</p>
            </div>
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: tenant.primaryColor || '#2563eb' }} />
              <h4 className="text-xl font-semibold mb-3">Local & Friendly</h4>
              <p className="text-gray-600">Based in {tenantCity}, providing personal service and local expertise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories - Dynamic from tenant's actual courses */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-4">Available Training Courses</h3>
          <p className="text-center text-gray-600 mb-12">{businessTypeFormatted} and certification training</p>
          
          {courses.length > 0 ? (
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
                      <span className="text-sm font-medium" style={{ color: tenant.primaryColor || '#2563eb' }}>
                        {coursesInCategory.length} course{coursesInCategory.length !== 1 ? 's' : ''} available
                      </span>
                    </div>
                    <Link 
                      href={`/${slug}/courses?category=${getCategoryUrlParam(category)}`} 
                      className="hover:text-blue-800 font-semibold"
                      style={{ color: tenant.primaryColor || '#2563eb' }}
                    >
                      View Courses →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Featured Courses */}
              <div>
                <h4 className="text-2xl font-bold text-center mb-8">Featured Courses</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.slice(0, 6).map((course) => (
                    <div key={course.id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getCategoryIcon(course.category)}</span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${tenant.primaryColor || '#2563eb'}20`, color: tenant.primaryColor || '#2563eb' }}>
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
                          href={`/${slug}/booking?course=${course.id}`}
                          className="text-white px-4 py-2 rounded text-sm font-medium transition-colors hover:opacity-90"
                          style={{ backgroundColor: tenant.primaryColor || '#2563eb' }}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link 
                    href={`/${slug}/courses`}
                    className="text-white px-6 py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
                    style={{ backgroundColor: tenant.primaryColor || '#2563eb' }}
                  >
                    View All Courses
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Courses are being prepared.</p>
              <p className="text-gray-500 text-sm mt-2">Please check back later for updated course listings.</p>
            </div>
          )}
        </div>
      </section>

      {/* Bundle Offers */}
      <BundleOffers />

      {/* Contact & Location Section */}
      <section className="py-20" style={{ backgroundColor: tenant.primaryColor || '#1e3a8a' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">Ready to Start Your Training Journey?</h3>
            <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto">
              Join hundreds of professionals who've advanced their careers with {tenantName}. 
              Get in touch today to discuss your training needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h4 className="text-2xl font-bold text-gray-900 mb-6">🏢 {tenantName}</h4>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: tenant.primaryColor || '#2563eb' }} />
                  <div>
                    <p className="text-gray-900 font-semibold mb-1">Training Center Location</p>
                    <p className="text-gray-700">
                      {tenant.address || `Professional training facility in ${tenantCity}`}
                    </p>
                    <p className="text-gray-700">
                      {tenant.city && tenant.postcode 
                        ? `${tenant.city}, ${tenant.postcode}`
                        : tenantCity
                      }
                    </p>
                  </div>
                </div>

                {tenant.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 mt-1 flex-shrink-0 flex items-center justify-center" style={{ color: tenant.primaryColor || '#2563eb' }}>
                      📞
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold mb-1">Phone</p>
                      <a 
                        href={`tel:${tenant.phone}`} 
                        className="text-gray-700 hover:opacity-75 transition-colors"
                      >
                        {tenant.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 mt-1 flex-shrink-0 flex items-center justify-center" style={{ color: tenant.primaryColor || '#2563eb' }}>
                    ✉️
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold mb-1">Email</p>
                    <a 
                      href={`mailto:${tenant.email}`} 
                      className="text-gray-700 hover:opacity-75 transition-colors"
                    >
                      {tenant.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: tenant.primaryColor || '#2563eb' }} />
                  <div>
                    <p className="text-gray-900 font-semibold mb-1">Training Hours</p>
                    <div className="text-gray-700">
                      <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                      <p>Saturday: 8:00 AM - 4:00 PM</p>
                      <p>Evening sessions available</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">🎯 Serving {tenantCity} & Surrounding Areas</p>
                <p className="text-gray-700 text-sm">
                  We provide {businessTypeFormatted} training to professionals across {tenantCity} and the wider region. 
                  Flexible scheduling and convenient location make us the preferred choice for working professionals.
                </p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h5 className="text-xl font-bold text-gray-900 mb-4">📚 Browse Training Courses</h5>
                <p className="text-gray-700 mb-4">
                  Explore our comprehensive range of {businessTypeFormatted} courses designed for professionals at every level.
                </p>
                <Link 
                  href={`/${slug}/courses`}
                  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: tenant.primaryColor || '#2563eb' }}
                >
                  View All Courses →
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h5 className="text-xl font-bold text-gray-900 mb-4">🗓️ Book Training Session</h5>
                <p className="text-gray-700 mb-4">
                  Ready to get started? Book your training session with flexible scheduling options to fit your busy schedule.
                </p>
                <Link 
                  href={`/${slug}/booking`}
                  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: tenant.primaryColor || '#2563eb' }}
                >
                  Book Now →
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h5 className="text-xl font-bold text-gray-900 mb-4">💬 Get In Touch</h5>
                <p className="text-gray-700 mb-4">
                  Have questions about our training programs? Need a custom training solution for your team? Contact us today.
                </p>
                <Link 
                  href={`/${slug}/contact`}
                  className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: tenant.primaryColor || '#2563eb' }}
                >
                  Contact Us →
                </Link>
              </div>

              {/* Social Proof Banner */}
              <div className="bg-yellow-400 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-yellow-300 text-3xl mb-2">⭐⭐⭐⭐⭐</div>
                  <p className="text-white font-semibold mb-2">Rated 5/5 by Our Students</p>
                  <p className="text-white text-opacity-90 text-sm">
                    "Best training experience I've had. Professional, thorough, and great value." - Recent Student
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-white py-16" style={{ backgroundColor: tenant.primaryColor || '#1e3a8a' }}>
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Your Training?</h3>
          <p className="text-xl mb-8">Book your course today with our easy online booking system</p>
          <Link 
            href={`/${slug}/booking`} 
            className="px-8 py-3 rounded-lg font-semibold transition-colors inline-block hover:opacity-90"
            style={{ backgroundColor: tenant.secondaryColor || '#f97316' }}
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">{tenantName}</h4>
              <p className="text-gray-300">{businessTypeFormatted} in {tenantCity}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-300">{tenantCity}{tenant.county && tenant.city !== tenant.county && `, ${tenant.county}`}</p>
              {tenant.email && <p className="text-gray-300">Email: {tenant.email}</p>}
              {tenant.phone && <p className="text-gray-300">Phone: {tenant.phone}</p>}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href={`/${slug}/courses`} className="block text-gray-300 hover:text-white">Courses</Link>
                <Link href={`/${slug}/booking`} className="block text-gray-300 hover:text-white">Book Training</Link>
                <Link href={`/${slug}/contact`} className="block text-gray-300 hover:text-white">Contact</Link>
                <Link href={`/${slug}/admin`} className="block text-gray-300 hover:text-white">Admin Portal</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 {tenantName}. All rights reserved. Powered by ACME Training Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}