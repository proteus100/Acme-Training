'use client'

import { useState, useEffect } from 'react'
import { 
  Target, 
  Trophy, 
  Zap, 
  Star, 
  TrendingUp,
  Clock,
  Award,
  Crown,
  Shield,
  CheckCircle,
  ArrowRight,
  Flame,
  Gift,
  Users,
  DollarSign,
  Calendar,
  BookOpen,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { getUserQualifications, getTierInfo } from './ProfileAvatar'
import AchievementCelebration, { useAchievementCelebration, ACHIEVEMENTS } from './AchievementCelebration'

interface GamificationData {
  currentTier: string
  qualificationCount: number
  totalPoints: number
  nextTierTarget: number
  pointsToNextTier: number
  completedCourses: number
  upcomingBookings: number
  achievementStreak: number
  estimatedSalaryIncrease: string
  recommendedCourses: string[]
  recentAchievements: Achievement[]
  tierBenefits: string[]
  progressPercentage: number
}

interface Achievement {
  id: string
  title: string
  description: string
  category: string
  earnedDate: string
  points: number
  icon: string
}

interface Props {
  bookings?: any[]
  certifications?: any[]
}

export default function GamificationPanel({ bookings = [], certifications = [] }: Props) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null)
  const [selectedTab, setSelectedTab] = useState<'progress' | 'achievements' | 'rewards'>('progress')
  const { achievement, isVisible, triggerAchievement, closeAchievement } = useAchievementCelebration()

  useEffect(() => {
    calculateGamificationData()
  }, [bookings, certifications])

  const calculateGamificationData = () => {
    const qualifications = getUserQualifications(bookings, certifications)
    const tierInfo = getTierInfo(qualifications.length)
    
    // Calculate points system
    const basePointsPerCourse = 100
    const bonusPointsPerTier = 50
    const totalPoints = (qualifications.length * basePointsPerCourse) + (Math.max(0, qualifications.length - 1) * bonusPointsPerTier)
    
    // Calculate next tier requirements
    let nextTierTarget = 0
    let pointsToNextTier = 0
    
    if (qualifications.length === 0) {
      nextTierTarget = 1
      pointsToNextTier = basePointsPerCourse - totalPoints
    } else if (qualifications.length === 1) {
      nextTierTarget = 2
      pointsToNextTier = (2 * basePointsPerCourse + bonusPointsPerTier) - totalPoints
    } else if (qualifications.length === 2) {
      nextTierTarget = 3
      pointsToNextTier = (3 * basePointsPerCourse + 2 * bonusPointsPerTier) - totalPoints
    } else if (qualifications.length < 5) {
      nextTierTarget = 5
      pointsToNextTier = (5 * basePointsPerCourse + 4 * bonusPointsPerTier) - totalPoints
    }

    // Calculate progress percentage
    const progressPercentage = qualifications.length === 0 ? 0 : 
      Math.min(100, (totalPoints / (nextTierTarget * basePointsPerCourse + Math.max(0, nextTierTarget - 1) * bonusPointsPerTier)) * 100)

    const data: GamificationData = {
      currentTier: tierInfo.title,
      qualificationCount: qualifications.length,
      totalPoints,
      nextTierTarget,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      completedCourses: bookings.filter(b => b.status === 'COMPLETED').length,
      upcomingBookings: bookings.filter(b => {
        // Count bookings that are:
        // 1. Confirmed OR have been paid (PENDING with payment)
        // 2. Session date is in the future
        const isUpcoming = new Date(b.session?.startDate) > new Date()
        const isPaid = b.payments?.some((p: any) => p.status === 'PAID')
        const isConfirmed = b.status === 'CONFIRMED'
        return isUpcoming && (isConfirmed || isPaid)
      }).length,
      achievementStreak: calculateStreak(),
      estimatedSalaryIncrease: calculateSalaryIncrease(qualifications.length),
      recommendedCourses: getRecommendedCourses(qualifications),
      recentAchievements: generateRecentAchievements(bookings),
      tierBenefits: getTierBenefits(tierInfo.tier),
      progressPercentage
    }

    setGamificationData(data)
  }

  const calculateStreak = () => {
    // Calculate consecutive months with course completion
    const completedBookings = bookings
      .filter(b => b.status === 'COMPLETED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    
    if (completedBookings.length === 0) return 0
    
    let streak = 1
    const now = new Date()
    let currentDate = new Date(completedBookings[0].updatedAt)
    
    for (let i = 1; i < completedBookings.length; i++) {
      const bookingDate = new Date(completedBookings[i].updatedAt)
      const monthDiff = (currentDate.getFullYear() - bookingDate.getFullYear()) * 12 + 
                       (currentDate.getMonth() - bookingDate.getMonth())
      
      if (monthDiff <= 2) { // Within 2 months counts as consecutive
        streak++
        currentDate = bookingDate
      } else {
        break
      }
    }
    
    return Math.min(streak, 6) // Cap at 6 months
  }

  const calculateSalaryIncrease = (qualCount: number) => {
    const increases = {
      0: '0%',
      1: '15-25%',
      2: '25-40%',
      3: '40-60%',
      4: '60-80%',
      5: '80%+'
    }
    return increases[Math.min(qualCount, 5) as keyof typeof increases]
  }

  const getRecommendedCourses = (qualifications: string[]) => {
    const allCategories = ['GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG', 'FGAS_AIR_CONDITIONING', 'ELECTRICAL']
    const missing = allCategories.filter(cat => !qualifications.includes(cat))
    
    if (qualifications.length === 0) {
      return ['Gas Safe Registration', 'Basic Electrical']
    } else if (qualifications.includes('GAS_SAFE') && !qualifications.includes('HEAT_PUMP')) {
      return ['Heat Pump Installation', 'Renewable Energy Systems']
    } else if (qualifications.length >= 2 && !qualifications.includes('FGAS_AIR_CONDITIONING')) {
      return ['F-Gas Air Conditioning', 'Commercial Refrigeration']
    }
    
    return missing.slice(0, 2).map(cat => cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()))
  }

  const generateRecentAchievements = (bookings: any[]): Achievement[] => {
    const achievements: Achievement[] = []
    
    bookings
      .filter(b => b.status === 'COMPLETED')
      .slice(0, 3)
      .forEach((booking, index) => {
        achievements.push({
          id: booking.id,
          title: `${booking.session?.course?.title} Completed`,
          description: `Successfully completed ${booking.session?.course?.category?.replace(/_/g, ' ')} certification`,
          category: booking.session?.course?.category || 'GENERAL',
          earnedDate: booking.updatedAt,
          points: 100 + (index * 50), // More points for recent achievements
          icon: getCategoryIcon(booking.session?.course?.category)
        })
      })
    
    return achievements
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'GAS_SAFE': '🔥',
      'HEAT_PUMP': '🌡️',
      'OFTEC': '🛢️',
      'LPG': '⚡',
      'FGAS_AIR_CONDITIONING': '❄️',
      'ELECTRICAL': '⚡',
      'COMMERCIAL_CATERING': '🍳',
      'COMMERCIAL_LAUNDRY': '🧺',
      'WATER': '💧'
    }
    return icons[category] || '🏆'
  }

  const getTierBenefits = (tier: string) => {
    const benefits: Record<string, string[]> = {
      'trainee': [
        'Access to beginner courses',
        'Basic certification tracking',
        'Email support'
      ],
      'specialist': [
        'Priority booking slots',
        'Digital certificates',
        'Career guidance calls',
        '5% discount on next course'
      ],
      'multi-trade': [
        'Advanced course access',
        'Industry networking events',
        'Premium support line',
        '10% bulk course discounts',
        'Job placement assistance'
      ],
      'master': [
        'Elite course previews',
        'Mentorship opportunities',
        'Industry conference invites',
        '15% all course discounts',
        'Fast-track certification',
        'Business development support'
      ],
      'expert': [
        'Unlimited course access',
        'Teaching opportunities',
        'Industry advisory board',
        '20% lifetime discounts',
        'Custom training programs',
        'Revenue sharing opportunities'
      ]
    }
    return benefits[tier] || benefits['trainee']
  }

  if (!gamificationData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
            Your Progress Journey
          </h3>
          <p className="text-gray-600">Track your advancement and unlock rewards</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{gamificationData.totalPoints}</div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white rounded-lg p-1 mb-6">
        {[
          { id: 'progress', label: 'Progress', icon: Target },
          { id: 'achievements', label: 'Achievements', icon: Award },
          { id: 'rewards', label: 'Rewards', icon: Gift }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors
                ${selectedTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Progress Tab */}
      {selectedTab === 'progress' && (
        <div className="space-y-6">
          {/* Current Tier Status */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {gamificationData.qualificationCount === 0 && <Shield className="w-6 h-6 text-white" />}
                  {gamificationData.qualificationCount === 1 && <Award className="w-6 h-6 text-white" />}
                  {gamificationData.qualificationCount === 2 && <Award className="w-6 h-6 text-white" />}
                  {gamificationData.qualificationCount >= 3 && gamificationData.qualificationCount <= 4 && <Crown className="w-6 h-6 text-white" />}
                  {gamificationData.qualificationCount >= 5 && <Star className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{gamificationData.currentTier}</h4>
                  <p className="text-sm text-gray-600">{gamificationData.qualificationCount} qualifications earned</p>
                </div>
              </div>
              
              {gamificationData.pointsToNextTier > 0 && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">Next Tier</div>
                  <div className="font-bold text-blue-600">{gamificationData.pointsToNextTier} pts to go</div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {gamificationData.pointsToNextTier > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress to next tier</span>
                  <span className="font-medium">{Math.round(gamificationData.progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${gamificationData.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="font-bold text-green-600">{gamificationData.completedCourses}</div>
                <div className="text-xs text-green-700">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="font-bold text-blue-600">{gamificationData.upcomingBookings}</div>
                <div className="text-xs text-blue-700">Upcoming</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <div className="font-bold text-orange-600">{gamificationData.achievementStreak}</div>
                <div className="text-xs text-orange-700">Streak</div>
              </div>
            </div>
          </div>

          {/* Salary Impact */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg mb-1">Career Impact</h4>
                <p className="text-green-100 text-sm">Your qualifications are driving real results</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
            <div className="mt-4 flex items-center space-x-6">
              <div>
                <div className="text-2xl font-bold">{gamificationData.estimatedSalaryIncrease}</div>
                <div className="text-green-100 text-sm">Salary increase potential</div>
              </div>
              <ChevronRight className="w-5 h-5 text-green-200" />
              <div>
                <div className="text-lg font-semibold">£{18000 + (gamificationData.qualificationCount * 8000)}</div>
                <div className="text-green-100 text-sm">Estimated annual salary</div>
              </div>
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              Recommended Next Steps
            </h4>
            <div className="space-y-3">
              {gamificationData.recommendedCourses.map((course, index) => (
                <Link
                  key={index}
                  href="/courses"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:bg-blue-700 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{course}</div>
                      <div className="text-sm text-gray-600">+100 points • Career boost</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/courses"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse All Courses
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {selectedTab === 'achievements' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">{gamificationData.recentAchievements.length}</div>
            <div className="text-gray-600">Recent Achievements Earned</div>
          </div>
          
          {gamificationData.recentAchievements.length > 0 ? (
            gamificationData.recentAchievements.map((achievement) => (
              <div key={achievement.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{achievement.title}</h5>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        +{achievement.points} points
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.earnedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h4>
              <p className="text-gray-600 mb-4">Complete your first course to start earning achievements!</p>
              <Link 
                href="/courses"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {selectedTab === 'rewards' && (
        <div className="space-y-6">
          {/* Current Tier Benefits */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <Gift className="w-5 h-5 text-purple-600 mr-2" />
              Your Current Benefits
            </h4>
            <div className="space-y-3">
              {gamificationData.tierBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unlock Next Tier */}
          {gamificationData.pointsToNextTier > 0 && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg">Unlock Next Tier</h4>
                <Sparkles className="w-6 h-6 text-purple-200" />
              </div>
              <p className="text-purple-100 mb-4">
                Complete {gamificationData.nextTierTarget - gamificationData.qualificationCount} more courses to unlock premium benefits
              </p>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm text-purple-100 mb-2">Next Tier Benefits Include:</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm">Higher course discounts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm">Priority support access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm">Enhanced earning potential</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Points Shop Preview */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              Points Shop (Coming Soon)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg text-center opacity-50">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-gray-900">Course Discount</div>
                <div className="text-sm text-gray-600">500 points</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center opacity-50">
                <div className="text-2xl mb-2">📚</div>
                <div className="font-medium text-gray-900">Study Materials</div>
                <div className="text-sm text-gray-600">750 points</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center opacity-50">
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-medium text-gray-900">Certificate Frame</div>
                <div className="text-sm text-gray-600">1000 points</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center opacity-50">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-medium text-gray-900">Fast Track Slot</div>
                <div className="text-sm text-gray-600">1500 points</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <Clock className="w-4 h-4 mr-1" />
                Launching Soon
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Achievement Button (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 mb-2">Development Mode - Test Achievements:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => triggerAchievement(ACHIEVEMENTS.FIRST_COURSE)}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
            >
              First Course
            </button>
            <button
              onClick={() => triggerAchievement(ACHIEVEMENTS.TIER_SPECIALIST)}
              className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
            >
              Specialist Tier
            </button>
            <button
              onClick={() => triggerAchievement(ACHIEVEMENTS.TIER_EXPERT)}
              className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
            >
              Expert Tier
            </button>
          </div>
        </div>
      )}

      {/* Achievement Celebration Modal */}
      <AchievementCelebration
        achievement={achievement}
        isVisible={isVisible}
        onClose={closeAchievement}
      />
    </div>
  )
}