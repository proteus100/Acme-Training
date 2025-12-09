import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../../lib/auth'

const prisma = new PrismaClient()

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const admin = await getAdminFromRequest(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Only super admins and managers can update email templates
    if (!['SUPER_ADMIN', 'MANAGER'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { id } = resolvedParams
    const data = await request.json()
    
    const { name, category, reminderType, subject, htmlContent, textContent, isActive } = data

    if (!name || !reminderType || !subject || !htmlContent || !textContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if template exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if another template with same name exists (excluding current)
    if (name !== existing.name) {
      const nameConflict = await prisma.emailTemplate.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Template with this name already exists' },
          { status: 409 }
        )
      }
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
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
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Failed to update email template' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const admin = await getAdminFromRequest(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Only super admins and managers can delete email templates
    if (!['SUPER_ADMIN', 'MANAGER'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    // Check if template exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    await prisma.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Template deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Failed to delete email template' }, 
      { status: 500 }
    )
  }
}