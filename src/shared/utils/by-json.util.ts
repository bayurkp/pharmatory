import crypto from 'node:crypto'
import {
  ByJsonSuccessResponse,
  ByJsonErrorResponse,
  ByJsonMeta,
  ByJsonErrorDetail,
  ByJsonPagination
} from '../types/by-json.types.js'

export function createByJsonMeta(
  requestId?: string,
  pagination?: ByJsonPagination,
  extra?: { serverTime?: string; retryAfter?: number }
): ByJsonMeta {
  const now = new Date().toISOString()
  return {
    requestId: requestId || crypto.randomUUID(),
    timestamp: now,
    ...(extra?.serverTime ? { serverTime: extra.serverTime } : {}),
    ...(typeof extra?.retryAfter === 'number' ? { retryAfter: extra.retryAfter } : {}),
    ...(pagination ? { pagination } : {})
  }
}

export function byJsonSuccess<T>(
  data: T,
  requestId?: string,
  pagination?: ByJsonPagination,
  extra?: { serverTime?: string; retryAfter?: number }
): ByJsonSuccessResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: createByJsonMeta(requestId, pagination, extra)
  }
}

export function byJsonError(
  code: string,
  message: string,
  requestId?: string,
  details?: ByJsonErrorDetail[],
  extra?: { serverTime?: string; retryAfter?: number }
): ByJsonErrorResponse {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {})
    },
    meta: createByJsonMeta(requestId, undefined, extra)
  }
}

export function buildByJsonSuccessSchema(dataSchema: Record<string, unknown>, description = 'Successful operation') {
  return {
    description,
    type: 'object',
    required: ['success', 'data', 'error', 'meta'],
    properties: {
      success: { type: 'boolean', const: true },
      data: dataSchema,
      error: { type: 'null' },
      meta: {
        type: 'object',
        required: ['requestId', 'timestamp'],
        properties: {
          requestId: { type: 'string', format: 'uuid' },
          timestamp: { type: 'string', format: 'date-time' },
          serverTime: { type: 'string', format: 'date-time' },
          retryAfter: { type: 'integer' },
          pagination: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['offset', 'cursor'] },
              page: { type: 'integer' },
              perPage: { type: 'integer' },
              totalItems: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNext: { type: 'boolean' },
              hasPrev: { type: 'boolean' },
              nextCursor: { type: 'string', nullable: true },
              prevCursor: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  }
}

export function buildByJsonErrorSchema(description = 'Error response') {
  return {
    description,
    type: 'object',
    required: ['success', 'data', 'error', 'meta'],
    properties: {
      success: { type: 'boolean', const: false },
      data: { type: 'null' },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'validation_error' },
          message: { type: 'string', example: 'The request payload failed validation.' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              required: ['field', 'code', 'message'],
              properties: {
                field: { type: 'string', example: 'items.0.quantity' },
                code: { type: 'string', example: 'minimum_value' },
                message: { type: 'string', example: 'must be >= 1' }
              }
            }
          }
        }
      },
      meta: {
        type: 'object',
        required: ['requestId', 'timestamp'],
        properties: {
          requestId: { type: 'string', format: 'uuid' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}
