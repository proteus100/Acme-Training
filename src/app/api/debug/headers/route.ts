import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const headersList = await headers()
  const allHeaders = Object.fromEntries(Array.from(headersList.entries()))

  return NextResponse.json({
    message: 'Debug endpoint - showing all request headers',
    headers: allHeaders,
    critical: {
      host: headersList.get('host'),
      'x-forwarded-host': headersList.get('x-forwarded-host'),
      'x-tenant-subdomain': headersList.get('x-tenant-subdomain'),
      'x-tenant-slug': headersList.get('x-tenant-slug'),
      'x-demo-mode': headersList.get('x-demo-mode'),
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  })
}
