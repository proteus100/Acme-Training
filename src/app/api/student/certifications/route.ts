import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/nextauth'
import { prisma } from '../../../../lib/prisma'
import { getStudentFromRequest } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Try JWT authentication first (email/password users)
    const studentFromJWT = await getStudentFromRequest(request)

    let customerId: string | undefined

    if (studentFromJWT) {
      // Email/password user - we have their ID from JWT
      customerId = studentFromJWT.id
    } else {
      // Fall back to NextAuth session (Google Sign-In users)
      const session = await getServerSession(authOptions)

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Find the customer using findFirst instead of findUnique
      const customer = await prisma.customer.findFirst({
        where: { email: session.user.email }
      })

      customerId = customer?.id
    }

    if (!customerId) {
      return NextResponse.json([]) // Return empty array if no customer found
    }

    // Get all achievements (certifications) for this customer
    const achievements = await prisma.achievement.findMany({
      where: { customerId: customerId },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            category: true,
          }
        }
      },
      orderBy: {
        certificationDate: 'desc'
      }
    })

    // Transform achievements into certification format
    const certifications = achievements.map(achievement => {
      const issuedDate = achievement.certificationDate
      // Use expiryDate from achievement or calculate if null
      const expiryDate = achievement.expiryDate || (() => {
        const calculatedExpiry = new Date(issuedDate)
        calculatedExpiry.setFullYear(calculatedExpiry.getFullYear() + 5) // Default 5 years for gas certificates
        return calculatedExpiry
      })()
      
      // Determine status based on expiry date
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
      
      let status: 'active' | 'expiring' | 'expired'
      if (achievement.isExpired || daysUntilExpiry < 0) {
        status = 'expired'
      } else if (daysUntilExpiry <= 90) {
        status = 'expiring'
      } else {
        status = 'active'
      }

      return {
        id: achievement.id,
        name: achievement.course?.title || 'Unknown Certification',
        issuedDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status,
        certificateUrl: achievement.certificateNumber ? `/certificates/${achievement.certificateNumber}.pdf` : null,
        description: achievement.course?.description,
        type: achievement.course?.category,
      }
    })

    return NextResponse.json(certifications)
  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}