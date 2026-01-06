import { NextResponse } from 'next/server'
import { clearTenantCache } from '@/lib/tenant'

export async function POST() {
  try {
    clearTenantCache()
    
    return NextResponse.json({
      success: true,
      message: 'Tenant cache cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}