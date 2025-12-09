import { NextRequest, NextResponse } from 'next/server'
import { getTopAchievers, getAchievementStats } from '@/lib/achievements'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (type === 'stats') {
      const stats = await getAchievementStats()
      return NextResponse.json(stats)
    }

    // Default: return top achievers
    const topAchievers = await getTopAchievers(limit)
    return NextResponse.json(topAchievers)

  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}