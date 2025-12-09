'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Award, Target, TrendingUp, Book, Calendar, Star } from 'lucide-react'

interface Achievement {
  customerId: string
  customerName: string
  email: string
  totalCourses: number
  achievementLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'ELITE'
  categories: string[]
  completedCourses: Array<{
    id: string
    title: string
    category: string
    completedAt: string
  }>
}

interface AchievementStats {
  totalStudents: number
  eliteStudents: number
  goldStudents: number
  silverStudents: number
  bronzeStudents: number
}

export default function StudentDashboard() {
  const [studentEmail, setStudentEmail] = useState('')
  const [achievement, setAchievement] = useState<Achievement | null>(null)
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/achievements?type=stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const lookupStudent = async () => {
    if (!studentEmail.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Demo data for testing - in real app this would come from API
      const demoData: { [key: string]: Achievement } = {
        'test@student.com': {
          customerId: '1',
          customerName: 'Test Student',
          email: 'test@student.com',
          totalCourses: 4,
          achievementLevel: 'GOLD',
          categories: ['GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG'],
          completedCourses: [
            {
              id: '1',
              title: 'Gas Safe Core',
              category: 'GAS_SAFE',
              completedAt: '2024-01-15T10:00:00Z'
            },
            {
              id: '2', 
              title: 'Heat Pump Installation',
              category: 'HEAT_PUMP',
              completedAt: '2024-02-20T10:00:00Z'
            },
            {
              id: '3',
              title: 'OFTEC Oil Boiler Training',
              category: 'OFTEC',
              completedAt: '2024-03-10T10:00:00Z'
            },
            {
              id: '4',
              title: 'LPG Installation',
              category: 'LPG', 
              completedAt: '2024-04-05T10:00:00Z'
            }
          ]
        },
        'elite@student.com': {
          customerId: '2',
          customerName: 'Elite Master',
          email: 'elite@student.com',
          totalCourses: 6,
          achievementLevel: 'ELITE',
          categories: ['GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG', 'FGAS_AIR_CONDITIONING', 'COMMERCIAL_CATERING'],
          completedCourses: [
            {
              id: '1',
              title: 'Gas Safe Core',
              category: 'GAS_SAFE',
              completedAt: '2023-10-15T10:00:00Z'
            },
            {
              id: '2',
              title: 'Heat Pump Installation',
              category: 'HEAT_PUMP', 
              completedAt: '2023-11-20T10:00:00Z'
            },
            {
              id: '3',
              title: 'OFTEC Oil Boiler Training',
              category: 'OFTEC',
              completedAt: '2023-12-10T10:00:00Z'
            },
            {
              id: '4',
              title: 'LPG Installation',
              category: 'LPG',
              completedAt: '2024-01-05T10:00:00Z'
            },
            {
              id: '5',
              title: 'F-Gas Air Conditioning',
              category: 'FGAS_AIR_CONDITIONING',
              completedAt: '2024-02-15T10:00:00Z'
            },
            {
              id: '6',
              title: 'Commercial Catering Gas',
              category: 'COMMERCIAL_CATERING',
              completedAt: '2024-03-20T10:00:00Z'
            }
          ]
        },
        'bronze@student.com': {
          customerId: '3',
          customerName: 'Bronze Beginner',
          email: 'bronze@student.com',
          totalCourses: 1,
          achievementLevel: 'BRONZE',
          categories: ['GAS_SAFE'],
          completedCourses: [
            {
              id: '1',
              title: 'Gas Safe Core',
              category: 'GAS_SAFE',
              completedAt: '2024-04-20T10:00:00Z'
            }
          ]
        }
      }

      const foundStudent = demoData[studentEmail.toLowerCase()]
      if (foundStudent) {
        setAchievement(foundStudent)
        setError('')
      } else {
        // Try to call the real API as fallback
        try {
          const response = await fetch(`/api/achievements/student?email=${encodeURIComponent(studentEmail)}`)
          
          if (response.ok) {
            const data = await response.json()
            setAchievement(data)
          } else {
            setError('Student not found. Try one of these test emails: test@student.com, elite@student.com, bronze@student.com')
            setAchievement(null)
          }
        } catch (apiError) {
          setError('Student not found. Try one of these test emails: test@student.com, elite@student.com, bronze@student.com')
          setAchievement(null)
        }
      }
    } catch (error) {
      setError('Error looking up student progress')
      setAchievement(null)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementBadge = (level: string) => {
    switch (level) {
      case 'ELITE': return { emoji: '🏆', label: 'ELITE', color: 'bg-yellow-500 text-white' }
      case 'GOLD': return { emoji: '🥇', label: 'GOLD', color: 'bg-yellow-400 text-gray-800' }
      case 'SILVER': return { emoji: '🥈', label: 'SILVER', color: 'bg-gray-400 text-white' }
      case 'BRONZE': return { emoji: '🥉', label: 'BRONZE', color: 'bg-amber-600 text-white' }
      default: return { emoji: '📚', label: 'STUDENT', color: 'bg-blue-500 text-white' }
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'GAS_SAFE': return 'Gas Safe'
      case 'HEAT_PUMP': return 'Heat Pump'
      case 'OFTEC': return 'OFTEC'
      case 'LPG': return 'LPG'
      case 'FGAS_AIR_CONDITIONING': return 'F-Gas Air Conditioning'
      case 'COMMERCIAL_CATERING': return 'Commercial Catering'
      case 'COMMERCIAL_LAUNDRY': return 'Commercial Laundry'
      case 'COMMERCIAL_GAS': return 'Commercial Gas'
      case 'COMMERCIAL_CORE': return 'Commercial Core'
      case 'WATER': return 'Water'
      case 'VAPORIZING': return 'Vaporizing'
      default: return category.replace(/_/g, ' ')
    }
  }

  const getNextLevelInfo = (currentLevel: string, courseCount: number) => {
    switch (currentLevel) {
      case 'BRONZE':
        return { nextLevel: 'SILVER', needed: Math.max(0, 2 - courseCount), total: 2 }
      case 'SILVER':
        return { nextLevel: 'GOLD', needed: Math.max(0, 4 - courseCount), total: 4 }
      case 'GOLD':
        return { nextLevel: 'ELITE', needed: Math.max(0, 6 - courseCount), total: 6 }
      case 'ELITE':
        return { nextLevel: 'MASTER', needed: 0, total: courseCount }
      default:
        return { nextLevel: 'BRONZE', needed: Math.max(0, 1 - courseCount), total: 1 }
    }
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
              <Link href="/booking" className="hover:text-blue-200">Book Now</Link>
              <Link href="/contact" className="hover:text-blue-200">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Student Achievement Dashboard</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track your training progress and see how you compare with other students
          </p>
        </div>

        {/* Student Lookup */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Check Your Progress</h3>
            <div className="flex gap-3">
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && lookupStudent()}
              />
              <button
                onClick={lookupStudent}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                {loading ? 'Looking...' : 'Lookup'}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Enter the email you used to book courses
            </p>
            
            {/* Test Email Addresses */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">🧪 Try these test emails:</p>
              <div className="space-y-1 text-xs">
                <button 
                  onClick={() => setStudentEmail('test@student.com')}
                  className="block text-blue-700 hover:text-blue-900 hover:underline w-full text-left"
                >
                  📧 test@student.com (🥇 Gold - 4 courses)
                </button>
                <button 
                  onClick={() => setStudentEmail('elite@student.com')}
                  className="block text-blue-700 hover:text-blue-900 hover:underline w-full text-left"
                >
                  📧 elite@student.com (🏆 Elite - 6 courses)
                </button>
                <button 
                  onClick={() => setStudentEmail('bronze@student.com')}
                  className="block text-blue-700 hover:text-blue-900 hover:underline w-full text-left"
                >
                  📧 bronze@student.com (🥉 Bronze - 1 course)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Student Achievement Display */}
        {achievement && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  {achievement.customerName.split(' ').map(n => n[0]).join('')}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{achievement.customerName}</h2>
                
                {/* Achievement Badge */}
                <div className="inline-flex items-center mb-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${getAchievementBadge(achievement.achievementLevel).color}`}>
                    {getAchievementBadge(achievement.achievementLevel).emoji} {getAchievementBadge(achievement.achievementLevel).label}
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <Book className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{achievement.totalCourses}</div>
                    <div className="text-gray-600">Courses Completed</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-green-50 rounded-lg p-4">
                    <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{achievement.categories.length}</div>
                    <div className="text-gray-600">Categories Mastered</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const nextLevel = getNextLevelInfo(achievement.achievementLevel, achievement.totalCourses)
                        return nextLevel.needed === 0 ? 'MAX!' : nextLevel.needed
                      })()}
                    </div>
                    <div className="text-gray-600">To Next Level</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {achievement.achievementLevel !== 'ELITE' && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress to Next Level</span>
                    <span className="text-sm text-gray-500">
                      {(() => {
                        const nextLevel = getNextLevelInfo(achievement.achievementLevel, achievement.totalCourses)
                        return `${achievement.totalCourses}/${nextLevel.total} courses`
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(() => {
                          const nextLevel = getNextLevelInfo(achievement.achievementLevel, achievement.totalCourses)
                          return Math.min(100, (achievement.totalCourses / nextLevel.total) * 100)
                        })()}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Your Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {achievement.categories.map(category => (
                    <span 
                      key={category}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {getCategoryName(category)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Completed Courses */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Completed Courses</h3>
                <div className="space-y-3">
                  {achievement.completedCourses.map(course => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-600">{getCategoryName(course.category)}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(course.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center">
                <Link 
                  href="/courses" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                >
                  Continue Learning
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        {stats && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-center mb-6">Student Achievement Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.eliteStudents}</div>
                  <div className="text-sm text-gray-600">🏆 Elite</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.goldStudents}</div>
                  <div className="text-sm text-gray-600">🥇 Gold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{stats.silverStudents}</div>
                  <div className="text-sm text-gray-600">🥈 Silver</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.bronzeStudents}</div>
                  <div className="text-sm text-gray-600">🥉 Bronze</div>
                </div>
              </div>
              <div className="text-center mt-4 pt-4 border-t">
                <div className="text-lg font-semibold text-gray-900">{stats.totalStudents} Total Achievers</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}