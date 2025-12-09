import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const tenant = await prisma.tenant.findUnique({
      where: { 
        slug: slug,
        active: true
      },
      include: {
        courses: {
          include: {
            sessions: {
              where: {
                isActive: true,
                startDate: {
                  gte: new Date()
                }
              },
              take: 5,
              orderBy: {
                startDate: 'asc'
              }
            }
          }
        },
        _count: {
          select: {
            courses: true,
            customers: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tenant
    })

  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}