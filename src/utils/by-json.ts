/**
 * ByJSON Specification (Version 2.0)
 * Specification Reference: https://github.com/bayurkp/by-json
 */

export interface ByJsonPaginationLinks {
  self: string
  first: string
  prev: string | null
  next: string | null
  last: string | null
}

export interface ByJsonOffsetPagination {
  type: 'offset'
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  links: ByJsonPaginationLinks
}

export interface ByJsonCursorPagination {
  type: 'cursor'
  perPage: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor: string | null
  prevCursor: string | null
  links: {
    self: string
    next: string | null
    prev: string | null
  }
}

export type ByJsonPagination = ByJsonOffsetPagination | ByJsonCursorPagination

export interface ByJsonMeta {
  requestId: string
  timestamp: string
  pagination?: ByJsonPagination
  serverTime?: string
  retryAfter?: number
  deprecation?: {
    sunsetDate: string
    successor: string
  }
  [key: string]: unknown
}

export interface ByJsonErrorDetail {
  field: string
  code: string
  message: string
}

export interface ByJsonError {
  code: string
  message: string
  details?: ByJsonErrorDetail[]
}

export type ByJsonSuccessResponse<T> = {
  success: true
  data: T
  error: null
  meta: ByJsonMeta
}

export type ByJsonErrorResponse = {
  success: false
  data: null
  error: ByJsonError
  meta: ByJsonMeta
}

export type ByJsonResponse<T> = ByJsonSuccessResponse<T> | ByJsonErrorResponse

/**
 * Creates a ByJSON v2.0 compliant Success Response envelope.
 */
export function byJsonSuccess<T>(
  data: T,
  requestId: string,
  metaOverrides?: Partial<ByJsonMeta>
): ByJsonSuccessResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...metaOverrides
    }
  }
}

/**
 * Creates a ByJSON v2.0 compliant Error Response envelope.
 */
export function byJsonError(
  code: string,
  message: string,
  requestId: string,
  details?: ByJsonErrorDetail[],
  metaOverrides?: Partial<ByJsonMeta>
): ByJsonErrorResponse {
  const errorObj: ByJsonError = {
    code,
    message
  }

  if (details && details.length > 0) {
    errorObj.details = details
  }

  return {
    success: false,
    data: null,
    error: errorObj,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...metaOverrides
    }
  }
}

/**
 * Helper to build OpenAPI 3.1 response schema wrapped in ByJSON envelope.
 */
export function buildByJsonSuccessSchema(
  dataSchema: object,
  exampleRequestId = '8f830a6e-4e8c-4a37-b6e5-22e70df4ab75'
) {
  return {
    type: 'object',
    required: ['success', 'data', 'error', 'meta'],
    properties: {
      success: { type: 'boolean', example: true },
      data: dataSchema,
      error: { type: 'null', nullable: true, example: null },
      meta: {
        type: 'object',
        required: ['requestId', 'timestamp'],
        properties: {
          requestId: { type: 'string', example: exampleRequestId },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}

/**
 * Helper to build OpenAPI 3.1 error response schema wrapped in ByJSON envelope.
 */
export function buildByJsonErrorSchema(
  defaultCode = 'validation_error',
  defaultMessage = 'The request data is invalid.'
) {
  return {
    type: 'object',
    required: ['success', 'data', 'error', 'meta'],
    properties: {
      success: { type: 'boolean', example: false },
      data: { type: 'null', nullable: true, example: null },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: defaultCode },
          message: { type: 'string', example: defaultMessage },
          details: {
            type: 'array',
            items: {
              type: 'object',
              required: ['field', 'code', 'message'],
              properties: {
                field: { type: 'string', example: 'name' },
                code: { type: 'string', example: 'missing_field' },
                message: { type: 'string', example: 'The name is required.' }
              }
            }
          }
        }
      },
      meta: {
        type: 'object',
        required: ['requestId', 'timestamp'],
        properties: {
          requestId: { type: 'string', example: 'a90184b2-c0cf-46d4-8395-927932e6a987' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}
