import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    // Simple database query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`

    // Try to count tenants
    const tenantCount = await prisma.tenant.count()

    // Try to count courses
    const courseCount = await prisma.course.count()

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      rawQuery: result,
      tenants: tenantCount,
      courses: courseCount
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
  }
}
