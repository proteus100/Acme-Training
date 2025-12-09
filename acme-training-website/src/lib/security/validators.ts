/**
 * Input Validation Schemas
 * Using Zod for runtime type validation and sanitization
 */

import { z } from 'zod'
import validator from 'validator'

// ====================
// Custom Validators
// ====================

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .transform((email) => validator.normalizeEmail(email) || email)

const phoneSchema = z
  .string()
  .optional()
  .transform((phone) => (phone ? validator.trim(phone) : phone))

const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => validator.isURL(url), 'Invalid URL')

const slugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be hex color like #FF0000)')

// ====================
// Auth Schemas
// ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50)
})

// ====================
// Tenant Schemas
// ====================

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(100),
  slug: slugSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  logo: urlSchema.optional(),
  domain: z.string().optional(),
  planType: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  businessType: z.string().optional()
})

export const updateTenantSchema = createTenantSchema.partial().extend({
  active: z.boolean().optional()
})

// ====================
// Course Schemas
// ====================

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  maxStudents: z.number().min(1, 'Max students must be at least 1'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  prerequisites: z.string().optional(),
  certificationName: z.string().optional()
})

export const updateCourseSchema = createCourseSchema.partial()

// ====================
// Session Schemas
// ====================

export const createSessionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  startDate: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  endDate: z
    .string()
    .datetime()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  location: z.string().optional(),
  instructorName: z.string().optional(),
  maxStudents: z.number().min(1).optional(),
  price: z.number().min(0).optional()
})

export const updateSessionSchema = createSessionSchema.partial()

// ====================
// Booking Schemas
// ====================

export const createBookingSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  notes: z.string().optional(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'CASH']).optional()
})

export const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  notes: z.string().optional()
})

// ====================
// Customer Schemas
// ====================

export const createCustomerSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional()
})

export const updateCustomerSchema = createCustomerSchema.partial()

// ====================
// Contact Form Schema
// ====================

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100)
    .transform((name) => validator.escape(name)),
  email: emailSchema,
  phone: phoneSchema,
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200)
    .transform((subject) => validator.escape(subject)),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .transform((message) => validator.escape(message))
})

// ====================
// Settings Schema
// ====================

export const updateSettingsSchema = z.object({
  whiteLabel: z.boolean().optional(),
  customDomain: z.boolean().optional(),
  emailFromName: z.string().max(100).optional(),
  emailFromAddress: emailSchema.optional(),
  notificationsEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional()
})

// ====================
// Query Parameter Schemas
// ====================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional()
})

// ====================
// ID Validation
// ====================

export const idSchema = z.string().min(1, 'ID is required')

// ====================
// Generic Validation Helper
// ====================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

/**
 * Format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }

  return formatted
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  return validator.escape(html)
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!validator.isURL(url)) {
    return null
  }

  // Remove javascript: and data: protocols
  if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
    return null
  }

  return url
}

/**
 * Validate UUID
 */
export function isValidUuid(id: string): boolean {
  return validator.isUUID(id)
}

/**
 * Validate and normalize email
 */
export function normalizeEmail(email: string): string | null {
  if (!validator.isEmail(email)) {
    return null
  }

  return validator.normalizeEmail(email)
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return validator.isAlphanumeric(str)
}

/**
 * Trim and escape string
 */
export function sanitizeString(str: string): string {
  return validator.escape(validator.trim(str))
}
