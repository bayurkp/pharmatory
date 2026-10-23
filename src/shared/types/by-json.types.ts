/**
 * ByJSON Specification (Version 2.0)
 * Formal Wire-Level Type Definitions
 * Specification reference: https://github.com/bayurkp/by-json
 */

export interface ByJsonPaginationLinks {
  self: string
  first?: string
  prev: string | null
  next: string | null
  last?: string | null
}

export interface ByJsonOffsetPagination {
  type: 'offset'
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  links?: ByJsonPaginationLinks
}

export interface ByJsonCursorPagination {
  type: 'cursor'
  perPage: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor: string | null
  prevCursor?: string | null
  links?: ByJsonPaginationLinks
}

export type ByJsonPagination = ByJsonOffsetPagination | ByJsonCursorPagination

export interface ByJsonMeta {
  requestId: string
  timestamp: string
  serverTime?: string
  retryAfter?: number
  deprecation?: {
    sunsetDate: string
    successor: string
  }
  pagination?: ByJsonPagination
}

export interface ByJsonErrorDetail {
  field: string
  code: string
  message: string
}

export interface ByJsonErrorPayload {
  code: string
  message: string
  details?: ByJsonErrorDetail[]
}

export interface ByJsonSuccessResponse<T> {
  success: true
  data: T
  error: null
  meta: ByJsonMeta
}

export interface ByJsonErrorResponse {
  success: false
  data: null
  error: ByJsonErrorPayload
  meta: ByJsonMeta
}

export type ByJsonResponse<T> = ByJsonSuccessResponse<T> | ByJsonErrorResponse
