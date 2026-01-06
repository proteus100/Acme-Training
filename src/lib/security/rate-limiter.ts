/**
 * Rate Limiter Implementation
 * Prevents brute force attacks by limiting request frequency
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked?: boolean
}

/**
 * Rate limit a request based on identifier (IP, email, etc.)
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // If no entry exists, create one
  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    })

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs
    }
  }

  // If currently blocked, check if block has expired
  if (entry.blocked) {
    if (now > entry.resetTime) {
      // Block expired, reset
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false
      })

      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: now + config.windowMs
      }
    }

    // Still blocked
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true
    }
  }

  // If window has expired, reset
  if (now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    })

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: now + config.windowMs
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxAttempts) {
    // Block if configured
    if (config.blockDurationMs) {
      entry.blocked = true
      entry.resetTime = now + config.blockDurationMs
      rateLimitStore.set(identifier, entry)

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true
      }
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    ...(result.blocked && { 'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString() })
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Admin login: 5 attempts per 15 minutes, block for 30 minutes
  ADMIN_LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000
  },

  // NextAuth: 10 attempts per 15 minutes
  NEXT_AUTH: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000
  },

  // API endpoints: 30 requests per minute
  API_GENERAL: {
    maxAttempts: 30,
    windowMs: 60 * 1000
  },

  // Booking endpoints: 20 requests per minute
  API_BOOKING: {
    maxAttempts: 20,
    windowMs: 60 * 1000
  },

  // Contact forms: 5 submissions per hour
  CONTACT_FORM: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000
  }
}

/**
 * Clear rate limit for identifier (useful after successful login)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}
