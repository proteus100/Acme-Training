import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/admin/reset-password/confirm
// Validates token and sets new password
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters long' },
        { status: 400 }
      )
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'This reset link has expired' },
        { status: 400 }
      )
    }

    // Find admin user with tenant info
    const admin = await prisma.adminUser.findUnique({
      where: { email: resetToken.email },
      include: { tenant: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update admin password and mark token as used
    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          passwordHash,
          isActive: true,
          lastLoginAt: new Date()
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json(
      {
        message: 'Password set successfully',
        tenantId: admin.tenantId,
        tenantSlug: admin.tenant?.slug,
        email: admin.email
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error confirming password reset:', error)
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    )
  }
}
