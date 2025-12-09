import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { CourseCategory } from '@prisma/client'
import { getTenantFilter, getTenantId } from '../../../lib/tenant'

function mapCategoryToEnum(category: string): CourseCategory {
  const categoryMap: Record<string, CourseCategory> = {
    'gas_safe': CourseCategory.GAS_SAFE,
    'heat_pump': CourseCategory.HEAT_PUMP,
    'oftec': CourseCategory.OFTEC,
    'lpg': CourseCategory.LPG,
    'vaporizing': CourseCategory.VAPORIZING,
    'water': CourseCategory.WATER,
    'fgas_air_conditioning': CourseCategory.FGAS_AIR_CONDITIONING,
    'commercial_catering': CourseCategory.COMMERCIAL_CATERING,
    'commercial_laundry': CourseCategory.COMMERCIAL_LAUNDRY,
    'commercial_gas': CourseCategory.COMMERCIAL_GAS,
    'commercial_core': CourseCategory.COMMERCIAL_CORE,
    'electrical': CourseCategory.ELECTRICAL,
    'refrigeration': CourseCategory.REFRIGERATION
  }
  return categoryMap[category] || CourseCategory.GAS_SAFE
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Get tenant filter for multi-tenancy
    const tenantFilter = await getTenantFilter()

    console.log('Category received:', category, 'Mapped to:', category ? mapCategoryToEnum(category) : 'null')
    console.log('Tenant filter:', tenantFilter)

    // Build where clause with tenant filter and optional category filter
    const whereClause = {
      ...tenantFilter,
      ...(category ? { category: mapCategoryToEnum(category) } : {})
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        sessions: {
          where: {
            isActive: true,
            startDate: {
              gte: new Date()
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Received course creation request:', JSON.stringify(data, null, 2))

    // Validate required fields
    if (!data.title || !data.description || !data.category || !data.duration || !data.price) {
      return NextResponse.json(
        { error: 'Title, description, category, duration, and price are required' },
        { status: 400 }
      )
    }

    // Get tenantId from the current request context (subdomain)
    let tenantId = await getTenantId()

    // If no tenant detected from subdomain, try to use provided tenantId (for platform admin)
    if (!tenantId && data.tenantId) {
      tenantId = data.tenantId
    }

    // If still no tenant, find first available tenant (fallback)
    if (!tenantId) {
      const firstTenant = await prisma.tenant.findFirst({
        where: { active: true },
        select: { id: true }
      })
      if (!firstTenant) {
        return NextResponse.json(
          { error: 'No active tenant found' },
          { status: 400 }
        )
      }
      tenantId = firstTenant.id
    }

    // Check if course title already exists for this tenant
    const existingCourse = await prisma.course.findUnique({
      where: {
        tenantId_title: {
          tenantId: tenantId,
          title: data.title
        }
      }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this title already exists' },
        { status: 409 }
      )
    }

    // Validate category
    const validCategories = [
      'GAS_SAFE', 'HEAT_PUMP', 'OFTEC', 'LPG', 'VAPORIZING', 'WATER',
      'FGAS_AIR_CONDITIONING', 'COMMERCIAL_CATERING', 'COMMERCIAL_LAUNDRY',
      'COMMERCIAL_GAS', 'COMMERCIAL_CORE', 'ELECTRICAL', 'REFRIGERATION', 'CUSTOM'
    ]
    if (!validCategories.includes(data.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate custom category name if CUSTOM is selected
    if (data.category === 'CUSTOM' && !data.customCategoryName) {
      return NextResponse.json(
        { error: 'Custom category name is required when category is CUSTOM' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (data.duration <= 0 || data.price < 0 || (data.maxStudents && data.maxStudents <= 0)) {
      return NextResponse.json(
        { error: 'Duration must be positive, price cannot be negative, maxStudents must be positive' },
        { status: 400 }
      )
    }

    console.log('Creating course with data:', {
      title: data.title,
      description: data.description,
      category: data.category,
      customCategoryName: data.category === 'CUSTOM' ? data.customCategoryName : null,
      duration: parseInt(data.duration),
      price: parseFloat(data.price),
      maxStudents: data.maxStudents ? parseInt(data.maxStudents) : 12,
      tenantId: tenantId
    })

    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        customCategoryName: data.category === 'CUSTOM' ? data.customCategoryName : null,
        duration: parseInt(data.duration),
        price: parseFloat(data.price),
        maxStudents: data.maxStudents ? parseInt(data.maxStudents) : 12,
        tenantId: tenantId
      },
      include: {
        sessions: true
      }
    })
    
    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    console.error('Error creating course:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    return NextResponse.json({
      error: 'Failed to create course',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}