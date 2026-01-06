'use client'

import { useState } from 'react'
import { 
  Shield, 
  Award, 
  Crown, 
  Star, 
  ChevronRight,
  Clock,
  PoundSterling,
  TrendingUp,
  Users,
  Zap,
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface TierData {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  gradient: string
  ringColor: string
  qualificationsNeeded: number
  averageSalary: string
  marketDemand: string
  benefits: string[]
  courses: string[]
  nextTierBonus?: string
}

const tiers: TierData[] = [
  {
    id: 'trainee',
    title: 'Trainee',
    subtitle: 'Starting Your Journey',
    icon: Shield,
    gradient: 'from-gray-400 to-gray-500',
    ringColor: 'ring-gray-300',
    qualificationsNeeded: 0,
    averageSalary: '£18,000-£25,000',
    marketDemand: 'Entry Level',
    benefits: [
      'Foundation knowledge',
      'Industry recognition',
      'Career pathway clarity',
      'Professional development start'
    ],
    courses: ['Gas Safety Fundamentals', 'Basic Electrical', 'Health & Safety'],
    nextTierBonus: '15% salary increase potential'
  },
  {
    id: 'specialist',
    title: 'Specialist',
    subtitle: 'Focused Expertise',
    icon: Award,
    gradient: 'from-blue-500 to-blue-600',
    ringColor: 'ring-blue-300',
    qualificationsNeeded: 1,
    averageSalary: '£25,000-£35,000',
    marketDemand: 'High Demand',
    benefits: [
      'Specialized skills premium',
      'Industry credibility',
      'Enhanced job security',
      'Client trust and confidence'
    ],
    courses: ['Gas Safe Registration', 'OFTEC Oil', 'Electrical Part P'],
    nextTierBonus: '25% more earning potential'
  },
  {
    id: 'multitrade',
    title: 'Multi-Trade Professional',
    subtitle: 'Diverse Skill Set',
    icon: Award,
    gradient: 'from-indigo-500 to-purple-600',
    ringColor: 'ring-purple-300',
    qualificationsNeeded: 2,
    averageSalary: '£35,000-£50,000',
    marketDemand: 'Very High Demand',
    benefits: [
      'Multiple revenue streams',
      'Greater job flexibility',
      'Premium project rates',
      'Reduced competition'
    ],
    courses: ['Heat Pump Installation', 'Air Conditioning F-Gas', 'LPG Systems'],
    nextTierBonus: '40% increase in project value'
  },
  {
    id: 'master',
    title: 'Master Technician',
    subtitle: 'Advanced Professional',
    icon: Crown,
    gradient: 'from-purple-600 to-pink-600',
    ringColor: 'ring-pink-300',
    qualificationsNeeded: 4,
    averageSalary: '£50,000-£70,000',
    marketDemand: 'Elite Tier',
    benefits: [
      'Industry leadership position',
      'Complex project capability',
      'Training & mentoring opportunities',
      'Premium service rates'
    ],
    courses: ['Commercial Refrigeration', 'Renewable Energy Systems', 'Smart Home Tech'],
    nextTierBonus: '60% higher project margins'
  },
  {
    id: 'expert',
    title: 'Industry Expert',
    subtitle: 'Peak Professional',
    icon: Star,
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    ringColor: 'ring-yellow-300',
    qualificationsNeeded: 5,
    averageSalary: '£70,000+',
    marketDemand: 'Exclusive',
    benefits: [
      'Industry thought leadership',
      'Consultancy opportunities',
      'Maximum earning potential',
      'Professional recognition'
    ],
    courses: ['All Available Specialties', 'Advanced Diagnostics', 'Business Development'],
    nextTierBonus: 'Unlimited earning potential'
  }
]

export default function TierProgressionShowcase() {
  const [selectedTier, setSelectedTier] = useState<string>('specialist')
  const [isHovering, setIsHovering] = useState<string | null>(null)

  const selectedTierData = tiers.find(tier => tier.id === selectedTier) || tiers[1]

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your Professional Journey
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Advance through qualification tiers and unlock higher earning potential. 
            Each certification opens new opportunities and premium rates.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
            <Sparkles className="w-4 h-4" />
            <span>Average 25% salary increase per tier advancement</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Tier Progression Visual */}
        <div className="mb-16">
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {tiers.map((tier, index) => {
              const Icon = tier.icon
              const isSelected = selectedTier === tier.id
              const isHovered = isHovering === tier.id
              
              return (
                <div key={tier.id} className="flex items-center">
                  {/* Tier Node */}
                  <div
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => setSelectedTier(tier.id)}
                    onMouseEnter={() => setIsHovering(tier.id)}
                    onMouseLeave={() => setIsHovering(null)}
                  >
                    {/* Avatar */}
                    <div className={`
                      relative mb-3 transition-all duration-300 transform
                      ${isSelected ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100'}
                      ${tier.qualificationsNeeded >= 3 ? 'animate-pulse' : ''}
                    `}>
                      <div className={`
                        w-20 h-20 bg-gradient-to-br ${tier.gradient} rounded-full 
                        flex items-center justify-center shadow-lg 
                        ring-4 ring-white ${tier.ringColor}
                        ${isSelected ? 'ring-8 shadow-2xl' : ''}
                        ${tier.qualificationsNeeded >= 5 ? 'ring-8 ring-yellow-300 shadow-2xl' : ''}
                      `}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      
                      {/* Qualification Count Badge */}
                      {tier.qualificationsNeeded > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                          <span className={`
                            ${tier.qualificationsNeeded === 1 ? 'text-blue-600' : ''}
                            ${tier.qualificationsNeeded === 2 ? 'text-indigo-600' : ''}
                            ${tier.qualificationsNeeded >= 3 && tier.qualificationsNeeded <= 4 ? 'text-purple-600' : ''}
                            ${tier.qualificationsNeeded >= 5 ? 'text-yellow-600' : ''}
                          `}>
                            {tier.qualificationsNeeded === 0 ? '🎯' : tier.qualificationsNeeded}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Tier Info */}
                    <div className="text-center">
                      <h3 className={`
                        font-bold text-sm transition-colors
                        ${isSelected ? 'text-blue-600' : 'text-gray-700'}
                      `}>
                        {tier.title}
                      </h3>
                      <p className="text-xs text-gray-500 max-w-20">
                        {tier.subtitle}
                      </p>
                      <p className="text-xs font-medium text-green-600 mt-1">
                        {tier.averageSalary}
                      </p>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  {index < tiers.length - 1 && (
                    <div className="mx-4 text-gray-400">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Tier Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Tier Benefits */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`
                w-12 h-12 bg-gradient-to-br ${selectedTierData.gradient} rounded-lg 
                flex items-center justify-center
              `}>
                <selectedTierData.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedTierData.title}</h3>
                <p className="text-gray-600">{selectedTierData.subtitle}</p>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Qualifications</p>
                <p className="font-bold text-gray-900">
                  {selectedTierData.qualificationsNeeded === 0 ? 'Starting Point' : `${selectedTierData.qualificationsNeeded} Required`}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <PoundSterling className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Salary Range</p>
                <p className="font-bold text-gray-900">{selectedTierData.averageSalary}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Market</p>
                <p className="font-bold text-gray-900">{selectedTierData.marketDemand}</p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Professional Benefits:</h4>
              <div className="space-y-2">
                {selectedTierData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Tier Bonus */}
            {selectedTierData.nextTierBonus && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Advancement Bonus:</span>
                </div>
                <p className="text-sm text-blue-800">{selectedTierData.nextTierBonus}</p>
              </div>
            )}
          </div>

          {/* Course Pathway */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommended Course Pathway</h3>
            
            <div className="space-y-4 mb-6">
              {selectedTierData.courses.map((course, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{course}</span>
                </div>
              ))}
            </div>

            {/* Time Investment */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Time Investment:</span>
              </div>
              <p className="text-sm text-blue-800">
                {selectedTierData.qualificationsNeeded === 0 && 'Ready to start your journey'}
                {selectedTierData.qualificationsNeeded === 1 && '2-4 weeks training + certification'}
                {selectedTierData.qualificationsNeeded === 2 && '6-8 weeks total training time'}
                {selectedTierData.qualificationsNeeded >= 3 && '3-6 months comprehensive training'}
              </p>
            </div>

            {/* ROI Calculator */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Return on Investment:</span>
              </div>
              <p className="text-sm text-green-800 mb-2">
                Training investment typically pays for itself within 3-6 months
              </p>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700">
                  95% of graduates report increased earning potential within first year
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Advance Your Career?</h3>
          <p className="text-xl opacity-90 mb-8">
            Start your journey today and unlock your earning potential
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              href="/courses"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>Browse Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/student/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Student Login
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Join over 10,000+ professionals who've advanced their careers with us
          </p>
        </div>
      </div>
    </section>
  )
}