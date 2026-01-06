import { prisma } from '@/lib/prisma'
import { CourseCategory, AchievementLevel } from '@prisma/client'

export interface StudentAchievement {
  customerId: string
  customerName: string
  email: string
  totalCourses: number
  achievementLevel: AchievementLevel
  categories: CourseCategory[]
  completedCourses: Array<{
    id: string
    title: string
    category: CourseCategory
    completedAt: Date
  }>
  isPublicShowcase: boolean // For homepage display
}

export interface AchievementStats {
  totalStudents: number
  eliteStudents: number
  goldStudents: number
  silverStudents: number
  bronzeStudents: number
}

export function calculateAchievementLevel(courseCount: number, categories: CourseCategory[]): AchievementLevel {
  const uniqueCategories = [...new Set(categories)].length
  
  // Elite: 6+ courses AND multiple categories (cross-training)
  if (courseCount >= 6 && uniqueCategories >= 3) {
    return AchievementLevel.ELITE
  }
  
  // Gold: 4-5 courses OR strong multi-category presence
  if (courseCount >= 4 || (courseCount >= 3 && uniqueCategories >= 2)) {
    return AchievementLevel.GOLD
  }
  
  // Silver: 2-3 courses
  if (courseCount >= 2) {
    return AchievementLevel.SILVER
  }
  
  // Bronze: 1 course
  return AchievementLevel.BRONZE
}

export function getAchievementBadge(level: AchievementLevel): {
  emoji: string
  label: string
  color: string
  bgColor: string
} {
  switch (level) {
    case AchievementLevel.ELITE:
      return { 
        emoji: '🏆', 
        label: 'ELITE', 
        color: 'text-yellow-800', 
        bgColor: 'bg-yellow-500' 
      }
    case AchievementLevel.GOLD:
      return { 
        emoji: '🥇', 
        label: 'GOLD', 
        color: 'text-yellow-700', 
        bgColor: 'bg-yellow-400' 
      }
    case AchievementLevel.SILVER:
      return { 
        emoji: '🥈', 
        label: 'SILVER', 
        color: 'text-gray-700', 
        bgColor: 'bg-gray-400' 
      }
    case AchievementLevel.BRONZE:
      return { 
        emoji: '🥉', 
        label: 'BRONZE', 
        color: 'text-amber-700', 
        bgColor: 'bg-amber-600' 
      }
  }
}

export async function updateStudentAchievements(customerId: string): Promise<void> {
  // Get all completed bookings for this student
  const completedBookings = await prisma.booking.findMany({
    where: {
      customerId,
      status: 'COMPLETED'
    },
    include: {
      session: {
        include: {
          course: true
        }
      }
    }
  })

  // Create achievements for each completed course
  for (const booking of completedBookings) {
    const course = booking.session.course
    const categories = completedBookings.map(b => b.session.course.category)
    const achievementLevel = calculateAchievementLevel(completedBookings.length, categories)

    // Upsert achievement (create or update)
    await prisma.achievement.upsert({
      where: {
        customerId_courseId: {
          customerId,
          courseId: course.id
        }
      },
      update: {
        level: achievementLevel,
        category: course.category
      },
      create: {
        customerId,
        courseId: course.id,
        level: achievementLevel,
        category: course.category
      }
    })
  }
}

export async function getStudentAchievements(customerId: string): Promise<StudentAchievement | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      achievements: {
        include: {
          course: true
        },
        orderBy: {
          achievedAt: 'desc'
        }
      }
    }
  })

  if (!customer || customer.achievements.length === 0) {
    return null
  }

  const totalCourses = customer.achievements.length
  const categories = customer.achievements.map(a => a.category)
  const achievementLevel = calculateAchievementLevel(totalCourses, categories)

  return {
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    email: customer.email,
    totalCourses,
    achievementLevel,
    categories: [...new Set(categories)],
    completedCourses: customer.achievements.map(a => ({
      id: a.course.id,
      title: a.course.title,
      category: a.course.category,
      completedAt: a.achievedAt
    })),
    isPublicShowcase: totalCourses >= 4 // Only show high achievers publicly
  }
}

export async function getTopAchievers(limit: number = 10): Promise<StudentAchievement[]> {
  const topCustomers = await prisma.customer.findMany({
    include: {
      achievements: {
        include: {
          course: true
        }
      }
    }
  })

  const achievers = await Promise.all(
    topCustomers.map(async (customer) => {
      if (customer.achievements.length === 0) return null
      
      const totalCourses = customer.achievements.length
      const categories = customer.achievements.map(a => a.category)
      const achievementLevel = calculateAchievementLevel(totalCourses, categories)

      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        totalCourses,
        achievementLevel,
        categories: [...new Set(categories)],
        completedCourses: customer.achievements.map(a => ({
          id: a.course.id,
          title: a.course.title,
          category: a.course.category,
          completedAt: a.achievedAt
        })),
        isPublicShowcase: totalCourses >= 4
      }
    })
  )

  return achievers
    .filter((achiever): achiever is StudentAchievement => 
      achiever !== null && achiever.isPublicShowcase
    )
    .sort((a, b) => {
      // Sort by achievement level, then by course count
      const levelOrder = { 
        [AchievementLevel.ELITE]: 4, 
        [AchievementLevel.GOLD]: 3, 
        [AchievementLevel.SILVER]: 2, 
        [AchievementLevel.BRONZE]: 1 
      }
      
      if (levelOrder[a.achievementLevel] !== levelOrder[b.achievementLevel]) {
        return levelOrder[b.achievementLevel] - levelOrder[a.achievementLevel]
      }
      
      return b.totalCourses - a.totalCourses
    })
    .slice(0, limit)
}

export async function getAchievementStats(): Promise<AchievementStats> {
  const allAchievers = await prisma.customer.findMany({
    include: {
      achievements: true
    }
  })

  let eliteCount = 0
  let goldCount = 0
  let silverCount = 0
  let bronzeCount = 0
  let totalCount = 0

  for (const customer of allAchievers) {
    if (customer.achievements.length === 0) continue
    
    totalCount++
    const categories = customer.achievements.map(a => a.category)
    const level = calculateAchievementLevel(customer.achievements.length, categories)
    
    switch (level) {
      case AchievementLevel.ELITE: eliteCount++; break
      case AchievementLevel.GOLD: goldCount++; break
      case AchievementLevel.SILVER: silverCount++; break
      case AchievementLevel.BRONZE: bronzeCount++; break
    }
  }

  return {
    totalStudents: totalCount,
    eliteStudents: eliteCount,
    goldStudents: goldCount,
    silverStudents: silverCount,
    bronzeStudents: bronzeCount
  }
}