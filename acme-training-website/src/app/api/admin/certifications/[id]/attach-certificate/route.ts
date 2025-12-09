import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAdminFromRequest } from '../../../../../../lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
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

    const resolvedParams = await params
    const { id } = resolvedParams

    // Find the achievement/certification
    const achievement = await prisma.achievement.findUnique({
      where: { id },
      include: {
        customer: true,
        course: true
      }
    })

    if (!achievement) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('certificate') as File
    const certificateNumber = formData.get('certificateNumber') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and image files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 10MB allowed.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const fileName = `cert_${achievement.id}_${Date.now()}${fileExtension}`
    const filePath = path.join(uploadDir, fileName)
    const relativePath = `/uploads/certificates/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update achievement record with certificate info
    // For now, we'll store the file path in certificateNumber field since we can't add new fields
    const certificateData = JSON.stringify({
      filePath: relativePath,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      certificateNumber: certificateNumber || achievement.certificateNumber
    })

    await prisma.achievement.update({
      where: { id },
      data: {
        certificateNumber: certificateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Certificate uploaded successfully',
      filePath: relativePath
    })

  } catch (error) {
    console.error('Error uploading certificate:', error)
    return NextResponse.json(
      { error: 'Failed to upload certificate' },
      { status: 500 }
    )
  }
}