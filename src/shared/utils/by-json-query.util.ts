import { AppError } from '../errors/app-error.js'

export interface SortCriterion {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Parses ByJSON v2.0 sort query parameter.
 * Supports:
 * - Repeated keys: ?sort=+difficulty&sort=-durationMinutes
 * - Comma-separated: ?sort=+difficulty,-durationMinutes
 * - Prefix '+' (or none) for ascending, '-' for descending.
 */
export function parseSortQuery(sortParam?: string | string[]): SortCriterion[] {
  if (!sortParam) return []

  const tokens = Array.isArray(sortParam)
    ? sortParam.flatMap((s) => s.split(','))
    : sortParam.split(',')

  const criteria: SortCriterion[] = []
  const seenFields = new Set<string>()

  for (const raw of tokens) {
    const token = raw.trim()
    if (!token) continue

    let order: 'asc' | 'desc' = 'asc'
    let field = token

    if (token.startsWith('-')) {
      order = 'desc'
      field = token.slice(1).trim()
    } else if (token.startsWith('+')) {
      order = 'asc'
      field = token.slice(1).trim()
    } else if (raw.startsWith(' ') || token.startsWith(' ')) {
      // Standard HTTP query string decoding translates '+' into a space ' '
      order = 'asc'
      field = token.trim()
    }

    if (!field || seenFields.has(field)) continue

    seenFields.add(field)
    criteria.push({ field, order })
  }

  return criteria
}

/**
 * Validates that requested sort criteria fields belong to the allowed field list.
 * Throws ByJSON HTTP 422 validation_error if illegal field is requested.
 */
export function validateSortFields(criteria: SortCriterion[], allowedFields: string[]): void {
  for (const c of criteria) {
    if (!allowedFields.includes(c.field)) {
      throw new AppError(
        `Invalid sort field '${c.field}'. Allowed fields: [${allowedFields.join(', ')}]`,
        422,
        'validation_error',
        [
          {
            field: 'sort',
            code: 'invalid_enum_value',
            message: `Field '${c.field}' is not allowed for sorting. Allowed fields: [${allowedFields.join(', ')}]`
          }
        ]
      )
    }
  }
}

/**
 * Applies multi-field chained sorting to an in-memory collection.
 * Includes deterministic tie-breaker fallback to the primary key.
 */
export function applyMultiFieldSort<T>(
  items: T[],
  criteria: SortCriterion[],
  tieBreakerKey: keyof T = 'id' as keyof T
): T[] {
  if (criteria.length === 0) {
    return [...items]
  }

  return [...items].sort((a, b) => {
    for (const { field, order } of criteria) {
      const valA = (a as Record<string, unknown>)[field]
      const valB = (b as Record<string, unknown>)[field]
      const mult = order === 'desc' ? -1 : 1

      if (valA === valB) continue

      if (valA === undefined || valA === null) return 1
      if (valB === undefined || valB === null) return -1

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * mult
      }

      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return (Number(valA) - Number(valB)) * mult
      }

      const strA = String(valA)
      const strB = String(valB)
      const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
      if (cmp !== 0) {
        return cmp * mult
      }
    }

    // Deterministic tie-breaker
    const tieA = (a as Record<string, unknown>)[tieBreakerKey as string]
    const tieB = (b as Record<string, unknown>)[tieBreakerKey as string]
    if (tieA !== undefined && tieB !== undefined) {
      return String(tieA).localeCompare(String(tieB), undefined, { numeric: true })
    }

    return 0
  })
}

/**
 * Normalizes multi-value query parameter from repeated keys or comma-separated string.
 * Example: ['Surabaya', 'Malang'] or 'Surabaya,Malang' -> ['Surabaya', 'Malang']
 */
export function parseArrayQueryParam(param?: string | string[]): string[] | undefined {
  if (!param) return undefined
  const items = Array.isArray(param) ? param.flatMap((p) => p.split(',')) : param.split(',')
  const cleaned = items.map((s) => s.trim()).filter(Boolean)
  return cleaned.length > 0 ? cleaned : undefined
}
