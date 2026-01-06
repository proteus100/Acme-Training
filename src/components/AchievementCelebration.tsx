'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Star,
  Crown,
  Award,
  Zap,
  Heart,
  Target,
  Sparkles,
  Gift,
  Flame,
  ChevronUp,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

interface Achievement {
  id: string
  type: 'course_completion' | 'tier_advancement' | 'streak_milestone' | 'bundle_completion'
  title: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  points: number
  specialReward?: string
  tierLevel?: string
  course?: string
}

interface AchievementCelebrationProps {
  achievement: Achievement | null
  isVisible: boolean
  onClose: () => void
}

const confettiColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

// Confetti animation component
function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  return (
    <div
      className="absolute w-2 h-2 opacity-90"
      style={{
        backgroundColor: color,
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        animation: 'confetti-fall 3s ease-out forwards'
      }}
    />
  )
}

// Floating elements animation
function FloatingElement({ icon: Icon, delay, color }: { icon: React.ElementType; delay: number; color: string }) {
  return (
    <div
      className={`absolute opacity-60 ${color}`}
      style={{
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
        animationDelay: `${delay}s`,
        animation: 'float-up 4s ease-out forwards'
      }}
    >
      <Icon className="w-6 h-6" />
    </div>
  )
}

export default function AchievementCelebration({
  achievement,
  isVisible,
  onClose
}: AchievementCelebrationProps) {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter')

  useEffect(() => {
    if (isVisible && achievement) {
      setAnimationPhase('enter')
      
      // Enter animation
      const enterTimer = setTimeout(() => {
        setAnimationPhase('celebrate')
      }, 300)
      
      // Auto close after celebration
      const celebrateTimer = setTimeout(() => {
        setAnimationPhase('exit')
      }, 4000)
      
      const exitTimer = setTimeout(() => {
        onClose()
      }, 4500)

      return () => {
        clearTimeout(enterTimer)
        clearTimeout(celebrateTimer)
        clearTimeout(exitTimer)
      }
    }
  }, [isVisible, achievement, onClose])

  if (!isVisible || !achievement) return null

  const Icon = achievement.icon

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div 
          className={`
            relative max-w-md w-full mx-4 transform transition-all duration-500 ease-out
            ${animationPhase === 'enter' ? 'scale-50 opacity-0' : ''}
            ${animationPhase === 'celebrate' ? 'scale-100 opacity-100' : ''}
            ${animationPhase === 'exit' ? 'scale-110 opacity-0' : ''}
          `}
        >
          {/* Main Achievement Card */}
          <div className={`
            bg-white rounded-2xl shadow-2xl overflow-hidden relative
            ${animationPhase === 'celebrate' ? 'animate-pulse-gentle' : ''}
          `}>
            {/* Confetti */}
            {animationPhase === 'celebrate' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 30 }, (_, i) => (
                  <ConfettiPiece
                    key={i}
                    delay={i * 0.1}
                    color={confettiColors[i % confettiColors.length]}
                  />
                ))}
              </div>
            )}

            {/* Floating Icons */}
            {animationPhase === 'celebrate' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <FloatingElement icon={Sparkles} delay={0.5} color="text-yellow-400" />
                <FloatingElement icon={Star} delay={1} color="text-blue-400" />
                <FloatingElement icon={Heart} delay={1.5} color="text-pink-400" />
                <FloatingElement icon={Trophy} delay={2} color="text-yellow-500" />
                <FloatingElement icon={Zap} delay={2.5} color="text-purple-400" />
              </div>
            )}

            {/* Header with gradient */}
            <div className={`
              bg-gradient-to-r ${achievement.gradient} p-8 text-center text-white relative overflow-hidden
            `}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white/10"
                    style={{
                      width: `${Math.random() * 60 + 20}px`,
                      height: `${Math.random() * 60 + 20}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`
                    }}
                  />
                ))}
              </div>

              {/* Achievement Icon */}
              <div className={`
                relative mx-auto mb-4 w-20 h-20 bg-white/20 rounded-full flex items-center justify-center
                ${animationPhase === 'celebrate' ? 'animate-bounce' : ''}
              `}>
                <Icon className="w-10 h-10 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-2">{achievement.title}</h2>
              <p className="text-sm opacity-90">{achievement.description}</p>

              {/* Achievement Type Badge */}
              <div className="inline-flex items-center mt-3 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                <CheckCircle className="w-3 h-3 mr-1" />
                {achievement.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Points Earned */}
              <div className="text-center mb-6">
                <div className={`
                  inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${achievement.gradient} text-white font-bold text-xl mb-3
                  ${animationPhase === 'celebrate' ? 'animate-pulse' : ''}
                `}>
                  +{achievement.points}
                </div>
                <p className="text-gray-600">Points Earned</p>
              </div>

              {/* Special Rewards */}
              {achievement.specialReward && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Special Reward!</span>
                  </div>
                  <p className="text-yellow-800 text-sm">{achievement.specialReward}</p>
                </div>
              )}

              {/* Tier Advancement */}
              {achievement.tierLevel && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <ChevronUp className="w-5 h-5 text-purple-600" />
                    <Crown className="w-5 h-5 text-purple-600" />
                    <ChevronUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-center font-semibold text-purple-900">Tier Advanced!</p>
                  <p className="text-center text-purple-800 text-sm">You are now a {achievement.tierLevel}</p>
                </div>
              )}

              {/* Course Information */}
              {achievement.course && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Course Completed</span>
                  </div>
                  <p className="text-blue-800 text-sm">{achievement.course}</p>
                </div>
              )}

              {/* Progress Indicators */}
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span>Goal Achieved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Progress Made</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Streak Active</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Share achievement logic could go here
                    onClose()
                  }}
                  className={`
                    flex-1 bg-gradient-to-r ${achievement.gradient} hover:opacity-90 text-white py-3 px-4 rounded-lg font-semibold transition-opacity flex items-center justify-center space-x-2
                  `}
                >
                  <Star className="w-4 h-4" />
                  <span>Share Achievement</span>
                </button>
              </div>

              {/* Social Proof */}
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>🎉 Join 2,847+ students who've earned this achievement!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes animate-pulse-gentle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        .animate-pulse-gentle {
          animation: animate-pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

