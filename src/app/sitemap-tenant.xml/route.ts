import { NextRequest, NextResponse } from 'next/server'
import { getTenantByDomain } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  try {
    // Get tenant from domain/hostname
    const tenant = await getTenantByDomain(hostname)
    
    if (!tenant) {
      return new NextResponse('Tenant not found', { status: 404 })
    }

    // Get tenant's courses for dynamic URLs
    const courses = await prisma.course.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, slug: true, updatedAt: true }
    })

    // Parse tenant location data
    const serviceAreas = tenant.serviceAreas ? JSON.parse(tenant.serviceAreas) : []
    const mainServices = tenant.mainServices ? JSON.parse(tenant.mainServices) : []
    
    const baseUrl = tenant.domain ? `https://${tenant.domain}` : `https://${hostname}`
    
    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- About Page -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Courses Page -->
  <url>
    <loc>${baseUrl}/courses</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Individual Course Pages -->
  ${courses.map(course => `
  <url>
    <loc>${baseUrl}/courses/${course.slug}</loc>
    <lastmod>${course.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}

  <!-- Contact Page -->
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Booking Page -->
  <url>
    <loc>${baseUrl}/booking</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Service Area Pages for Local SEO -->
  ${serviceAreas.map((area: string) => `
  <url>
    <loc>${baseUrl}/${area.toLowerCase().replace(/\s+/g, '-')}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}

  <!-- Service-specific Landing Pages -->
  ${mainServices.map((service: string) => `
  <url>
    <loc>${baseUrl}/services/${service.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}

  <!-- Local Landing Pages (Service + Area combinations) -->
  ${serviceAreas.slice(0, 5).map((area: string) => 
    mainServices.slice(0, 3).map((service: string) => `
  <url>
    <loc>${baseUrl}/${service.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}-${area.toLowerCase().replace(/\s+/g, '-')}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')
  ).join('')}

</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    })

  } catch (error) {
    console.error('Error generating tenant sitemap:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST() {
  return new NextResponse('Method not allowed', { status: 405 })
}

export async function PUT() {
  return new NextResponse('Method not allowed', { status: 405 })
}

export async function DELETE() {
  return new NextResponse('Method not allowed', { status: 405 })
}