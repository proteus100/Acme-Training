import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../lib/auth'

const prisma = new PrismaClient()

// GET /api/admin/settings - Get platform settings
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create default platform settings
    let settings = await prisma.platformSettings.findUnique({
      where: { id: 'main' }
    })

    if (!settings) {
      // Create default platform settings if they don't exist
      settings = await prisma.platformSettings.create({
        data: { id: 'main' }
      })
    }

    // Don't return sensitive keys in response
    const safeSettings = {
      ...settings,
      stripeSecretKey: settings.stripeSecretKey ? '••••••••' : null,
      stripeWebhookSecret: settings.stripeWebhookSecret ? '••••••••' : null,
      smtpPassword: settings.smtpPassword ? '••••••••' : null
    }

    return NextResponse.json(safeSettings)
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN and MANAGER can modify platform settings
    if (!['SUPER_ADMIN', 'MANAGER'].includes(admin.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const data = await request.json()

    // Validate trial days
    if (data.trialDays !== undefined && (data.trialDays < 0 || data.trialDays > 90)) {
      return NextResponse.json(
        { error: 'Trial days must be between 0 and 90' },
        { status: 400 }
      )
    }

    // Validate default plan
    if (data.defaultPlan && !['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(data.defaultPlan)) {
      return NextResponse.json(
        { error: 'Invalid default plan' },
        { status: 400 }
      )
    }

    if (data.smtpPort && (data.smtpPort < 1 || data.smtpPort > 65535)) {
      return NextResponse.json(
        { error: 'SMTP port must be between 1 and 65535' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (data.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.supportEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format for support email' },
        { status: 400 }
      )
    }

    if (data.smtpUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.smtpUser)) {
      return NextResponse.json(
        { error: 'Invalid email format for SMTP user' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Only update fields that are provided
    if (data.companyName !== undefined) updateData.companyName = data.companyName
    if (data.supportEmail !== undefined) updateData.supportEmail = data.supportEmail
    if (data.trialDays !== undefined) updateData.trialDays = parseInt(data.trialDays)
    if (data.defaultPlan !== undefined) updateData.defaultPlan = data.defaultPlan
    if (data.maintenanceMode !== undefined) updateData.maintenanceMode = Boolean(data.maintenanceMode)
    if (data.emailNotificationsEnabled !== undefined) updateData.emailNotificationsEnabled = Boolean(data.emailNotificationsEnabled)
    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost
    if (data.smtpPort !== undefined) updateData.smtpPort = parseInt(data.smtpPort)
    if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser
    if (data.smtpSecure !== undefined) updateData.smtpSecure = Boolean(data.smtpSecure)

    // Handle sensitive fields - only update if provided and not masked
    if (data.stripePublishableKey !== undefined) updateData.stripePublishableKey = data.stripePublishableKey
    if (data.stripeSecretKey && data.stripeSecretKey !== '••••••••') {
      updateData.stripeSecretKey = data.stripeSecretKey
    }
    if (data.stripeWebhookSecret && data.stripeWebhookSecret !== '••••••••') {
      updateData.stripeWebhookSecret = data.stripeWebhookSecret
    }
    if (data.smtpPassword && data.smtpPassword !== '••••••••') {
      updateData.smtpPassword = data.smtpPassword
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: 'main' },
      update: updateData,
      create: {
        id: 'main',
        ...updateData
      }
    })

    // Don't return sensitive keys in response
    const safeSettings = {
      ...settings,
      stripeSecretKey: settings.stripeSecretKey ? '••••••••' : null,
      stripeWebhookSecret: settings.stripeWebhookSecret ? '••••••••' : null,
      smtpPassword: settings.smtpPassword ? '••••••••' : null
    }

    return NextResponse.json(safeSettings)
  } catch (error) {
    console.error('Error updating platform settings:', error)
    return NextResponse.json(
      { error: 'Failed to update platform settings' },
      { status: 500 }
    )
  }
}