// Hook for triggering achievements
export function useAchievementCelebration() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const triggerAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement)
    setIsVisible(true)
  }

  const closeAchievement = () => {
    setIsVisible(false)
    setTimeout(() => setCurrentAchievement(null), 500)
  }

  return {
    achievement: currentAchievement,
    isVisible,
    triggerAchievement,
    closeAchievement
  }
}

// Predefined achievements for easy use
export const ACHIEVEMENTS = {
  FIRST_COURSE: {
    id: 'first-course',
    type: 'course_completion' as const,
    title: 'First Steps Taken!',
    description: 'You completed your first training course',
    icon: Award,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    points: 100,
    specialReward: '10% discount on next course booking'
  },
  TIER_SPECIALIST: {
    id: 'tier-specialist',
    type: 'tier_advancement' as const,
    title: 'Specialist Achieved!',
    description: 'Welcome to the Specialist tier',
    icon: Star,
    color: 'blue',
    gradient: 'from-blue-500 to-purple-600',
    points: 150,
    tierLevel: 'Specialist',
    specialReward: 'Priority booking access unlocked'
  },
  TIER_MULTI_TRADE: {
    id: 'tier-multi-trade',
    type: 'tier_advancement' as const,
    title: 'Multi-Trade Professional!',
    description: 'You have mastered multiple trades',
    icon: Award,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    points: 250,
    tierLevel: 'Multi-Trade Professional',
    specialReward: '15% discount on all future courses'
  },
  TIER_MASTER: {
    id: 'tier-master',
    type: 'tier_advancement' as const,
    title: 'Master Technician!',
    description: 'Elite professional status achieved',
    icon: Crown,
    color: 'purple',
    gradient: 'from-purple-600 to-pink-600',
    points: 400,
    tierLevel: 'Master Technician',
    specialReward: 'Industry conference invite + mentoring opportunities'
  },
  TIER_EXPERT: {
    id: 'tier-expert',
    type: 'tier_advancement' as const,
    title: 'Industry Expert!',
    description: 'You have reached the pinnacle of expertise',
    icon: Trophy,
    color: 'yellow',
    gradient: 'from-yellow-500 via-orange-500 to-red-500',
    points: 500,
    tierLevel: 'Industry Expert',
    specialReward: 'Teaching opportunities + revenue sharing programs'
  },
  STREAK_WEEK: {
    id: 'streak-week',
    type: 'streak_milestone' as const,
    title: 'Week Streak!',
    description: 'Active learning for 7 days straight',
    icon: Flame,
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    points: 75,
    specialReward: 'Study materials bonus pack'
  },
  BUNDLE_COMPLETE: {
    id: 'bundle-complete',
    type: 'bundle_completion' as const,
    title: 'Bundle Master!',
    description: 'Completed an entire course bundle',
    icon: Gift,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    points: 300,
    specialReward: 'Free business consultation + tool voucher'
  }
}