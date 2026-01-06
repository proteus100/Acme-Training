import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// JWT secret for jose library (used for student auth)
const JWT_SECRET_JOSE = new TextEncoder().encode(JWT_SECRET)

export interface AdminTokenPayload {
  adminId: string
  email: string
  role: string
  tenantId?: string | null // Optional tenant ID for tenant-scoped admins
}

export interface StudentTokenPayload {
  customerId: string
  tenantId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload
  } catch (error) {
    return null
  }
}

export async function getAdminFromToken(token: string) {
  const payload = verifyToken(token)
  if (!payload) return null

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.adminId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      tenantId: true, // Include tenant ID
    },
  })

  if (!admin || !admin.isActive) return null
  return admin
}

export async function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value
  if (!token) return null
  return getAdminFromToken(token)
}

export async function createDefaultAdmin() {
  const existingAdmin = await prisma.adminUser.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (existingAdmin) {
    return existingAdmin
  }

  // Get default password from environment or use secure fallback
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD

  if (!defaultPassword) {
    console.warn('⚠️  WARNING: DEFAULT_ADMIN_PASSWORD not set in environment variables!')
    console.warn('⚠️  Platform admin account will NOT be created automatically.')
    console.warn('⚠️  Please set DEFAULT_ADMIN_PASSWORD in your .env file and restart.')
    return null
  }

  // Validate password strength
  if (defaultPassword.length < 12) {
    throw new Error('DEFAULT_ADMIN_PASSWORD must be at least 12 characters long')
  }

  const hashedPassword = await hashPassword(defaultPassword)

  const admin = await prisma.adminUser.create({
    data: {
      email: 'admin@exeterdigitalagency.co.uk',
      passwordHash: hashedPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantId: null, // Platform admin - no tenant association
      isActive: true,
    }
  })

  console.log('✅ Default platform admin created:')
  console.log('📧 Email: admin@exeterdigitalagency.co.uk')
  console.log('🔐 Password: [Set from DEFAULT_ADMIN_PASSWORD env variable]')
  console.log('👑 Access: All tenants (Platform Admin)')
  console.log('⚠️  IMPORTANT: Change this password immediately after first login!')

  return admin
}

// ============================================
// Student Authentication Functions
// ============================================

export async function verifyStudentToken(token: string): Promise<StudentTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_JOSE)
    return payload as unknown as StudentTokenPayload
  } catch (error) {
    return null
  }
}

export async function getStudentFromToken(token: string) {
  const payload = await verifyStudentToken(token)
  if (!payload) return null

  const customer = await prisma.customer.findUnique({
    where: { id: payload.customerId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      company: true,
      companySize: true,
      jobTitle: true,
      address: true,
      city: true,
      postcode: true,
      isActive: true,
      tenantId: true,
    },
  })

  if (!customer || !customer.isActive) return null
  return customer
}

export async function getStudentFromRequest(request: NextRequest) {
  const token = request.cookies.get('student-auth-token')?.value
  if (!token) return null
  return getStudentFromToken(token)
}