import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { getAllRateLimits, clearRateLimit, clearAllRateLimits } from '@/lib/security/rate-limiter'

// GET - List all rate-limited identifiers
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can view rate limits
    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can view rate limits' },
        { status: 403 }
      )
    }

    const rateLimits = getAllRateLimits()

    return NextResponse.json({
      success: true,
      rateLimits,
      total: rateLimits.length,
      blocked: rateLimits.filter(r => r.blocked).length
    })
  } catch (error) {
    console.error('Error fetching rate limits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate limits' },
      { status: 500 }
    )
  }
}

// DELETE - Clear rate limit for specific identifier or all
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can clear rate limits
    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can clear rate limits' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const identifier = searchParams.get('identifier')
    const clearAll = searchParams.get('all') === 'true'

    if (clearAll) {
      const count = clearAllRateLimits()
      return NextResponse.json({
        success: true,
        message: `Cleared all rate limits (${count} entries)`,
        clearedCount: count
      })
    }

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier parameter required' },
        { status: 400 }
      )
    }

    clearRateLimit(identifier)

    return NextResponse.json({
      success: true,
      message: `Rate limit cleared for ${identifier}`,
      identifier
    })
  } catch (error) {
    console.error('Error clearing rate limit:', error)
    return NextResponse.json(
      { error: 'Failed to clear rate limit' },
      { status: 500 }
    )
  }
}
