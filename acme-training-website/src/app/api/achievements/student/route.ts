import { NextRequest, NextResponse } from 'next/server'
import { getStudentAchievements } from '@/lib/achievements'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get their achievements
    const achievements = await getStudentAchievements(customer.id)
    
    if (!achievements) {
      return NextResponse.json(
        { error: 'No achievements found for this student' },
        { status: 404 }
      )
    }

    return NextResponse.json(achievements)

  } catch (error) {
    console.error('Error fetching student achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}