'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  Flame,
  Zap,
  Wind,
  Droplets,
  Snowflake,
  Crown,
  Award,
  Star,
  CheckCircle,
  ArrowRight,
  Percent,
  Clock,
  Users,
  TrendingUp,
  Gift,
  Sparkles,
  Heart,
  Target,
  Trophy,
  BookOpen,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface BundleOffer {
  id: string
  title: string
  subtitle: string
  description: string
  tagline?: string | null
  tier: string
  courses: BundleCourse[]
  originalPrice: number
  bundlePrice: number
  savings: number
  discountPercentage: number
  icon: React.ElementType
  gradient: string
  badge?: string
  popularity: 'popular' | 'trending' | 'elite' | null
  tierUnlock: string
  benefits: string[]
  features: string[]
  timeline: string
  studentsEnrolled: number
  completionBonus?: string
}

interface BundleCourse {
  id: string
  title: string
  category: string
  duration: string | number
  price?: number
  icon: string
  certification: string
}

// Fallback bundles if API fails or returns empty
const fallbackBundles: BundleOffer[] = [
  {
    id: 'starter-bundle',
    title: 'Foundation Starter Bundle',
    subtitle: 'Perfect for Career Beginners',
    description: 'Start your professional journey with the essential qualifications. Get Gas Safe registered and build your foundation skills.',
    courses: [
      {
        id: 'gas-safe-basic',
        title: 'Gas Safe Registration',
        category: 'GAS_SAFE',
        duration: '3 days',
        icon: '🔥',
        certification: 'CCN1, CENWAT, CKR1'
      },
      {
        id: 'health-safety',
        title: 'Health & Safety Essentials',
        category: 'GENERAL',
        duration: '1 day',
        icon: '🛡️',
        certification: 'CSCS Card'
      }
    ],
    originalPrice: 980,
    bundlePrice: 799,
    savings: 181,
    discountPercentage: 18,
    icon: Flame,
    gradient: 'from-blue-500 to-green-500',
    popularity: null,
    tierUnlock: 'Unlock Specialist Tier',
    benefits: [
      'Industry-recognized certifications',
      'Career entry qualifications',
      'Digital certificate downloads',
      'Email support for 6 months',
      'Study materials included'
    ],
    timeline: '4 days total training',
    studentsEnrolled: 847,
    completionBonus: 'Free renewal reminder service'
  },
  {
    id: 'multi-trade-bundle',
    title: 'Multi-Trade Professional Bundle',
    subtitle: 'Expand Your Expertise',
    description: 'Become a versatile multi-trade professional. Combine gas, heating, and renewable energy skills for maximum earning potential.',
    courses: [
      {
        id: 'gas-safe-full',
        title: 'Gas Safe Complete',
        category: 'GAS_SAFE',
        duration: '5 days',
        icon: '🔥',
        certification: 'Full Gas Safe Portfolio'
      },
      {
        id: 'heat-pump-install',
        title: 'Heat Pump Installation',
        category: 'HEAT_PUMP',
        duration: '3 days',
        icon: '🌡️',
        certification: 'MCS Accredited'
      },
      {
        id: 'oftec-oil',
        title: 'OFTEC Oil Heating',
        category: 'OFTEC',
        duration: '2 days',
        icon: '🛢️',
        certification: 'OFTEC Registration'
      }
    ],
    originalPrice: 2850,
    bundlePrice: 2195,
    savings: 655,
    discountPercentage: 23,
    icon: Award,
    gradient: 'from-purple-500 to-pink-500',
    badge: 'MOST POPULAR',
    popularity: 'popular',
    tierUnlock: 'Unlock Multi-Trade Professional Tier',
    benefits: [
      'Three major qualifications',
      '40% higher earning potential',
      'Priority booking slots',
      'Industry networking access',
      '10% discount on future courses',
      'Fast-track certification processing'
    ],
    timeline: '10 days training over 6 weeks',
    studentsEnrolled: 342,
    completionBonus: '£200 tool voucher included'
  },
  {
    id: 'commercial-specialist-bundle',
    title: 'Commercial Specialist Bundle',
    subtitle: 'For Commercial Success',
    description: 'Master commercial gas systems and unlock the highest-paying opportunities in the industry.',
    courses: [
      {
        id: 'commercial-core',
        title: 'Commercial Gas Core',
        category: 'COMMERCIAL_CORE',
        duration: '4 days',
        icon: '⚙️',
        certification: 'COCN1, CORT1'
      },
      {
        id: 'commercial-catering',
        title: 'Commercial Catering',
        category: 'COMMERCIAL_CATERING',
        duration: '3 days',
        icon: '🍳',
        certification: 'CIGA1, CORT1'
      },
      {
        id: 'commercial-laundry',
        title: 'Commercial Laundry',
        category: 'COMMERCIAL_LAUNDRY',
        duration: '2 days',
        icon: '🧺',
        certification: 'CILG1'
      }
    ],
    originalPrice: 3200,
    bundlePrice: 2399,
    savings: 801,
    discountPercentage: 25,
    icon: Crown,
    gradient: 'from-yellow-500 to-orange-500',
    badge: 'PREMIUM',
    popularity: 'elite',
    tierUnlock: 'Unlock Master Technician Tier',
    benefits: [
      'Commercial expertise certification',
      '60% higher project rates',
      'Elite support line access',
      'Industry conference invites',
      '15% lifetime course discounts',
      'Business development resources'
    ],
    timeline: '9 days training over 4 weeks',
    studentsEnrolled: 156,
    completionBonus: 'Free business insurance consultation'
  },
  {
    id: 'renewable-energy-bundle',
    title: 'Renewable Energy Master Bundle',
    subtitle: 'Future-Proof Your Career',
    description: 'Become an expert in renewable energy systems. Position yourself at the forefront of the green energy revolution.',
    courses: [
      {
        id: 'heat-pump-advanced',
        title: 'Advanced Heat Pump Systems',
        category: 'HEAT_PUMP',
        duration: '4 days',
        icon: '🌡️',
        certification: 'Ground & Air Source'
      },
      {
        id: 'fgas-aircon',
        title: 'F-Gas Air Conditioning',
        category: 'FGAS_AIR_CONDITIONING',
        duration: '3 days',
        icon: '❄️',
        certification: 'F-Gas Cat II & IV'
      },
      {
        id: 'solar-thermal',
        title: 'Solar Thermal Systems',
        category: 'RENEWABLE',
        duration: '2 days',
        icon: '☀️',
        certification: 'MCS Solar Thermal'
      }
    ],
    originalPrice: 2750,
    bundlePrice: 2299,
    savings: 451,
    discountPercentage: 16,
    icon: Star,
    gradient: 'from-green-500 to-blue-500',
    badge: 'TRENDING',
    popularity: 'trending',
    tierUnlock: 'Unlock Industry Expert Tier',
    benefits: [
      'Future-proof qualifications',
      'Government scheme access',
      'Premium installation rates',
      'Exclusive supplier partnerships',
      'Green technology updates',
      'Carbon offset certification'
    ],
    timeline: '9 days training over 5 weeks',
    studentsEnrolled: 234,
    completionBonus: 'Free renewable energy market report'
  },
  {
    id: 'complete-mastery-bundle',
    title: 'Complete Mastery Bundle',
    subtitle: 'Ultimate Professional Package',
    description: 'The ultimate training package. Master every major qualification and become an industry leader with unlimited earning potential.',
    courses: [
      {
        id: 'all-gas-safe',
        title: 'Complete Gas Safe Portfolio',
        category: 'GAS_SAFE',
        duration: '6 days',
        icon: '🔥',
        certification: 'All ACS Categories'
      },
      {
        id: 'all-renewable',
        title: 'Complete Renewable Energy',
        category: 'RENEWABLE',
        duration: '5 days',
        icon: '🌱',
        certification: 'All Renewable Certs'
      },
      {
        id: 'all-commercial',
        title: 'Complete Commercial Systems',
        category: 'COMMERCIAL',
        duration: '4 days',
        icon: '🏭',
        certification: 'All Commercial Tickets'
      },
      {
        id: 'electrical-basics',
        title: 'Electrical Fundamentals',
        category: 'ELECTRICAL',
        duration: '3 days',
        icon: '⚡',
        certification: '18th Edition + Testing'
      }
    ],
    originalPrice: 5800,
    bundlePrice: 3999,
    savings: 1801,
    discountPercentage: 31,
    icon: Trophy,
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    badge: 'ULTIMATE',
    popularity: 'elite',
    tierUnlock: 'Unlock Industry Expert Status',
    benefits: [
      'All major qualifications included',
      'Unlimited earning potential',
      'Industry thought leadership',
      'Teaching opportunities',
      'Revenue sharing programs',
      'Exclusive mastermind access',
      '20% lifetime course discounts',
      'Personal business mentor assigned'
    ],
    timeline: '18 days training over 12 weeks',
    studentsEnrolled: 89,
    completionBonus: 'Free annual industry conference pass'
  }
]

