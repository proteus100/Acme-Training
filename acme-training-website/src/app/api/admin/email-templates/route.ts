import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!admin.tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const reminderType = url.searchParams.get('reminderType')

    let whereClause: any = {
      tenantId: admin.tenantId
    }

    if (category && category !== 'all') {
      whereClause.category = category
    }

    if (reminderType && reminderType !== 'all') {
      whereClause.reminderType = reminderType
    }

    const templates = await prisma.emailTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isActive: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json(templates)

  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!admin.tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    // Only super admins and managers can create email templates
    if (!['SUPER_ADMIN', 'MANAGER'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const data = await request.json()

    const { name, category, reminderType, subject, htmlContent, textContent, isActive } = data

    if (!name || !reminderType || !subject || !htmlContent || !textContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if template with same name already exists for this tenant
    const existing = await prisma.emailTemplate.findUnique({
      where: {
        tenantId_name: {
          tenantId: admin.tenantId,
          name: name
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        tenantId: admin.tenantId,
        name,
        category: category || null,
        reminderType,
        subject,
        htmlContent,
        textContent,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(template)

  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Failed to create email template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}