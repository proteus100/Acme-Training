/**
 * Production Error Handler
 * Ensures sensitive information is never exposed to clients
 */

export interface ApiError {
  statusCode: number
  message: string
  code?: string
  details?: unknown
}

export interface SafeErrorResponse {
  error: string
  message: string
  code?: string
  requestId?: string
}

/**
 * Create a safe error response for production
 */
export function createSafeErrorResponse(
  error: unknown,
  requestId?: string
): SafeErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Log the full error server-side
  console.error('[Error Handler]', {
    error,
    requestId,
    timestamp: new Date().toISOString()
  })

  // If it's a known ApiError, use its properties
  if (isApiError(error)) {
    return {
      error: error.message,
      message: error.message,
      code: error.code,
      requestId
    }
  }

  // For Error objects, only show message in development
  if (error instanceof Error) {
    return {
      error: 'Internal Server Error',
      message: isDevelopment
        ? error.message
        : 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
      requestId
    }
  }

  // For unknown errors, be very conservative
  return {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    code: 'UNKNOWN_ERROR',
    requestId
  }
}

/**
 * Check if error is an ApiError
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  )
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  statusCode?: number,
  requestId?: string
): Response {
  const safeError = createSafeErrorResponse(error, requestId)
  const status = statusCode || (isApiError(error) ? error.statusCode : 500)

  return new Response(JSON.stringify(safeError), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-ID': requestId })
    }
  })
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<Response>
): (request: Request, context?: any) => Promise<Response> {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      const requestId = crypto.randomUUID()
      return createErrorResponse(error, undefined, requestId)
    }
  }
}

/**
 * Create a custom API error
 */
export class CustomApiError extends Error implements ApiError {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'CustomApiError'
  }
}

/**
 * Common API errors
 */
export const ApiErrors = {
  BadRequest: (message = 'Bad Request', details?: unknown) =>
    new CustomApiError(400, message, 'BAD_REQUEST', details),

  Unauthorized: (message = 'Unauthorized', details?: unknown) =>
    new CustomApiError(401, message, 'UNAUTHORIZED', details),

  Forbidden: (message = 'Forbidden', details?: unknown) =>
    new CustomApiError(403, message, 'FORBIDDEN', details),

  NotFound: (message = 'Not Found', details?: unknown) =>
    new CustomApiError(404, message, 'NOT_FOUND', details),

  Conflict: (message = 'Conflict', details?: unknown) =>
    new CustomApiError(409, message, 'CONFLICT', details),

  UnprocessableEntity: (message = 'Unprocessable Entity', details?: unknown) =>
    new CustomApiError(422, message, 'UNPROCESSABLE_ENTITY', details),

  TooManyRequests: (message = 'Too Many Requests', details?: unknown) =>
    new CustomApiError(429, message, 'TOO_MANY_REQUESTS', details),

  InternalServer: (message = 'Internal Server Error', details?: unknown) =>
    new CustomApiError(500, message, 'INTERNAL_SERVER_ERROR', details),

  ServiceUnavailable: (message = 'Service Unavailable', details?: unknown) =>
    new CustomApiError(503, message, 'SERVICE_UNAVAILABLE', details)
}

/**
 * Sanitize error for logging (remove sensitive data)
 */
export function sanitizeErrorForLogging(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...(isApiError(error) && {
        statusCode: error.statusCode,
        code: error.code
      })
    }
  }

  return String(error)
}

/**
 * Create a request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
}

/**
 * Validate error response before sending
 * Ensures no sensitive data leaks
 */
export function validateErrorResponse(response: SafeErrorResponse): boolean {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /database/i,
    /connection[_-]?string/i,
    /^\/.+\/.+/, // File paths
    /stack trace/i
  ]

  const responseStr = JSON.stringify(response)

  for (const pattern of sensitivePatterns) {
    if (pattern.test(responseStr)) {
      console.warn('[Security] Potential sensitive data in error response:', {
        pattern: pattern.toString(),
        response
      })
      return false
    }
  }

  return true
}