// Helper function to map tier to icon
const getTierIcon = (tier: string): React.ElementType => {
  switch (tier) {
    case 'FOUNDATION':
      return Flame
    case 'PROFESSIONAL':
      return Award
    case 'SPECIALIST':
      return Crown
    case 'MASTER':
      return Star
    case 'ELITE':
      return Trophy
    default:
      return Package
  }
}

// Helper function to map tier to gradient
const getTierGradient = (tier: string): string => {
  switch (tier) {
    case 'FOUNDATION':
      return 'from-blue-500 to-green-500'
    case 'PROFESSIONAL':
      return 'from-purple-500 to-pink-500'
    case 'SPECIALIST':
      return 'from-yellow-500 to-orange-500'
    case 'MASTER':
      return 'from-green-500 to-blue-500'
    case 'ELITE':
      return 'from-yellow-400 via-orange-500 to-red-500'
    default:
      return 'from-gray-500 to-slate-500'
  }
}

export default function BundleOffers() {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)
  const [bundles, setBundles] = useState<BundleOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bundles')

      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }

      const data = await response.json()

      // Transform API data to match UI format
      const transformedBundles: BundleOffer[] = data.map((bundle: any) => ({
        id: bundle.id,
        title: bundle.title,
        subtitle: bundle.tagline || 'Course Bundle',
        description: bundle.description,
        tagline: bundle.tagline,
        tier: bundle.tier,
        courses: bundle.courses.map((course: any) => ({
          id: course.id,
          title: course.title,
          category: course.category,
          duration: `${course.duration} ${course.duration === 1 ? 'day' : 'days'}`,
          icon: getCategoryIcon(course.category),
          certification: course.category.replace(/_/g, ' '),
          price: course.price
        })),
        originalPrice: bundle.originalPrice,
        bundlePrice: bundle.bundlePrice,
        savings: bundle.savings,
        discountPercentage: bundle.discountPercentage,
        icon: getTierIcon(bundle.tier),
        gradient: getTierGradient(bundle.tier),
        badge: bundle.isPopular ? 'MOST POPULAR' : undefined,
        popularity: bundle.isPopular ? 'popular' : null,
        tierUnlock: `Unlock ${bundle.tier} Tier`,
        benefits: bundle.benefits || [],
        features: bundle.features || [],
        timeline: `${bundle.courses.reduce((sum: number, c: any) => sum + c.duration, 0)} days total training`,
        studentsEnrolled: Math.floor(Math.random() * 500) + 50, // Random for now
        completionBonus: bundle.features?.[0] || undefined
      }))

      setBundles(transformedBundles.length > 0 ? transformedBundles : fallbackBundles)
    } catch (error) {
      console.error('Error fetching bundles:', error)
      // Use fallback bundles if API fails
      setBundles(fallbackBundles)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      'GAS_SAFE': '🔥',
      'HEAT_PUMP': '🌡️',
      'OFTEC': '🛢️',
      'LPG': '⚡',
      'COMMERCIAL_CORE': '⚙️',
      'COMMERCIAL_CATERING': '🍳',
      'COMMERCIAL_LAUNDRY': '🧺',
      'FGAS_AIR_CONDITIONING': '❄️',
      'RENEWABLE': '🌱',
      'ELECTRICAL': '⚡'
    }
    return iconMap[category] || '📚'
  }

  const getBadgeColor = (popularity: BundleOffer['popularity']) => {
    switch (popularity) {
      case 'popular':
        return 'bg-blue-500 text-white'
      case 'trending':
        return 'bg-green-500 text-white'
      case 'elite':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getBadgeIcon = (popularity: BundleOffer['popularity']) => {
    switch (popularity) {
      case 'popular':
        return <Heart className="w-3 h-3 mr-1" />
      case 'trending':
        return <TrendingUp className="w-3 h-3 mr-1" />
      case 'elite':
        return <Crown className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-4xl font-bold text-gray-900">Course Bundle Offers</h2>
            <Gift className="w-8 h-8 text-blue-600 ml-3" />
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8 font-medium">
            Save money and accelerate your career with our expertly curated course bundles.
            Each package is designed to unlock the next tier of your professional journey.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-purple-800 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Limited Time: Extra 5% off with code BUNDLE5</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading bundles...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bundles.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bundles available yet</h3>
            <p className="text-gray-600">Check back soon for special course bundle offers!</p>
          </div>
        )}

        {/* Bundle Grid */}
        {!isLoading && bundles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {bundles.map((bundle) => {
            const Icon = bundle.icon
            const isSelected = selectedBundle === bundle.id
            
            return (
              <div
                key={bundle.id}
                className={`
                  relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer
                  ${isSelected ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}
                  ${bundle.popularity === 'popular' ? 'transform scale-105 z-10' : ''}
                `}
                onClick={() => setSelectedBundle(selectedBundle === bundle.id ? null : bundle.id)}
              >
                {/* Badge */}
                {bundle.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-bold flex items-center
                      ${getBadgeColor(bundle.popularity)}
                    `}>
                      {getBadgeIcon(bundle.popularity)}
                      {bundle.badge}
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className={`
                  bg-gradient-to-r ${bundle.gradient} rounded-t-2xl p-6 text-white relative overflow-hidden
                `}>
                  <div className="absolute top-0 right-0 opacity-20">
                    <Icon className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-3">
                      <Icon className="w-8 h-8 mr-3" />
                      <div>
                        <h3 className="text-xl font-bold">{bundle.title}</h3>
                        <p className="text-sm opacity-90">{bundle.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm opacity-90 mb-4">{bundle.description}</p>
                    
                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-2xl font-bold">£{bundle.bundlePrice}</span>
                          <span className="text-sm line-through opacity-75">£{bundle.originalPrice}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Percent className="w-3 h-3" />
                          <span className="text-xs">Save £{bundle.savings} ({bundle.discountPercentage}% off)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-90">Tier Unlock</div>
                        <div className="text-sm font-semibold">{bundle.tierUnlock.split(' ').slice(-2).join(' ')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Courses */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Included Courses ({bundle.courses.length})
                    </h4>
                    <div className="space-y-2">
                      {bundle.courses.map((course, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{course.icon}</span>
                            <div>
                              <div className="font-medium text-sm text-gray-900">{course.title}</div>
                              <div className="text-xs text-gray-600">{course.certification}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{course.duration}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">Duration</div>
                      <div className="font-semibold text-sm">{bundle.timeline.split(' ')[0]}d</div>
                    </div>
                    <div className="text-center">
                      <Users className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">Enrolled</div>
                      <div className="font-semibold text-sm">{bundle.studentsEnrolled}</div>
                    </div>
                    <div className="text-center">
                      <Target className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">Tier</div>
                      <div className="font-semibold text-sm text-purple-600">Next</div>
                    </div>
                  </div>

                  {/* Benefits Preview */}
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-2">Key Benefits:</h5>
                    <div className="space-y-1">
                      {bundle.benefits.slice(0, 3).map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </div>
                      ))}
                      {bundle.benefits.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium">
                          +{bundle.benefits.length - 3} more benefits
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completion Bonus */}
                  {bundle.completionBonus && (
                    <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <Gift className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">Completion Bonus:</span>
                      </div>
                      <p className="text-sm text-yellow-800 mt-1">{bundle.completionBonus}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    href={`/booking?bundle=${bundle.id}`}
                    className={`
                      w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-colors text-white
                      ${bundle.popularity === 'popular' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : bundle.popularity === 'elite'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                      }
                    `}
                  >
                    <span className="text-white">Select Bundle</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">All Benefits:</h5>
                        <div className="space-y-2">
                          {bundle.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Training Schedule:</h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>{bundle.timeline}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span>Flexible booking available</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>Small class sizes (max 8 students)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h3>
          <p className="text-xl opacity-90 mb-8">
            Join over 1,200+ professionals who've accelerated their careers with our bundle packages
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              href="/courses"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>Browse Individual Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Get Bundle Advice
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center space-x-8 text-sm opacity-75">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Money-back guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Flexible payment plans</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Industry-recognized certificates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}